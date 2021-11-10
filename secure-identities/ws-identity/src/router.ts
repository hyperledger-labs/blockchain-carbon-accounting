// fabricRegistry.ts : exposes endpoint for registering and enrolling fabric user
import { LogLevelDesc } from '@hyperledger/cactus-common'
import { Application, Router, Request, Response } from 'express'
import { getClientIp } from '@supercharge/request-ip'
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
  public readonly router: Router;

  constructor (private readonly opts: WsIdentityRouterOpts) {
    opts.logLevel = opts.logLevel || 'info';
    const auth = async (req: Request, res: Response, next) => {
      const sessionId = req.header('x-session-id')
      const signature = req.header('x-signature')

      // if (!signature && !sessionId) {
      if (!signature) {
        return res.sendStatus(403)
      }
      try {
        const clientIp = getClientIp(req);
        (req as any).client = wsIdentityServer.getClient(clientIp, sessionId, signature)
      } catch (error) {
        return res.status(409).json({
          msg: error.message
        })
      }
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
        wsIdentityServer,
        logLevel: opts.logLevel
      })

    const wsClientRouter =
      new WsClientRouter({
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
