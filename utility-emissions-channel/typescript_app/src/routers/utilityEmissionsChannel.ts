// utilityEmissionsChannel.ts : exposes endpoint for interacting with utilityEmissionsChannel chaincode only
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common';
import {UtilityEmissionsChannel} from '../blockchain-gateway/utilityEmissionsChannel';
import {Router,Request,Response} from 'express';
import {validationResult,body,param} from 'express-validator';
import {IEmissionRecord} from '../blockchain-gateway/I-utilityEmissionsChannel';
import {checkDateConflict} from '../blockchain-gateway/utils/dateUtils';
import {createHash} from 'crypto';
import AWSS3 from '../blockchain-gateway/utils/aws';

interface IUtilityEmissionsChannelRouterOptions{
    logLevel:LogLevelDesc;
    utilityEmissionsChannel:UtilityEmissionsChannel;
    dataStorage:AWSS3;
}

export class UtilityEmissionsChannelRouter{
    public static CLASS_NAME = 'UtilityEmissionsChannelRouter';
    private readonly log:Logger;

    public readonly router:Router;
    get clasName():string{
        return UtilityEmissionsChannelRouter.CLASS_NAME;
    }

    constructor(private readonly opts:IUtilityEmissionsChannelRouterOptions){
        this.log = LoggerProvider.getOrCreate({label:this.clasName,level:opts.logLevel});
        this.router = Router();
        this.registerHandlers();
    }

    private registerHandlers(){
        this.router.post(
            '/recordEmissions',
            [
                body('userId').isString(),
                body('orgName').isString(),
                body('utilityId').isString(),
                body('partyId').isString(),
                body('fromDate').custom((value, { req }) => {
                  const matches = value.match(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
                  );
                  if (!matches) {
                    throw new Error('Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)');
                  }

                  // Indicates the success of this synchronous custom validator
                  return true;
                }),
                body('thruDate').custom((value, { req }) => {
                  const matches = value.match(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
                  );
                  if (!matches) {
                    throw new Error('Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)');
                  }

                  // Indicates the success of this synchronous custom validator
                  return true;
                }),
                body('energyUseAmount').isNumeric(),
                body('energyUseUom').isString(),
            ],
            this.recordEmissions.bind(this)
        );
        this.router.get(
            '/getEmissionsData/:userId/:orgName/:uuid',
            [
                param('userId').isString(),
                param('orgName').isString(),
                param('uuid').isString()
            ],
            this.getEmissionsData.bind(this)
        );

        this.router.get(
            '/getAllEmissionsData/:userId/:orgName/:utilityId/:partyId',
            [
                param('userId').isString(),
                param('orgName').isString(),
                param('utilityId').isString(),
                param('partyId').isString()
            ],
            this.getAllEmissionData.bind(this)
        );

        this.router.get(
            'getAllEmissionsDataByDateRange/:userId/:orgName/:fromDate/:thruDate',
            [
                param('userId').isString(),
                param('orgName').isString(),
                param('fromDate').custom((value, { req }) => {
                  const matches = value.match(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
                  );
                  if (!matches) {
                    throw new Error('Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)');
                  }

                  // Indicates the success of this synchronous custom validator
                  return true;
                }),
                param('thruDate').custom((value, { req }) => {
                  const matches = value.match(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
                  );
                  if (!matches) {
                    throw new Error('Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)');
                  }

                  // Indicates the success of this synchronous custom validator
                  return true;
                }),
            ],
            this.getAllEmissionsDataByDateRange.bind(this)
        );

    }

