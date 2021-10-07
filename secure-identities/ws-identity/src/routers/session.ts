// fabricRegistry.ts : exposes endpoint for registering and enrolling fabric user
import { Logger, LoggerProvider, LogLevelDesc } from '@hyperledger/cactus-common'
import { Router, Request, Response } from 'express'
import { validationResult, body } from 'express-validator'
import { WsIdentityServer } from '../server'
import { getClientIp } from '@supercharge/request-ip'
export interface WsIdentityRouterOpts {
    logLevel: LogLevelDesc;
    wsIdentityServer: WsIdentityServer;
}

export class WsSessionRouter {
    public readonly className = 'WsSessionRouter';
    private readonly log: Logger;
    public readonly router: Router;

    constructor (private readonly opts: WsIdentityRouterOpts) {
      this.log = LoggerProvider.getOrCreate({ label: this.className, level: opts.logLevel })
      this.router = Router()
      this.__registerHandlers()
    }

    private __registerHandlers () {
      this.router.post(
        '/new',
        [body('pubKeyHex').isString().notEmpty()],
        this.newSession.bind(this)
      )
    }

    private async newSession (req: Request, res: Response) {
      const fnTag = `${req.method.toUpperCase()} ${req.originalUrl}`
      this.log.debug(fnTag)
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        this.log.debug(`${fnTag} bad request : ${JSON.stringify(errors.array())}`)
        return res.status(400).json({
          msg: JSON.stringify(errors.array())
        })
      }
      try {
        const clientIp = getClientIp(req)
        const resp = this.opts.wsIdentityServer.newSessionId(req.body.pubKeyHex, clientIp)
        return res.status(201).json(JSON.stringify(resp))
      } catch (error) {
        return res.status(409).json({
          msg: error.message
        })
      }
    }
}
