import {
    EthContractInvocationType,
    PluginLedgerConnectorXdai,
} from '@hyperledger/cactus-plugin-ledger-connector-xdai';
import ClientError from '../errors/clientError';
import { ledgerLogger, setup as loggerSetup } from '../utils/logger';
import {
    IEthNetEmissionsTokenGateway,
    IEthTxCaller,
    IEthNetEmissionsTokenIssueInput,
    IEthNetEmissionsTokenIssueOutput,
} from './I-gateway';
import Signer from './signer';
import Web3 from 'web3';
import contractABI from '../static/contract-NetEmissionsTokenNetwork.json';
import { Checks } from '@hyperledger/cactus-common';

interface IEthNetEmissionsTokenGatewayOptions {
    ethClient: PluginLedgerConnectorXdai;
    signer: Signer;
    contractStoreKeychain: string;
}

export default class EthNetEmissionsTokenGateway implements IEthNetEmissionsTokenGateway {
    private readonly contractName = 'NetEmissionsTokenNetwork';
    private readonly className = 'EthNetEmissionsTokenGateway';
    private readonly tokenTypeId = 3;
    private readonly web3 = new Web3();
    private readonly EventTokenCreatedInput: {
        internalType: string;
        name: string;
        type: string;
    }[];
    constructor(private readonly opts: IEthNetEmissionsTokenGatewayOptions) {
        if (!ledgerLogger) {
            loggerSetup('silent', 'silent');
        }
        const tokenCreatedABI = contractABI.find((value) => {
            return value.type === 'event' && value.name === 'TokenCreated';
        });
        Checks.truthy(tokenCreatedABI, `EthNetEmissionsTokenGateway tokenCreated event abi`);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.EventTokenCreatedInput = tokenCreatedABI!.inputs;
    }

    async registerConsumer(
        caller: IEthTxCaller,
        input: { address: string },
    ): Promise<{ address: string }> {
        const fnTag = `${this.className}.issue()`;
        ledgerLogger.debug(`${fnTag} getting signer for client: caller = %o`, caller);
        const signer = await this.opts.signer.ethereum(caller);
        ledgerLogger.debug(`${fnTag} calling issue method input = %o`, input);
        try {
            await this.opts.ethClient.invokeContract({
                contractName: this.contractName,
                web3SigningCredential: signer,
                invocationType: EthContractInvocationType.Send,
                methodName: 'registerConsumer',
                params: [input.address],
                keychainId: this.opts.contractStoreKeychain,
            });
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to invoke issue method : ${errMsg}`, 409);
        }
        return { address: input.address };
    }

    async issue(
        caller: IEthTxCaller,
        input: IEthNetEmissionsTokenIssueInput,
    ): Promise<IEthNetEmissionsTokenIssueOutput> {
        const fnTag = `${this.className}.issue()`;
        ledgerLogger.debug(`${fnTag} getting signer for client: caller = %o`, caller);
        const signer = await this.opts.signer.ethereum(caller);
        ledgerLogger.debug(`${fnTag} calling issue method input = %o`, input);
        let result;
        try {
            result = await this.opts.ethClient.invokeContract({
                contractName: this.contractName,
                web3SigningCredential: signer,
                invocationType: EthContractInvocationType.Send,
                methodName: 'issue',
                params: [
                    input.issuedFrom,
                    input.issuedTo,
                    this.tokenTypeId,
                    input.quantity,
                    input.fromDate,
                    input.thruDate,
                    input.metadata,
                    input.manifest,
                    input.description,
                ],
                keychainId: this.opts.contractStoreKeychain,
            });
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to invoke issue method : ${errMsg}`, 409);
        }

        // There is no 'out' on invokeContractV1Response .. does this even work?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txReceipt = (result as any).out.transactionReceipt;
        // TODO move decode logic to cactus xdai connector
        ledgerLogger.debug(`${fnTag} decoding ethereum response`);
        const logData = txReceipt.logs[2];
        ledgerLogger.debug(`${fnTag} logData = %o`, logData);
        const hexString = logData.data;
        // Need to remove the first element of topics for non-anonymous events
        const topics = logData.topics.slice(1);
        const tokenCreatedDecoded = this.web3.eth.abi.decodeLog(
            this.EventTokenCreatedInput,
            hexString,
            topics,
        );
        ledgerLogger.debug(`${fnTag} tokenCreatedDecoded = %o`, tokenCreatedDecoded);

        return {
            availableBalance: tokenCreatedDecoded.availableBalance,
            retiredBalance: tokenCreatedDecoded.retiredBalance,
            tokenId: tokenCreatedDecoded.tokenId,
            tokenTypeId: tokenCreatedDecoded.tokenTypeId,
            issuedFrom: tokenCreatedDecoded.issuedFrom,
            issuedTo: tokenCreatedDecoded.issuedTo,
            fromDate: tokenCreatedDecoded.fromDate,
            thruDate: tokenCreatedDecoded.thruDate,
            dateCreated: tokenCreatedDecoded.dateCreated,
            metadata: tokenCreatedDecoded.metadata,
            manifest: tokenCreatedDecoded.manifest,
            description: tokenCreatedDecoded.description,
        };
    }
}
