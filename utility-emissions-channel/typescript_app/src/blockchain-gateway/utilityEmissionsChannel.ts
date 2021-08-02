// utilityEmissionsChannel.ts : interact with fabric to invoke `utilityEmissionsChannel` chaincode
import {Logger, LoggerProvider, LogLevelDesc} from '@hyperledger/cactus-common';
import {FabricContractInvocationType, PluginLedgerConnectorFabric} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {IEmissionRecord, IRecordEmissionsInput,IRecordEmissionsOutput, IUpdateEmissionsMintedTokenRequest} from './I-utilityEmissionsChannel';
import AWSS3 from './utils/aws';
import {createHash} from 'crypto';

export interface IUtilityEmissionsChannelOptions{
    logLevel:LogLevelDesc;
    fabricClient:PluginLedgerConnectorFabric;
    keychainId:string;
    dataStorage:AWSS3;
}

export class UtilityEmissionsChannel{
    static readonly CLASS_NAME = 'UtilityEmissionsChannel';

    private readonly chanincodeName = 'utilityemissions';
    private readonly channelName  = 'utilityemissionchannel';

    private readonly log:Logger;
    get className():string{
        return UtilityEmissionsChannel.CLASS_NAME;
    }

    constructor(private readonly opts:IUtilityEmissionsChannelOptions){
        this.log = LoggerProvider.getOrCreate({level: opts.logLevel,label: this.className});
    }

    async recordEmissions(userId:string,orgName:string,input:IRecordEmissionsInput):Promise<IRecordEmissionsOutput>{
        const fnTag =  '#recordEmissions';
        const caller = `${orgName}_${userId}`;
        this.log.debug(`${fnTag} caller : ${caller} , input : %o`,input);
        let jsonResult:any;
        try {
            const result = await this.opts.fabricClient.transact({
                signingCredential: {
                    keychainId: this.opts.keychainId,
                    keychainRef: caller
                },
                channelName: this.channelName,
                contractName: this.chanincodeName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'recordEmissions',
                params: [
                    input.utilityId,
                    input.partyId,
                    input.fromDate,
                    input.thruDate,
                    `${input.energyUseAmount}`,
                    input.energyUseUom,
                    input.url,
                    input.md5
                ],
            });
            jsonResult = JSON.parse(result.functionOutput);
        } catch (error) {
            this.log.debug(`${fnTag} failed to record emission : %o`,error);
            return {
                info: `failed to submit transction : ${error}`,
                utilityId: input.utilityId,
                partyId: input.partyId,
                fromDate: input.fromDate,
                thruDate: input.thruDate,
                energyUseAmount : `${input.energyUseAmount}`,
                energyUseUom : input.energyUseUom
            };
        }
        return {
            info : 'EMISSION RECORDED TO LEDGER',
            uuid :  jsonResult.uuid,
            utilityId :  jsonResult.utilityId,
            partyId :  jsonResult.partyId,
            fromDate :  jsonResult.fromDate,
            thruDate :  jsonResult.thruDate,
            emissionsAmount :  jsonResult.emissionsAmount,
            renewableEnergyUseAmount :  jsonResult.renewableEnergyUseAmount,
            nonrenewableEnergyUseAmount :  jsonResult.nonrenewableEnergyUseAmount,
            energyUseUom :  jsonResult.energyUseUom,
            factorSource :  jsonResult.factorSource,
            url :  jsonResult.url,
            md5 :  jsonResult.md5,
        };
    }

