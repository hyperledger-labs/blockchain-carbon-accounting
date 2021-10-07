import {
    FabricContractInvocationType,
    PluginLedgerConnectorFabric,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import { ledgerLogger } from '../utils/logger';
import {
    IFabricTxCaller,
    IDataLockGateway,
    ITxDetails,
    ITxStageUpdateInput,
    ITxStageUpdateOutput,
} from './I-gateway';
import Signer from './signer';
import ClientError from '../errors/clientError';

interface IDataLockGatewayOptions {
    fabricConnector: PluginLedgerConnectorFabric;
    signer: Signer;
}
export class DataLockGateway implements IDataLockGateway {
    private readonly className = 'DataLockGateway';
    private readonly ccName = 'datalock';
    private readonly channelName = 'utilityemissionchannel';

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
            throw new ClientError(`${fnTag} failed to get tx details : ${error.message}`, 409);
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
            throw new ClientError(`${fnTag} failed to start tx : ${error.message}`, 409);
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
            throw new ClientError(`${fnTag} failed to end tx : ${error.message}`, 409);
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
            throw new ClientError(`${fnTag} failed to update tx stage : ${error.message}`, 409);
        }
    }
}
