// fabricRegistry.ts : exposes endpoint for registering and enrolling fabric user
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common';
import {Router,Request,Response} from 'express';
import { body, validationResult } from 'express-validator';
import {FabricRegistry} from '../blockchain-gateway/fabricRegistry';

export interface IFabricRegistryRouterOptions{
    logLevel:LogLevelDesc;
    fabricRegistry:FabricRegistry;
}

export class FabricRegistryRouter{
    private static readonly CLASS_NAME= 'FabricRegistryEndpoint';
    private readonly log:Logger;

    public readonly router:Router;

    get className():string{
        return FabricRegistryRouter.CLASS_NAME;
    }
    constructor(private readonly opts:IFabricRegistryRouterOptions){
        this.log = LoggerProvider.getOrCreate({label:this.className,level:opts.logLevel});
        this.router = Router();
        this.registerHandlers();
    }

    private registerHandlers(){
        this.router.post(
            '/admin',
            [
                body('orgName').isString(),
            ],
            this.enrollRegistrar.bind(this)
        );
        this.router.post(
            '/user',
            [
                body('userId').isString(),
                body('orgName').isString(),
                body('affiliation').isString(),
            ],
            this.enrollUser.bind(this)
        );
    }

    private async enrollRegistrar(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.url}`;
        this.log.debug(fnTag);
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            this.log.debug(`${fnTag} BadJSON Request : %o`,errors.array());
            return res.status(412).json({
                errors: errors.array()
            });
        }
        try {
            const result = await this.opts.fabricRegistry.enrollRegistrar({
                orgName: req.body.orgName
            });
            res.status(201).json(result);
        } catch (error) {
            this.log.debug(`${fnTag} failed to enroll Registrar : %o`,error);
            return res.status(409).json({
                msg : (error as Error).message
            });
        }
    }

    private async enrollUser(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.baseUrl}${req.url}`;
        this.log.debug(fnTag);
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            this.log.debug(`${fnTag} BadJSON Request : %o`,errors.array());
            return res.status(412).json({
                errors: errors.array()
            });
        }
        const userId = req.body.userId;
        const orgName = req.body.orgName;
        const affiliation = req.body.affiliation;
        try {
            await this.opts.fabricRegistry.enrollUser(userId,orgName,affiliation);
        } catch (error) {
            this.log.debug(`${fnTag} failed to register user : %o`,(error as Error).message);
            return res.status(409).json({msg : (error as Error).message});
        }

        res.status(201).json({
            info:  'USER REGISTERED AND ENROLLED'
        });
    }

}