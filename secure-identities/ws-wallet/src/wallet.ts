import WebSocket from 'ws'
import fs from 'fs'
import elliptic from 'elliptic'
import { 
  keyGen, 
  getKeyPath, 
  getPass, 
  IClientNewKey, 
  KeyData, 
  ECCurveType } from './util'
import { KEYUTIL } from 'jsrsasign'
import {
  Logger,
  Checks,
  LogLevelDesc,
  LoggerProvider
} from '@hyperledger/cactus-common'
import readline from 'readline';
import axios from 'axios';


type IEcdsaCurves = {
  [key: string]: elliptic.ec;
};
const EC = elliptic.ec
const ecdsaCurves = {}
for (const value in ECCurveType) {
  ecdsaCurves[value] = new EC(value)
}

export interface WsWalletOpts {
  // url of the server the wallet will connect to
  endpoint?: string;
  keyName?: string;
  curve?: ECCurveType;
  logLevel?: LogLevelDesc;
  password?: string
  // set to false for testing https/wss
  strictSSL?: boolean;
}

export interface WsWalletRes {
  signature: Buffer;
  index: number;
}
export interface WsWalletReq {
  digest: Buffer;
  index: number;
}

export interface IWebSocketKey {
  signature:string;
  sessionId:string;
}

export class WsWallet {
  public readonly className = 'WsWallet';
  private readonly log: Logger;
  private readonly endpoint: string;
  private ecdsaCurves: IEcdsaCurves;
  private keyData: KeyData;
  private ws?: WebSocket;

  constructor (private readonly opts: WsWalletOpts) {
    const fnTag = `${this.className}#constructor()`
    Checks.truthy(opts, `${fnTag} arg options`)
    this.log = LoggerProvider.getOrCreate({
      label: 'WsWallet',
      level: opts.logLevel || 'TRACE'
    })
    this.opts.keyName = opts.keyName || 'default'
    this.keyData = this.initKey(this.opts as IClientNewKey) 
  }

  /**
   * @description will generate a new EC private key, or get existing key it already exists
   * @param args;
   * @type IClientNewKey
   */
  private initKey (args: IClientNewKey): KeyData {
    const fnTag = `${this.className}#initKey`
    this.log.debug(
      `${fnTag} look for key with name '${args.keyName}' or generate new key`
    )
    this.close();
    const info = []
    const keyPath = getKeyPath(args.keyName)
    if (!fs.existsSync(keyPath)) {
      info.push(keyGen(args))
    }
    info.push(`extracting key '${args.keyName}' from key store`)
    this.opts.keyName = args.keyName
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    const curve = keyData.curve
    if (args.curve && curve !== args.curve) {
      info.push(
        `the requested curve type (${args.curve}) is different than the existing key: ${curve}`
      )
    }
    const result = info.join('\n')
    this.log.debug(`${fnTag} ${result}`)
    return keyData
  }

  /**
   * @description Closes existing and open new websocket connection for client
   */
  public async open (sessionId: string, endpoint?: string): Promise<IWebSocketKey> {
    const fnTag = `${this.className}#open`
    this.opts.endpoint = endpoint || this.opts.endpoint
    Checks.nonBlankString(this.opts.endpoint, `${fnTag}:this.opts.endpoint`)
    this.log.debug(`${fnTag} web-socket connection to ${this.opts.endpoint} for ${this.opts.keyName}`)
    this.close()
    try {
      this.log.debug(`${fnTag} retrieve password to unlock private key`)
      this.opts.password = await unlockKey(this.keyData,this.opts.password,this.log)

      this.log.debug(`${fnTag} sign session ID for ${this.getPubKeyHex().substring(0, 12)}...`)

      const sessionSignature = (await this.sign(
        Buffer.from(sessionId, 'hex'),
        this.keyData,
        this.opts.password,
        this.log,
      )).toString('hex')

      const wsOpts = {
        rejectUnauthorized: this.opts.strictSSL !== false,
        headers: {
          'x-signature': sessionSignature,
          'x-session-id': sessionId,
          'x-pub-key-pem': JSON.stringify(this.keyData.pubKey)
        }
      }
      this.log.debug(`${fnTag} create web-socket client for ${this.opts.endpoint}`)
      this.ws = new WebSocket(this.opts.endpoint, wsOpts)

      const { opts, ws, sign, keyData, log } = this
      this.ws.onopen = function () {
        log.info(`${fnTag} connection opened to ${opts.endpoint} for key ${opts.keyName}`)
      }
      this.ws.on('message', async function incoming (digest:Buffer) { // message: WsWalletReq
        const signature = await sign(digest,keyData,opts.password,log)
        // const resp:WsWalletRes = {signature,index: message.index}
        log.info(`${fnTag} send signature to ${ws.url}: ${signature.toString('base64')}`)
        ws.send(signature)
      })
      this.ws.onclose = function incoming () {
        log.info(`${fnTag} connection to ${opts.endpoint} closed for key ${opts.keyName}`)
      }
      return await new Promise<IWebSocketKey>(function (resolve, reject) {
        ws.addEventListener(
          'open',
          function incoming () {
            resolve({
              signature: sessionSignature,
              sessionId
            })
          },
          { once: true }
        ) as IWebSocketKey
        ws.onerror = function (error) {
          // TODO extract error message from failed connection
          ws.close()
          reject(new Error(error.error?.rawPacket?.toString()))
        }
      })
    } catch (error) {
      this.log.error(
        `${fnTag} failed to connect to ${this.opts.endpoint}: ${error}`
      )
      //throw new Error(error)
    }
  }

