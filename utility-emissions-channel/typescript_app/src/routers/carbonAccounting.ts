// carbonAccounting.ts : exposes routers which uses more then one kind 
// ledger integration
// example : 
// recording_audited_emission_token : makes two calls to fabric and one to ethereum
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common'
import {Router,Request,Response} from 'express'
import {NetEmissionsTokenNetworkContract} from '../blockchain-gateway/netEmissionsTokenNetwork'
import {UtilityEmissionsChannel} from '../blockchain-gateway/utilityEmissionsChannel'
import {body, validationResult} from 'express-validator'

export interface ICarbonAccountingRouter{
    logLevel:LogLevelDesc
    netEmissionsTokenContract:NetEmissionsTokenNetworkContract
    utilityEmissionChannel:UtilityEmissionsChannel
}

export class CarbonAccountingRouter{
    private static readonly CLASS_NAME="CarbonAccountingRouter"
    private readonly log:Logger

    public readonly router:Router

    get className():string{
        return CarbonAccountingRouter.CLASS_NAME
    }

    constructor(private readonly opt:ICarbonAccountingRouter){
        this.log  = LoggerProvider.getOrCreate({label: this.className,level: opt.logLevel})
        this.router = Router()
        this.registerHandlers()
    }

    private registerHandlers(){
        this.router.post(
            '/utilityemissionchannel/emissionscontract/recordAuditedEmissionsToken',
            [
                body("userId").isString(),
                body("orgName").isString(),
                body("partyId").isString(),
                body("addressToIssue").isString(),
                body("emissionsRecordsToAudit").isString(),
            ],
            this.recordAuditedEmissionToken.bind(this)
        ) 
    }

    private async recordAuditedEmissionToken(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.url}`
        this.log.debug(fnTag)
        const errors = validationResult(req)
        if (!errors.isEmpty()){
            this.log.debug(`${fnTag} BadJSON Request : %o`,errors.array())
            return res.status(412).json({
                errors : errors.array()
            })
        }
        const userId = req.body.userId
        const orgName = req.body.orgName
        const emissionsRecordsToAudit = req.body.emissionsRecordsToAudit.toString().split(",")
        console.log(emissionsRecordsToAudit)
        // TODO : use fabric cactus connector to call utility emission chaincode
        try {

        } catch (error) {
            this.log.error(`${fnTag} failed to fetch emission data : ${error}`)
            res.status(500).json({
                error: error
            })
        }
        const addressToIssue = req.body.addressToIssue
        // TODO get these hard coded values from previous fabric chaincode invoke
        // const quantity = 1
        // const fromDate = 642
        // const thruDate = 876
        // const automaticRetireDate= 75757
        // const metadata = "Hello Metadata"
        // const manifest = "Hello Manifest"
        // const description = "Hello description"
        // this.log.debug(`${fnTag} minting emission token`)
        // try {
        //     const token = await this.opt.netEmissionsTokenContract.issue({
        //         addressToIssue: addressToIssue,
        //         quantity: quantity,
        //         fromDate: fromDate,
        //         thruDate: thruDate,
        //         automaticRetireDate: automaticRetireDate,
        //         metadata: metadata,
        //         manifest: manifest,
        //         description: description,
        //     })
        // } catch (error) {
        //     this.log.info(`${fnTag} failed to mint emission token : ${error}`)
        //     return res.status(500).json({
        //         error : error
        //     })
        // }
        // TODO : use fabric cactus connector to call utility emission chaincode again

    }
}