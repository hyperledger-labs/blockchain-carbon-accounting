// fabricRegistry.ts : exposes endpoint for registering and enrolling fabric user
import { Logger, LoggerProvider, LogLevelDesc } from '@hyperledger/cactus-common'
import { Application, Router, Request, Response } from 'express'
import {
  WsIdentityServer,
  WsIdentityServerOpts
} from './server'
import { WsSessionRouter } from './routers/session'
import { WsClientRouter } from './routers/client'
export interface WsIdentityRouterOpts {
    logLevel?: LogLevelDesc;
    app: Application;
    server: any;
    wsMount?: string;
}

export class WsIdentityRouter {
    public readonly className = 'WsIdentityRouter';
    private readonly log: Logger;
    public readonly router: Router;

    constructor (private readonly opts: WsIdentityRouterOpts) {
      opts.logLevel = opts.logLevel || 'info'
      this.log = LoggerProvider.getOrCreate({
        label: this.className, level: opts.logLevel
      })
      const auth = async (req: Request, res: Response, next) => {
        const sessionId = req.header('x-session-id')
        const signature = req.header('x-signature')
        if (!signature && !sessionId) {
          return res.sendStatus(403)
        }
        (req as any).client = wsIdentityServer.getClient(sessionId, signature)
        next()
      }

      const wsIdentityServerOpts: WsIdentityServerOpts = {
        wsMount: opts.wsMount,
        server: opts.server,
        logLevel: opts.logLevel
      }
      const wsIdentityServer = new WsIdentityServer(wsIdentityServerOpts)

      const wsSessionRouter =
        new WsSessionRouter({
          logLevel: opts.logLevel,
          wsIdentityServer: wsIdentityServer
        })

      const wsClientRouter =
        new WsClientRouter({
          wsIdentityServer: wsIdentityServer,
          logLevel: opts.logLevel
        })

      opts.app.use(
        '/v1/session',
        wsSessionRouter.router
      )
      opts.app.use(
        '/v1/identity',
        auth,
        wsClientRouter.router
      )
    }
}
