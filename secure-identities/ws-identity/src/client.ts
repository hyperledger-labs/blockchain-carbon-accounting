import {
  Logger,
  LoggerProvider,
  LogLevelDesc
} from '@hyperledger/cactus-common'
import WebSocket from 'ws'
import { KJUR } from 'jsrsasign'
// import { WsWalletReq, WsWalletRes } from 'ws-wallet'

export interface WSClientOpts {
  // web socket used to communicate with external client
  webSocket: WebSocket;
  // Ecdsa object from jsrsasign package used in the getPub method
  // Built before creating a new client to verify the incoming webSocket connection
  pubKeyEcdsa: KJUR.crypto.ECDSA;
  logLevel?: LogLevelDesc;
}

export class WebSocketClient {
  public readonly className = 'WebSocketClient';
  public readonly pubKeyEcdsa: KJUR.crypto.ECDSA; // KJUR.crypto.ECDSA for csr requests;
  public readonly pubKeyHex: string;
  public readonly keyName: string;
  private readonly log: Logger;
  private readonly webSocket: WebSocket;
  private digestQueue: Buffer[] = []; // Array of Digests to queue signing requests in series
  private queueI = 0;
  constructor (opts: WSClientOpts) {
    this.log = LoggerProvider.getOrCreate({
      label: 'WebSocketClient',
      level: opts.logLevel || 'INFO'
    })
    this.webSocket = opts.webSocket
    this.pubKeyEcdsa = opts.pubKeyEcdsa
    this.pubKeyHex = this.pubKeyEcdsa.pubKeyHex
    this.keyName = `${this.pubKeyHex.substring(0, 12)}...`
  }

  /**
   * @description : sign message and return in a format that fabric understand
   * @param digest to be singed
   */
  async sign (digest: Buffer): Promise<Buffer> {
    const fnTag = `${this.className}#sign`
    const { pubKeyHex, pubKeyEcdsa, webSocket, log } = this
    log.debug(
      `${fnTag} send digest for pub-key ${this.keyName}: digest-size = ${digest.length}`
    )
    try {
      if (this.digestQueue[this.queueI]) {
        throw new Error(`${fnTag} digest is processing in queue at index ${this.queueI}, signature not sent`)
        // TODO handle parrallel signature requests?
        // do we expect the client to return signatures in different order than received?
        // this could be achieved by sending and returning the queueI in the message
      }
      if (webSocket.readyState !== 1) {
        throw new Error(`ws connection is not open, current state is ${this.webSocket.readyState}`)
      }
      // add digest queue and increment index
      this.digestQueue.push(digest)
      this.queueI += 1
      const { digestQueue, queueI } = this
      return new Promise(function (resolve, reject) {
        // const message:WsWalletReq = {digest: digest,index: queueI};
        webSocket.send(digest, function e () {
          log.debug(`${fnTag} wait for digest ${queueI} to be signed`)
        })
        webSocket.addEventListener(
          'message',
          function incoming (message) { // message: WsWalletRes
            log.debug(
              `append signature to digest queue index ${queueI} and mark as processed`
            )
            const verified = pubKeyEcdsa.verifyHex(
              digestQueue[queueI - 1].toString('hex'),
              message.data.toString('hex'),
              pubKeyHex
            )
            // to save on memory queue elements are now deleted after signature is received
            delete digestQueue[queueI - 1]
            if (!verified) {
              const err = `signature for digest queue index ${queueI} does not match the public key, web socket connection closed`
              webSocket.close()
              reject(new Error(err))
            }
            resolve(message.data)
          },
          // event listener required once for each signature !
          { once: true }
        )
      })
      // to save on memory queue elements are now deleted after signature is receive
    } catch (error) {
      this.log.error(error)
    }
  }

  public close () {
    this.webSocket.close()
  }
}