    async getEmissionsData(userId:string,orgName:string,input:{uuid:string}):Promise<IEmissionRecord>{
        const fnTag = '#getEmissionsData';
        const caller = `${orgName}_${userId}`;
        this.log.debug(`${fnTag} caller : ${caller} , input : %o`,input);
        let jsonResult:any;
        try {
            const result = await this.opts.fabricClient.transact({
                signingCredential: {
                    keychainId : this.opts.keychainId,
                    keychainRef: caller
                },
                channelName: this.channelName,
                contractName: this.chanincodeName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getEmissionsData',
                params: [input.uuid]
            });
            jsonResult = JSON.parse(result.functionOutput);
        } catch (error) {
            this.log.error(`${fnTag} failed fetch emission record : %o`,error);
            throw error;
        }

        try {
            await this.emissionsRecordChecksum(jsonResult);
        } catch (error) {
            this.log.debug(`${fnTag} %o`,error);
            throw error;
        }
        return {
            uuid:jsonResult.uuid,
            utilityId:jsonResult.utilityId,
            partyId:jsonResult.partyId,
            fromDate:jsonResult.fromDate,
            thruDate:jsonResult.thruDate,
            emissionsAmount:jsonResult.emissionsAmount,
            renewableEnergyUseAmount:jsonResult.renewableEnergyUseAmount,
            nonrenewableEnergyUseAmount:jsonResult.nonrenewableEnergyUseAmount,
            energyUseUom:jsonResult.energyUseUom,
            factorSource:jsonResult.factorSource,
            url:jsonResult.url,
            md5:jsonResult.md5,
            tokenId:jsonResult.tokenId,
        };
    }

    async getAllEmissionRecords(userId:string,orgName:string,input:{utilityId:string,partyId:string}):Promise<IEmissionRecord[]>{
        const fnTag = '#getAllEmissionRecords';
        const caller = `${orgName}_${userId}`;
        this.log.debug(`${fnTag} caller : ${caller} input : %o`,input);
        try {
            const result = await this.opts.fabricClient.transact({
                signingCredential: {
                    keychainId : this.opts.keychainId,
                    keychainRef: caller,
                },
                channelName: this.channelName,
                contractName: this.chanincodeName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getAllEmissionsData',
                params: [
                    input.utilityId,
                    input.partyId
                ]
            });
            const jsonResult:any[] = JSON.parse(result.functionOutput);
            const currentYear: number = new Date().getFullYear();
            this.log.debug(`${fnTag} fabric result : %o`,jsonResult);
            const emissions:IEmissionRecord[] = [];
            for (const emission of jsonResult){
                const record = emission.Record;

                try {
                    await this.emissionsRecordChecksum(record);
                } catch (error) {
                    this.log.debug(`${fnTag} %o`,error);
                    throw error;
                }

                if (parseInt(record.fromDate.slice(0, 4),10) < currentYear - 1) {
                    continue;
                }
                emissions.push({
                    uuid : record.uuid,
                    utilityId : record.utilityId,
                    partyId : record.partyId,
                    fromDate : record.fromDate,
                    thruDate : record.thruDate,
                    emissionsAmount : record.emissionsAmount,
                    renewableEnergyUseAmount : record.renewableEnergyUseAmount,
                    nonrenewableEnergyUseAmount : record.nonrenewableEnergyUseAmount,
                    energyUseUom : record.energyUseUom,
                    factorSource : record.factorSource,
                    url : record.url,
                    md5 : record.md5,
                    tokenId : record.tokenId,
                });
            }
            return emissions;
        } catch (error) {
            throw error;
        }
    }

    async getAllEmissionsDataByDateRange(userId:string,orgName:string,input:{fromDate:string,thruDate:string}):Promise<IEmissionRecord[]>{
        const fnTag = '#getAllEmissionsDataByDateRange';
        const caller = `${orgName}_${userId}`;
        this.log.debug(`${fnTag} caller : ${caller} input : %o`,input);
        try {
            const result = await this.opts.fabricClient.transact({
                signingCredential: {
                    keychainId : this.opts.keychainId,
                    keychainRef: caller,
                },
                channelName: this.channelName,
                contractName: this.chanincodeName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getAllEmissionsDataByDateRange',
                params: [
                    input.fromDate,
                    input.thruDate
                ]
            });
            const jsonResult:any[] = JSON.parse(result.functionOutput);

            this.log.debug(`${fnTag} fabric result : %o`,jsonResult);
            const emissions:IEmissionRecord[] = [];
            for (const emission of jsonResult){
                const record = emission.Record;

                try {
                    await this.emissionsRecordChecksum(record);
                } catch (error) {
                    this.log.debug(`${fnTag} %o`,error);
                    throw error;
                }

                emissions.push({
                    uuid : record.uuid,
                    utilityId : record.utilityId,
                    partyId : record.partyId,
                    fromDate : record.fromDate,
                    thruDate : record.thruDate,
                    emissionsAmount : record.emissionsAmount,
                    renewableEnergyUseAmount : record.renewableEnergyUseAmount,
                    nonrenewableEnergyUseAmount : record.nonrenewableEnergyUseAmount,
                    energyUseUom : record.energyUseUom,
                    factorSource : record.factorSource,
                    url : record.url,
                    md5 : record.md5,
                    tokenId : record.tokenId,
                });
            }
            return emissions;
        } catch (error) {
            throw error;
        }
    }

