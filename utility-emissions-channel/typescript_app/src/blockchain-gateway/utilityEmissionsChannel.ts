import {
    IUtilityemissionchannelGateway,
    IFabricTxCaller,
    IUtilityemissionchannelRecordEmissionsInput,
    IUtilityemissionchannelGetAllEmissionsDataByDateRangeInput,
    IUtilityemissionchannelGetEMissionsRecordsInput,
    IUtilityemissionchannelEmissionData,
    IUtilityemissionchannelUpdateEmissionsMintedTokenInput,
} from './I-gateway';
import {
    FabricContractInvocationType,
    PluginLedgerConnectorFabric,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import Singer from './singer';
import { ledgerLogger } from '../utils/logger';
import ClientError from '../errors/clientError';

interface IUtilityemissionchannelGatewayOptions {
    fabricConnector: PluginLedgerConnectorFabric;
    signer: Singer;
}

export default class UtilityemissionchannelGateway implements IUtilityemissionchannelGateway {
    private readonly className = 'UtilityemissionchannelGateway';
    private readonly ccName = 'utilityemissions';
    private readonly channelName = 'utilityemissionchannel';
    constructor(private readonly opts: IUtilityemissionchannelGatewayOptions) {}

    async recordEmissions(
        caller: IFabricTxCaller,
        input: IUtilityemissionchannelRecordEmissionsInput,
    ): Promise<IUtilityemissionchannelEmissionData> {
        const fnTag = `${this.className}.recordEmissions()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} input : %o`, input);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
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
                    input.md5,
                ],
            });
            ledgerLogger.debug(
                `${fnTag} emissions record successfully created : ${resp.functionOutput}`,
            );
            const json = JSON.parse(resp.functionOutput);
            return this.__toEmissionRecord(json);
        } catch (error) {
            throw new ClientError(
                `${fnTag} failed to record emissions record : ${error.message}`,
                409,
            );
        }
    }
    async updateEmissionsMintedToken(
        caller: IFabricTxCaller,
        input: IUtilityemissionchannelUpdateEmissionsMintedTokenInput,
    ): Promise<void> {
        const fnTag = `${this.className}.updateEmissionsMintedToken()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} input : %o`, input);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'updateEmissionsMintedToken',
                params: [input.tokenId, input.partyId, ...input.uuids],
            });
            ledgerLogger.debug(
                `${fnTag} minted emissions records successfully updated : ${resp.functionOutput}`,
            );
        } catch (error) {
            throw new ClientError(
                `${fnTag} failed to update minted emissions records : ${error.message}`,
                409,
            );
        }
    }
    async getEmissionData(
        caller: IFabricTxCaller,
        uuid: string,
    ): Promise<IUtilityemissionchannelEmissionData> {
        const fnTag = `${this.className}.getEmissionData()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} uuid = ${uuid}`);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getEmissionsData',
                params: [uuid],
            });
            ledgerLogger.debug(`${fnTag} returned emissions record data : ${resp.functionOutput}`);
            const json = JSON.parse(resp.functionOutput);
            return this.__toEmissionRecord(json);
        } catch (error) {
            throw new ClientError(
                `${fnTag} failed to record emissions record : ${error.message}`,
                409,
            );
        }
    }

    async getEmissionsRecords(
        caller: IFabricTxCaller,
        input: IUtilityemissionchannelGetEMissionsRecordsInput,
    ): Promise<IUtilityemissionchannelEmissionData[]> {
        const fnTag = `${this.className}.getEmissionsRecords()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} input = %o`, input);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getAllEmissionsData',
                params: [input.utilityId, input.partyId],
            });
            ledgerLogger.debug(`${fnTag} returned emissions record data : ${resp.functionOutput}`);
            const json: any[] = JSON.parse(resp.functionOutput);
            const out: IUtilityemissionchannelEmissionData[] = [];
            for (const emission of json) {
                out.push(this.__toEmissionRecord(emission.Record));
            }
            return out;
        } catch (error) {
            throw new ClientError(
                `${fnTag} failed to fetch emissions records : ${error.message}`,
                409,
            );
        }
    }

    async getAllEmissionsDataByDateRange(
        caller: IFabricTxCaller,
        input: IUtilityemissionchannelGetAllEmissionsDataByDateRangeInput,
    ): Promise<IUtilityemissionchannelEmissionData[]> {
        const fnTag = `${this.className}.getAllEmissionsDataByDateRange()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} input = %o`, input);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getAllEmissionsDataByDateRange',
                params: [input.fromDate, input.thruDate],
            });
            ledgerLogger.debug(`${fnTag} returned emissions record data : ${resp.functionOutput}`);
            const json: any[] = JSON.parse(resp.functionOutput);
            const out: IUtilityemissionchannelEmissionData[] = [];
            for (const emission of json) {
                out.push(this.__toEmissionRecord(emission.Record));
            }
            return out;
        } catch (error) {
            throw new ClientError(
                `${fnTag} failed fetch emissions record by date range: ${error.message}`,
                409,
            );
        }
    }

    private __toEmissionRecord(json: any): IUtilityemissionchannelEmissionData {
        return {
            uuid: json.uuid,
            utilityId: json.utilityId,
            partyId: json.partyId,
            fromDate: json.fromDate,
            thruDate: json.thruDate,
            emissionsAmount: json.emissionsAmount,
            renewableEnergyUseAmount: json.renewableEnergyUseAmount,
            nonrenewableEnergyUseAmount: json.nonrenewableEnergyUseAmount,
            energyUseUom: json.energyUseUom,
            factorSource: json.factorSource,
            url: json.url,
            md5: json.md5,
            tokenId: json.tokenId,
        };
    }
}
