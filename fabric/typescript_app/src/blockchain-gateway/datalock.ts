import {
    FabricContractInvocationType,
    PluginLedgerConnectorFabric,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import ClientError from '../errors/clientError';
import { ledgerLogger } from '../utils/logger';
import {
    IDataLockGateway,
    IFabricTxCaller,
    ITxDetails,
    ITxStageUpdateInput,
    ITxStageUpdateOutput,
} from '../blockchain-gateway-lib/I-gateway';
import Signer from '../blockchain-gateway-lib/signer';

interface IDataLockGatewayOptions {
    fabricConnector: PluginLedgerConnectorFabric;
    signer: Signer;
}
export class DataLockGateway implements IDataLockGateway {
    private readonly className = 'DataLockGateway';
    private readonly ccName = 'datalock';
    private readonly channelName = 'emissions-data';

    constructor(private readonly opts: IDataLockGatewayOptions) {}

    async getTxDetails(caller: IFabricTxCaller, txID: string): Promise<ITxDetails> {
        const fnTag = `${this.className}.getTxDetails()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} txID = ${txID}`);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Call,
                methodName: 'getTxDetails',
                params: [txID],
            });
            ledgerLogger.debug(`${fnTag} resp : %o`, resp.functionOutput);
            return JSON.parse(resp.functionOutput);
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to get tx details : ${m}`, 409);
        }
    }

    async startTransitionProcess(caller: IFabricTxCaller, txID: string): Promise<ITxDetails> {
        const fnTag = `${this.className}.startTransitionProcess()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} txID = ${txID}`);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'startTransitionProcess',
                params: [txID],
            });
            ledgerLogger.debug(`${fnTag} resp : %o`, resp.functionOutput);
            return JSON.parse(resp.functionOutput);
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to start tx : ${m}`, 409);
        }
    }

    async endTransitionProcess(caller: IFabricTxCaller, txID: string): Promise<void> {
        const fnTag = `${this.className}.endTransitionProcess()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} txID = ${txID}`);
        try {
            await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'endTransitionProcess',
                params: [txID],
            });
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to end tx : ${m}`, 409);
        }
    }

    async stageUpdate(
        caller: IFabricTxCaller,
        input: ITxStageUpdateInput,
    ): Promise<ITxStageUpdateOutput> {
        const fnTag = `${this.className}.stageUpdate()`;
        ledgerLogger.debug(`${fnTag} creating signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} input : %o`, input);
        try {
            const resp = await this.opts.fabricConnector.transact({
                signingCredential: signer,
                channelName: this.channelName,
                contractName: this.ccName,
                invocationType: FabricContractInvocationType.Send,
                methodName: 'stageUpdate',
                params: [JSON.stringify(input)],
            });
            ledgerLogger.debug(`${fnTag} resp : %o`, resp.functionOutput);
            return JSON.parse(resp.functionOutput);
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to update tx stage : ${m}`, 409);
        }
    }
}