    async updateEmissionsRecord(userId:string,orgName:string,input:IEmissionRecord):Promise<IEmissionRecord>{
        const fnTag = '#updateEmissionsRecord';
        const caller = this.getUserKey(userId,orgName);
        this.log.debug(`${fnTag} caller: ${caller}, input : %o`,input);
        let jsonResult:any;
        try {
            const result = await this.opts.fabricClient.transact({
                signingCredential: {
                    keychainId : this.opts.keychainId,
                    keychainRef: caller
                },
                channelName: this.channelName,
                contractName: this.chanincodeName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'updateEmissionsRecord',
                params: [
                    input.uuid,
                    input.utilityId,
                    input.partyId,
                    input.fromDate,
                    input.thruDate,
                    `${input.emissionsAmount}`,
                    `${input.renewableEnergyUseAmount}`,
                    `${input.nonrenewableEnergyUseAmount}`,
                    input.energyUseUom,
                    input.factorSource,
                    input.url,
                    input.md5,
                    input.tokenId
                ]
            });
            jsonResult = JSON.parse(result.functionOutput);
        } catch (error) {
            throw error;
        }
        return {
            uuid:jsonResult.uuid,
            utilityId:jsonResult.utilityId,
            partyId:jsonResult.partyId,
            fromDate:jsonResult.fromDate,
            thruDate:jsonResult.thruDate,
            emissionsAmount:jsonResult.emissionsAmount,
            renewableEnergyUseAmount:jsonResult.renewableEnergyUseAmount,
            nonrenewableEnergyUseAmount:jsonResult.nonrenewableEnergyUseAmount,
            energyUseUom:jsonResult.energyUseUom,
            factorSource:jsonResult.factorSource,
            url:jsonResult.url,
            md5:jsonResult.md5,
            tokenId:jsonResult.tokenId,
        };
    }
    async updateEmissionsMintedToken(userId:string,orgName:string,input:IUpdateEmissionsMintedTokenRequest):Promise<void>{
        const fnTag = '#updateEmissionsMintedToken';
        const caller = this.getUserKey(userId,orgName);
        this.log.debug(`${fnTag} caller : ${caller} input : %o`,input);
        try {
            await this.opts.fabricClient.transact({
                signingCredential: {
                    keychainId : this.opts.keychainId,
                    keychainRef: caller,
                },
                channelName: this.channelName,
                contractName: this.chanincodeName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'updateEmissionsMintedToken',
                params: [
                    input.tokenId,
                    input.partyId,
                    ...input.uuids
                ]
            });
        } catch (error) {
            throw error;
        }
    }
    private getUserKey(userId:string,orgName:string):string{
        return `${orgName}_${userId}`;
    }

    /**
     * @description checks hash stored on blockchain is same as hash of data fetched from dataUrl
     * @param dataUrl : url of data
     */
    private async emissionsRecordChecksum(record:any){
        const fnTag = '#EmissionsRecordChecksum';
        if (record.url && record.url.length > 0){
            const url = record.url;
            this.log.debug(`${fnTag} data at url = ${url}`);
            const filename = decodeURIComponent(url).split('/').slice(-1)[0];
            let data:Buffer;
            try {
                data = await this.opts.dataStorage.download(filename);
            } catch (error) {
                this.log.debug(`${fnTag} failed to fetch ${filename} from S3 : %o`,error);
                return;
            }

            this.log.debug(`${fnTag} data hash from blockchain = ${record.md5}`);
            const md5Sum = createHash('md5');
            md5Sum.update(data);
            if (md5Sum.digest('hex') !== record.md5){
                throw new Error(`The retrieved document ${record.url} has a different MD5 hash than recorded on the ledger. This file may have been tampered with.`);
            }

            this.log.debug(`${fnTag} Md5 CheckSum successful !!`);
        }
    }
}