  /**
   * @description : close the WebSocket
   */
  async close (): Promise<void> {
    if (this.ws) {
      this.ws.close()
    }
  }

  /**
   * @description send out pubKey
   * @return pubKey pem file
   */
  getPubKeyHex () {
    const { pubKeyHex } = KEYUTIL.getKey(this.keyData.pubKey)
    return pubKeyHex
  }

  /**
   * @description request new session with ws-identity server (identity proxy 
   * to communicate with Fabric application) and webSocketKey for the session
   * @param userId : name of key file stored by ws-wallet locally 
   * also sets the userID fof storing the WS-X.509 certificate enrolled with Fabric;
   * @param endpoint: url to access of the Fabric application API
   * to request a new ws-identity session ticket
   * @return IWebSocketKey: the key needed to access the open web-socket conneciton
   * @note the session ticket must be requested by the Fabric app
   * The ws-identity server matches the IP used to request the ticket with
   * the IP connecting to it later (other apps can't use the same sessionId)
   */
  public async newSession(
    endpoint:string,
    keyName:string,
    curve?:ECCurveType):Promise<IWebSocketKey>{ 
    const fnTag = '#newSession'
    this.log.debug(`${fnTag} open new web-socket session`)
    let wsKey:IWebSocketKey;

    try{
      await this.approveRequest(endpoint)
      let resp;
      if(!this.opts.password){
        this.log.info(`${fnTag} request declined`)
        return
      }
      await axios.post(endpoint,{key_name: keyName},
        {
          headers: {
            'accept': 'application/json',
            'pub_key_hex': this.getPubKeyHex()
          },
        },
      ).then(async function(response) {
        resp = response.data;
      });
      const {sessionId,url} = resp;
      wsKey = await this.open(sessionId,url);
      this.log.info(`${fnTag} web socket key issued`)
      return wsKey; 
    }catch(err){
      this.log.error(`${fnTag} error opening session ${err}`)
    }
  }
  private async approveRequest(endpoint){
    const fnTag = '#approveRequest'
    let { password } = this.opts
    this.log.info(`${fnTag} issue web-socket key for 3rd party application using endpoint ${endpoint}?`) 
    this.opts.password = await new Promise(async function (resolve, reject) {
      const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
      });
      if(password){
        rl.question('Yes(y) | No(n) :', function(approval) {
          rl.close();
          if(!approval.toLowerCase().charAt(0).includes("y")){
            reject(null)
          }
        })
      }else{
        rl.close();
        password = await getPass()
      }
      resolve(password)
    })
  }

  /**s
  * @description generate
  * @param prehashed digest as Buffer
  * @returns signature as string
  */
  private async sign(digest: Buffer, keyData:KeyData, password: string, log:any): Promise<Buffer> { 
    const fnTag = '#sign'
    log.debug(`${fnTag} digest-size = ${digest.length}`)
    try {
      const { prvKeyHex } = KEYUTIL.getKey(keyData.key, password)
      const ecdsa = ecdsaCurves[keyData.curve]
      const signKey = ecdsa.keyFromPrivate(prvKeyHex, 'hex')
      const sig = ecdsa.sign(digest, signKey)
      const signature = Buffer.from(sig.toDER())
      return signature
    } catch (error) {
      console.log(error)
      throw new Error(`${fnTag} failed to produce signature: ${error}`)
    }
  }
}

function unlockKey(keyData:KeyData,password?,log?,attempt=1): Promise<string>{
  return new Promise(function (resolve, reject) {
    
    if(attempt<4){
      setTimeout(async function () {
        password = await getPass(password);
        try {
          KEYUTIL.getKey(keyData.key, password)
          resolve(password)
        }catch(err){
          attempt += 1
          log.error(`Error unlocking key file: ${err}`)
          unlockKey(keyData,null,log,attempt).then(resolve)
        }
      })
    }else{
      reject(new Error('Too many failed password attempts'))
    }
  })
}

/**
 * Forces a process to wait until the socket's `readyState` becomes the specified value.
 * not to be used in production !!!
 * @param socket The socket whose `readyState` is being watched
 * @param state The desired `readyState` for the socket
 */
export function waitForSocketState (
  socket: WebSocket,
  state: number
): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      setTimeout(function () {
        if (socket.readyState === state) {
          resolve()
        } else {
          waitForSocketState(socket, state).then(resolve)
        }
      })
    } catch (err) {
      reject(new Error(`Error waiting for socket state ${state}: ${err})`))
    }
  })
}
