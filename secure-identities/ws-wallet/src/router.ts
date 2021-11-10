import { Router, Request, Response } from "express";
import { validationResult, body } from 'express-validator'
import {
  Logger,
  LogLevelDesc,
  LoggerProvider
} from '@hyperledger/cactus-common'
import sanitize from "sanitize-filename"
import { newSession, openSession } from "./util";
interface WsWalletRouterOpts{
    logLevel?: LogLevelDesc;
}
let openRequest: boolean;


export class WsWalletRouter{
    private readonly log: Logger;
    public readonly className = 'WsWalletRouter';
    public readonly router: Router;
    constructor(private readonly opts: WsWalletRouterOpts){
        this.log = LoggerProvider.getOrCreate({
          label: this.className,
          level: opts.logLevel || 'TRACE'
        })
        this.router = Router()
        this.__registerHandlers()
    } 
    private __registerHandlers () {
        this.router.post(
            '/new',
            [   
                body('endpoint').isString().notEmpty(),
                body('key_name').isString().notEmpty()
            ],
          this.newSession.bind(this)
        )
        this.router.post(
            '/open',
            [   
                body('endpoint').isString().notEmpty(),
                body('session_id').isString().notEmpty(),
                body('key_name').isString().notEmpty()
            ],
            this.openSession.bind(this)
        )
    } 
    private __validate (req: Request, res: Response, fnTag:string) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            this.log.debug(`${fnTag} bad request : ${JSON.stringify(errors.array())}`)
            return res.status(400).json({
              msg: JSON.stringify(errors.array())
            })
        }
    }
    /*
     * REST API for 3rd party apps to request ws-wallet to issue
     * new ws-session ticket for user-id to connect to the target 
     * farbic app at the specified endpoint 
    */
    private async newSession (req: Request, res: Response) {
        if (openRequest) {
            const msg = `Waiting for session approval. Try again later`;
            return res.status(409).json(msg)
        }
        openRequest = true;
        const fnTag = `${req.method.toUpperCase()} ${req.originalUrl}`
        this.log.info(fnTag)
        this.__validate(req,res,fnTag)
        try {
            const endpoint = req.body['endpoint'] as string;
            const key_name = req.body['key_name'] as string;
            const keyName = sanitize(key_name);
            const resp = await newSession(endpoint,keyName)
            openRequest = false
            return res.status(200).json(resp)
        } catch (error) {
          this.log.debug(`${error}`)
          openRequest = false
          return res.status(409).json({
            msg: error.message
          })
        }
    }
    private async openSession (req: Request, res: Response) {
        const fnTag = `${req.method.toUpperCase()} ${req.originalUrl}`
        this.log.info(fnTag)
        this.__validate(req,res,fnTag)
        try {
            const endpoint = req.body['endpoint'] as string;
            const sessionId = req.body['session_id'] as string;
            const keyName = req.body['key_name'] as string;
            const resp = await openSession(endpoint,sessionId,keyName)
            return res.status(200).json(resp);
        } catch (error) {
          this.log.debug(`${error}`)
          return res.status(409).json({
            msg: error.message
          })
        }
    } 
}