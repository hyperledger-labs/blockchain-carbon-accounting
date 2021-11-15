import { KEYUTIL } from 'jsrsasign';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export enum ECCurveType {
  p256 = 'p256',
  p384 = 'p384',
}
enum ECCurveLong {
  p256 = 'secp256r1',
  p384 = 'secp384r1',
}

export interface IClientNewKey {
  keyName: string;
  password?: string;
  curve?: ECCurveType;
}

export interface KeyData {
  curve: ECCurveType;
  key: string;
  pubKey: string;
}

const walletPath = path.join(__dirname, 'wallet')
if (!fs.existsSync(walletPath)) {
  console.log(`Make directory to store keys at ${walletPath}`)
  fs.mkdirSync(walletPath)
}

export function getKeyPath (keyName) {
  return path.join(walletPath, `${keyName}.key`)
}
/**
 * @description will generate a new EC key pair, or throw an error if a key with the requested name already existis.
 * @param args; @type IClientNewKey
 * @return pubKeyHex;
 */
export async function keyGen (args: IClientNewKey) {
  try {
    const info = []
    const keyPath = getKeyPath(args.keyName)
    if (fs.existsSync(keyPath)) {
      return `${args.keyName} key already exists`
    }
    if (!args.curve) {
      info.push('No curve specified. Set to p256 as default')
      args.curve = ECCurveType.p256
    }

    const ecdsaAlg = ECCurveLong[args.curve]
    info.push(`Create ${args.keyName} key with elliptical curve ${ecdsaAlg}`)
    const keyPair = KEYUTIL.generateKeypair('EC', ecdsaAlg)
    const pass = await getPass(args.password)
    const key = KEYUTIL.getPEM(keyPair.prvKeyObj, 'PKCS8PRV',pass)
    info.push(`key encrypted with password`)
    const pubKey = KEYUTIL.getPEM(keyPair.pubKeyObj)
    const keyData:KeyData = { key, pubKey, curve: args.curve }
    info.push(`Store private key data in ${keyPath}`)
    fs.writeFileSync(keyPath, JSON.stringify(keyData))
    const { pubKeyHex } = KEYUTIL.getKey(pubKey)
    info.push(`pubKeyHex: ${pubKeyHex}`)
    return info.join('\n')
  } catch (error) {
    throw new Error(`Error generating key ${error}`)
  }
}

export function getPubKeyHex (args: IClientNewKey) {
  const keyPath = getKeyPath(args.keyName)
  try {
    
    if (!fs.existsSync(keyPath)) {
      keyGen(args)
    }
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
    const { pubKeyHex } = KEYUTIL.getKey(keyData.pubKey)
    return pubKeyHex
  }catch(error) {
    throw new Error(`Error retrieving pub-key-hex: ${error}`)
  }
}
export async function getPass(password?):Promise<string>{
  
  return new Promise(function (resolve, reject) {
    if(!password){
      const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
      });
      rl.question(`Input password for your key file: `, function(pass) {
        rl.close();
        resolve(pass)
      });
      rl.on("close", function() {
        //process.exit(0);
      });
    }else(resolve(password))
  })
}

export function listKeys () {
  const keys = []
  fs.readdirSync(walletPath).forEach((file) => {
    const tmp = file.split('.')
    if (tmp[1] === 'key') keys.push(tmp[0])
  })
  return keys
}
import { WsWallet } from './wallet';
import { IWebSocketKey } from './wallet'

export async function newSession(
  endpoint:string,
  keyName:string,
  curve?:ECCurveType,
  password?:string,
  strictSSL?:boolean):Promise<IWebSocketKey|Error>{ 
  const wsWallet = new WsWallet({keyName,curve,password,strictSSL });
  const wsKey = await wsWallet.newSession(endpoint,keyName)
  return wsKey; 
}
  /**
   * @description open ws-idenity session client by signing the sessionId
   * @param endpoint: url of the web-socket server
   * @param sessionId: id of the session ticket to be signed
   * @param keyName: name of the key file used to sign the sesisonID
   * @return IWebSocketKey
   */
export async function openSession(
  endpoint:string,
  sessionId:string,
  keyName: string,
  password?:string,
  strictSSL?:boolean):Promise<IWebSocketKey> {
  const wsWallet = new WsWallet({ endpoint, keyName, password, strictSSL});
  try{
    const key:IWebSocketKey = await wsWallet.open(sessionId);
    return key
  }catch(err){
    //process.exit(err)
  }
}

