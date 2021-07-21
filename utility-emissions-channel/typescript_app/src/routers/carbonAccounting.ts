// carbonAccounting.ts : exposes routers which uses more then one kind
// ledger integration
// example :
// recording_audited_emission_token : makes two calls to fabric and one to ethereum
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common';
import {Router,Request,Response} from 'express';
import {NetEmissionsTokenNetworkContract} from '../blockchain-gateway/netEmissionsTokenNetwork';
import {UtilityEmissionsChannel} from '../blockchain-gateway/utilityEmissionsChannel';
import { body, validationResult} from 'express-validator';
import { IEmissionRecord } from '../blockchain-gateway/I-utilityEmissionsChannel';
import { toTimestamp } from '../blockchain-gateway/utils/dateUtils';

export interface ICarbonAccountingRouter{
    logLevel:LogLevelDesc;
    netEmissionsTokenContract:NetEmissionsTokenNetworkContract;
    utilityEmissionChannel:UtilityEmissionsChannel;
}

export class CarbonAccountingRouter{
    private static readonly CLASS_NAME='CarbonAccountingRouter';
    private readonly log:Logger;

    public readonly router:Router;

    get className():string{
        return CarbonAccountingRouter.CLASS_NAME;
    }

    constructor(private readonly opt:ICarbonAccountingRouter){
        this.log  = LoggerProvider.getOrCreate({label: this.className,level: opt.logLevel});
        this.router = Router();
        this.registerHandlers();
    }

    private registerHandlers(){
        this.router.post(
            '/recordAuditedEmissionsToken',
            [
                body('userId').isString(),
                body('orgName').isString(),
                body('partyId').isString(),
                body('addressToIssue').isString(),
                body('emissionsRecordsToAudit').isString()
            ],
            this.recordAuditedEmissionToken.bind(this)
        );
    }

    private async recordAuditedEmissionToken(req:Request,res:Response){
        const fnTag = `${req.method.toUpperCase()} ${req.url}`;
        this.log.debug(fnTag);
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            this.log.debug(`${fnTag} BadJSON Request : %o`,errors.array());
            return res.status(412).json({
                errors : errors.array()
            });
        }
        const userId = req.body.userId;
        const orgName = req.body.orgName;
        const partyId = req.body.partyId;
        let automaticRetireDate = req.params.automaticRetireDate;
        const re = new RegExp(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/);
        if (!re.test(automaticRetireDate)){
            automaticRetireDate = new Date().toISOString();
        }
        const emissionsRecordsToAudit = req.body.emissionsRecordsToAudit.toString().split(',');
        // TODO : use fabric cactus connector to call utility emission chaincode
        this.log.debug(`${fnTag} fetching emissionRecord uuids=%o`,emissionsRecordsToAudit);
        const metadata:any = {};
        metadata.org = orgName;
        metadata.type = 'Utility Emissions';
        metadata.partyId = [];
        metadata.renewableEnergyUseAmount = 0;
        metadata.nonrenewableEnergyUseAmount = 0;
        metadata.utilityIds = [];
        metadata.factorSources = [];
        metadata.urls = [];
        metadata.md5s = [];
        metadata.fromDates = [];
        metadata.thruDates = [];

        let quantity:number = 0;
        const manifestIds = []; // stores uuids

        let fromDate = Number.MAX_SAFE_INTEGER;
        let thruDate = 0;
        const fetchedEmissionsRecords:IEmissionRecord[] = [];// stores fetched emissions records for updating tokenId on fabric after auditing
        // connect to fabric , request type : call
        // fetches details of emissionRecords with given uuids
        for (const uuid of emissionsRecordsToAudit){
            let emission:IEmissionRecord;
            try {
                emission = await this.opt.utilityEmissionChannel.getEmissionsData(userId,orgName,{uuid});
                fetchedEmissionsRecords.push(emission);
            } catch (error) {
                this.log.debug(`${fnTag} failed to fetch ${uuid} : %o`,error);
                continue;
            }
            if (emission.tokenId !==null){
                const tokenIdSplit = emission.tokenId.split(':');
                this.log.debug(`${fnTag} skipping emission Record with id = ${uuid},already audited to token ${tokenIdSplit[1]} on contract ${tokenIdSplit[0]}`);
                continue;
            }

            // check  timestamps to find overall rang of dates later
            const fetchedFromDate = toTimestamp(emission.fromDate);
            if (fetchedFromDate < fromDate){
                fromDate = fetchedFromDate;
            }
            const fetchedThruDate = toTimestamp(emission.thruDate);
            if (fetchedThruDate > thruDate){
                thruDate = fetchedThruDate;
            }

            if (emission.fromDate !== '' && emission.thruDate !== '') {
                metadata.fromDates.push(emission.fromDate);
                metadata.thruDates.push(emission.thruDate);
              }
              if (!metadata.utilityIds.includes(emission.utilityId)) {
                metadata.utilityIds.push(emission.utilityId);
              }
              if (!metadata.partyId.includes(emission.partyId)) {
                metadata.partyId.push(emission.partyId);
              }
              if (!metadata.factorSources.includes(emission.factorSource)) {
                metadata.factorSources.push(emission.factorSource);
              }
              if (emission.md5 !== '') {
                metadata.md5s.push(emission.md5);
              }
              if (emission.url !== '') {
                metadata.urls.push(emission.url);
              }
              metadata.renewableEnergyUseAmount += emission.renewableEnergyUseAmount;
              metadata.nonrenewableEnergyUseAmount += emission.nonrenewableEnergyUseAmount;

              const qnt:number = +emission.emissionsAmount.toFixed(3);
              quantity += (qnt * 1000);
              manifestIds.push(emission.uuid);
        }
        this.log.debug(`${fnTag} %o`,metadata);
        if (metadata.utilityIds.length === 0){
            this.log.info(`${fnTag} no emissions records found; nothing to audit`);
            return res.status(404).json({
                error : 'no emissions records found; nothing to audit'
            });
        }
        // TODO : read form env
        // const URL =
        const manifest = 'URL: https://utilityemissions.opentaps.net/api/v1/utilityemissionchannel, UUID: '+manifestIds.join(', ');
        this.log.debug(`${fnTag} quantity ${quantity}`);
        const addressToIssue = req.body.addressToIssue;
        this.log.debug(`${fnTag} minting emission token`);
        // connect to ethereum , request type : send
        // mint emission token on ethereum
        let tokenId:string;
        const description = 'Audited Utility Emissions';
        try {
            const token = await this.opt.netEmissionsTokenContract.issue({
                addressToIssue,
                quantity,
                fromDate,
                thruDate,
                automaticRetireDate: toTimestamp(automaticRetireDate),
                metadata: JSON.stringify(metadata),
                manifest,
                description,
            });
            tokenId = token.tokenId;
            this.log.debug(`${fnTag} minted token ${token.tokenId}`);
        } catch (error) {
            this.log.info(`${fnTag} failed to mint audited emission token : ${error}`);
            return res.status(500).json({
                error
            });
        }
        // connect to fabric , request type : send
        // update all emissionRecords with minted tokenId
        try {
            await this.opt.utilityEmissionChannel.updateEmissionsMintedToken(userId,orgName,{tokenId,partyId,uuids:manifestIds});
        } catch (error) {
            this.log.debug(`${fnTag} failed to update emission record %o`,error);
            return res.status(500).json({
                error
            });
        }
        return res.status(201).json({
            info: 'AUDITED EMISSIONS TOKEN RECORDED',
            tokenId,
            quantity,
            fromDate,
            thruDate,
            automaticRetireDate,
            metadata,
            manifest,
            description,
        });
    }
}