    private async recordEmissions(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.url}`;
        this.log.debug(fnTag);
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            this.log.debug(`${fnTag} BadJSON Request : %o`,errors.array());
            return res.status(412).json({
                errors : errors.array()
            });
        }
        const userId:string = req.body.userId;
        const orgName:string = req.body.orgName;
        const utilityId:string = req.body.utilityId;
        const partyId:string = req.body.partyId;
        const fromDate:string = req.body.fromDate;
        const thruDate:string = req.body.thruDate;
        const energyUseAmount:number = req.body.energyUseAmount as number;
        const energyUseUom:string = req.body.energyUseUom;

        let emissionRecords:IEmissionRecord[];
        this.log.debug(`${fnTag} fetching allEmissionRecords with utilityId=${utilityId} , partyId=${partyId}`);
        try {
            emissionRecords =  await this.opts.utilityEmissionsChannel.getAllEmissionRecords(userId,orgName,{utilityId,partyId});
        } catch (error) {
            this.log.info(`${fnTag} failed to fetch allEmissionRecords : %o`,error);
            return res.status(500).json({
                error
            });
        }

        this.log.debug(`${fnTag} overlap check of data between ${fromDate} to ${thruDate}`);
        for (const emission of emissionRecords){
            const overlap:boolean = checkDateConflict(fromDate,thruDate,emission.fromDate,emission.thruDate);
            if (overlap){
                this.log.info(`${fnTag} Supplied dates ${fromDate} to ${thruDate} overlap with an existing dates ${emission.fromDate} to ${emission.thruDate}`);
                return res.status(401).json({
                    msg : `Supplied dates ${fromDate} to ${thruDate} overlap with an existing dates ${emission.fromDate} to ${emission.thruDate}.`
                });
            }
        }
        let url = '';
        let md5 = '';
        if (req.file){
            const fileBin = req.file.buffer;
            const filename = `${userId}-${orgName}-${utilityId}-${partyId}-${fromDate}-${thruDate}.pdf`;
            this.log.debug(`${fnTag} upload ${filename} to S3`);
            try {
                const uploadResp = await this.opts.dataStorage.upload(fileBin,filename);
                url = uploadResp.Location;
                const md5sum = createHash('md5');
                md5sum.update(fileBin);
                md5 = md5sum.digest('hex');
            } catch (error) {
                this.log.debug(`${fnTag} failed to upload : %o`,error);
                return res.status(409).json({
                    msg : `failed to upload : ${(error as Error).message}`
                });
            }
        }
        // record emission on ledger
        const ledgerRes = await this.opts.utilityEmissionsChannel.recordEmissions(userId,orgName,{
            utilityId,
            partyId,
            fromDate,
            thruDate,
            energyUseAmount,
            energyUseUom,
            url,
            md5
        });
        if (ledgerRes.info === 'EMISSION RECORDED TO LEDGER'){
            res.status(201).json(ledgerRes);
        }else{
            res.status(409).json(ledgerRes);
        }
    }

    private async getEmissionsData(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.url}`;
        this.log.debug(fnTag);
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            this.log.debug(`${fnTag} BadJSON Request : %o`,errors.array());
            return res.status(412).json({
                errors : errors.array()
            });
        }
        const userId = req.params.userId;
        const orgName = req.params.orgName;
        const uuid = req.params.uuid;
        this.log.debug(`${fnTag} fetching emission record from the ledger`);
        try {
            const emissionRecord = await this.opts.utilityEmissionsChannel.getEmissionsData(userId,orgName,{uuid});
            res.status(200).json(emissionRecord);
        } catch (error) {
            res.status(409).json({
                error
            });
        }
    }

    private async getAllEmissionData(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.baseUrl}${req.url}`;
        this.log.debug(fnTag);
        const userId = req.params.userId;
        const orgName = req.params.orgName;
        const utilityId = req.params.utilityId;
        const partyId = req.params.partyId;

        try {
            const result = await this.opts.utilityEmissionsChannel.getAllEmissionRecords(userId,orgName,{utilityId,partyId});
            return res.status(200).json(result);
        } catch (error) {
            return res.status(409).json({
                error
            });
        }
    }
    private async getAllEmissionsDataByDateRange(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.baseUrl}${req.url}`;
        this.log.debug(fnTag);
        const userId = req.params.userId;
        const orgName = req.params.orgName;
        const fromDate = req.params.fromDate;
        const thruDate = req.params.thruDate;

        try {
            const result = await this.opts.utilityEmissionsChannel.getAllEmissionsDataByDateRange(userId,orgName,{fromDate,thruDate});
            return res.status(200).json(result);
        } catch (error) {
            return res.status(409).json({
                error
            });
        }
    }
}