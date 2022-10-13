import {
    FabricContractInvocationType,
    PluginLedgerConnectorFabric,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import ClientError from '../errors/clientError';
import { ledgerLogger } from '../utils/logger';
import {
    IEmissionsDataEmission,
    IEmissionsDataGateway,
    IEmissionsDataGetAllEmissionsDataByDateRangeInput,
    IEmissionsDataGetEMissionsRecordsInput,
    IEmissionsDataRecordEmissionsInput,
    IEmissionsDataUpdateEmissionsMintedTokenInput,
    IFabricTxCaller,
} from '../blockchain-gateway-lib/I-gateway';
import Signer from '../blockchain-gateway-lib/signer';
interface IEmissionsDataGatewayOptions {
    fabricConnector: PluginLedgerConnectorFabric;
    signer: Signer;
}

export default class EmissionsDataGateway implements IEmissionsDataGateway {
    private readonly className = 'EmissionsDataGateway';
    private readonly ccName = 'emissions';
    private readonly channelName = 'emissions-data';
    constructor(private readonly opts: IEmissionsDataGatewayOptions) {}

    async recordEmissions(
        caller: IFabricTxCaller,
        input: IEmissionsDataRecordEmissionsInput,
    ): Promise<IEmissionsDataEmission> {
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
                    input.endpoint,
                    input.query,
                    JSON.stringify(input.queryParams),
                    //input.utilityId,
                    input.partyId,
                    input.fromDate,
                    input.thruDate,
                    //`${input.energyUseAmount}`,
                    //input.energyUseUom,
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
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to record emissions record : ${m}`, 409);
        }
    }
    async updateEmissionsMintedToken(
        caller: IFabricTxCaller,
        input: IEmissionsDataUpdateEmissionsMintedTokenInput,
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
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to update minted emissions records : ${m}`, 409);
        }
    }
    async getEmissionData(caller: IFabricTxCaller, uuid: string): Promise<IEmissionsDataEmission> {
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
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to record emissions record : ${m}`, 409);
        }
    }

    async getEmissionsRecords(
        caller: IFabricTxCaller,
        input: IEmissionsDataGetEMissionsRecordsInput,
    ): Promise<IEmissionsDataEmission[]> {
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
            const json: Record<string, IEmissionsDataEmission>[] = JSON.parse(resp.functionOutput);
            const out: IEmissionsDataEmission[] = [];
            for (const emission of json) {
                out.push(this.__toEmissionRecord(emission.Record));
            }
            return out;
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to fetch emissions records : ${m}`, 409);
        }
    }

    async getAllEmissionsDataByDateRange(
        caller: IFabricTxCaller,
        input: IEmissionsDataGetAllEmissionsDataByDateRangeInput,
    ): Promise<IEmissionsDataEmission[]> {
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
            const json: Record<string, IEmissionsDataEmission>[] = JSON.parse(resp.functionOutput);
            const out: IEmissionsDataEmission[] = [];
            for (const emission of json) {
                out.push(this.__toEmissionRecord(emission.Record));
            }
            return out;
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(
                `${fnTag} failed fetch emissions record by date range: ${m}`,
                409,
            );
        }
    }

    private __toEmissionRecord(json: IEmissionsDataEmission): IEmissionsDataEmission {
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
