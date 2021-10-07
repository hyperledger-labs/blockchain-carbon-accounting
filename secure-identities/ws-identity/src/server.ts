import {
  LogLevelDesc,
  Logger,
  LoggerProvider
} from '@hyperledger/cactus-common'
import WebSocket from 'ws'
import { KEYUTIL } from 'jsrsasign'
import { URL } from 'url'
import path from 'path'
import { randomBytes } from 'crypto'
import http, { Server } from 'http'
import net from 'net'
import {
  WebSocketClient,
  WSClientOpts
} from './client'
import { getClientIp } from '@supercharge/request-ip'

export interface WsIdentityServerOpts {
  // existing server where all incoming web socket connections are directed.
  server: Server;
  // path where for all incoming web-socket connections should be sent
  // TODO currently optional. setting this will generate error
  // if incoming connections are not directed here
  wsMount?: string;

  logLevel: LogLevelDesc;
}

interface WebSocketTicket {
  pubKeyHex: string;
  ip: string;
  wsMount: string;
}

interface IWebSocketClients {
  // the pubKeyHex of the client or client abject instance
  // key is a unique/ranfrom session ID provided to the external client
  [key: string]: null | WebSocketTicket | WebSocketClient;
}

export class WsIdentityServer {
  public readonly className = 'WsIdentityServer';
  private clients: IWebSocketClients = {};
  private readonly log: Logger;
  private readonly webSocketServer: WebSocket.Server;
  private readonly wsUrl: URL;

  constructor (private readonly opts: WsIdentityServerOpts) {
    const fnTag = `${this.className}#constructor`
    this.log = LoggerProvider.getOrCreate({
      level: opts.logLevel || 'INFO',
      label: this.className
    })
    this.webSocketServer = new WebSocket.Server({
      noServer: true,
      path: opts.wsMount
      // clientTracking: true,
    })
    const { log, clients, webSocketServer } = this
    opts.server.on('upgrade', function upgrade (
      request: http.IncomingMessage,
      socket: net.Socket,
      head: Buffer
    ) {
      log.debug(
        `${fnTag} validate server upgrade for ${request.url} before connecting web-socket`
      )
      try {
        const headers = request.headers
        const sessionId = headers['x-session-id'] as string
        const signature = headers['x-signature'] as string
        const pubKeyPem = JSON.parse(headers['x-pub-key-pem'] as string)

        if (!sessionId) {
          throw new Error('header \'session-id\' not provided')
        }
        if (!signature) {
          throw new Error('header \'signature\' not provided')
        }
        if (!pubKeyPem) {
          throw new Error('header \'pub-key-pem\' not provided')
        }

        const client = clients[sessionId] as WebSocketTicket
        if (!client) {
          throw new Error(
            `no ticket open for client with sessionId ${sessionId} `
          )
        }
        if (client.constructor.name === 'WebSocketClient') {
          throw new Error(
            `a connection has already been opened for sessionId ${sessionId}`
          )
        }
        const url = new URL(path.join(request.headers.origin, request.url))

        log.debug(`${fnTag} check that request matches ws mount path ${client.wsMount}`)

        if (url.pathname !== client.wsMount) {
          throw new Error(
            `incorrect path ${url.pathname} for connection to sessionId ${sessionId}`
          )
        }
        const connectionParams = url.searchParams
        if (connectionParams) {
          log.debug(
            `${fnTag} params received: ${connectionParams}`
          )
        }

        const clientIp = getClientIp(request)
        if (client.ip !== clientIp) {
          throw new Error(
            `the IP of the incomming clinet ${clientIp} does not match the registered IP ${client.ip}`
          )
        }

        log.info(
          `${fnTag} build public ECDSA curve to verify signature for session ID ${sessionId}`
        )

        const pubKeyHex: string = client.pubKeyHex
        const shortHex = `${pubKeyHex.substring(0, 12)}...}`
        const pubKeyEcdsa = KEYUTIL.getKey(pubKeyPem)
        if (!pubKeyEcdsa.verifyHex(sessionId, signature, pubKeyHex)) {
          throw new Error(`the signature does not match the public key ${shortHex}`)
        }

        webSocketServer.handleUpgrade(
          request as http.IncomingMessage,
          socket as net.Socket,
          head as Buffer, (webSocket) => {
            const wsClientOpts: WSClientOpts = {
              webSocket,
              pubKeyEcdsa,
              logLevel: opts.logLevel
            }
            clients[sessionId] = new WebSocketClient(wsClientOpts)
            webSocketServer.emit('connection', webSocket, sessionId)
          }
        )
      } catch (error) {
        socket.write(`${error}`)
        // socket.write(`${error}`)
        log.error(`${fnTag} incoming connection denied: ${error}`)
        // socket.destroy()
      }
    })
    webSocketServer.on('connection', function connection (
      webSocket: WebSocket,
      sessionId: string
    ) {
      const client = clients[sessionId] as null | WebSocketClient
      log.info(`session ${sessionId} in progress for ${client?.keyName}`)
      webSocket.onclose = function () {
        log.info(
          `${fnTag} client removed for sessionId ${sessionId} and pub-key-hex ${client?.keyName}`
        )
        delete clients[sessionId]
      }
    })
  }

  /**
   * @description create a unique sessionId for web socket connection for a given public key hex
   */
  public newSessionId (pubKeyHex: string, clientIp: string):
    {sessionId: string, wsMount: string } {
    const fnTag = `${this.className}#new-session-id`
    const sessionId = randomBytes(8).toString('hex')
    this.log.debug(
      `${fnTag} assign new session id ${sessionId} to public key ${pubKeyHex.substring(
        0,
        12
      )}...`
    )
    // TODO create unique mount path with dedicated router for the new sessionId
    // and send the url in the response
    this.clients[sessionId] = {
      pubKeyHex,
      ip: clientIp,
      wsMount: this.opts.wsMount
    } as WebSocketTicket

    return { sessionId, wsMount: this.opts.wsMount }
  }

  public close () {
    Object.values(this.clients).forEach((value) => {
      if (typeof value === 'object') {
        (value as WebSocketClient)?.close()
      }
    })
    this.clients = {}
    this.webSocketServer.close()
  }

  public getClient (sessionId: string, signature: string): WebSocketClient {
    const fnTag = `${this.className}#get-client`
    this.log.debug(`${fnTag} request client for sessionId ${sessionId}`)
    const client = this.clients[sessionId] as WebSocketClient
    let err
    if (client.constructor.name !== 'WebSocketClient') {
      err = `${fnTag} no client connected for sessionId ${sessionId}`
    } else if (
      !client.pubKeyEcdsa.verifyHex(sessionId, signature, client.pubKeyHex)
    ) {
      err = `${fnTag} the signature does not match the public key for sessionId ${sessionId}`
    }
    if (err) {
      throw new Error(err)
    }
    return client
  }

  /* Public function previously used for testing
      Not to be used in production!!!
  */
  public async waitForSocketClient (
    sessionId: string,
    address?: any
  ): Promise<void> {
    const { log, waitForSocketClient } = this
    const client = this.clients[sessionId]
    if (address) {
      log.info(
        `waiting for web-socket connection from client for ${sessionId}`
      )
    }
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (client.constructor?.name === 'WebSocketClient') {
          log.info(`web-socket client established for sessionId ${sessionId}`)
          resolve()
        } else {
          waitForSocketClient(sessionId).then(resolve)
        }
      })
    })
  }
}
