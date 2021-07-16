// netEmissionsTokenNetwork.ts : will call ethereum network to invoke
// NetEmissionsTokenNetwork contract
import {Logger, LoggerProvider, LogLevelDesc,Checks} from '@hyperledger/cactus-common';
import {
    EthContractInvocationType,
    PluginLedgerConnectorXdai,
    Web3SigningCredentialPrivateKeyHex,
    Web3SigningCredentialType,
    InvokeContractV1Request,
    ReceiptType
} from '@hyperledger/cactus-plugin-ledger-connector-xdai';
import Web3 from 'web3';
import {IIssueRequest,IIssueResponse} from './I-netEmissionsTokenNetwork';
import contractABI from '../contracts/NetEmissionsTokenNetwork.json';

export interface INetEmissionsTokenNetworkContractOptions{
    logLevel:LogLevelDesc;
    ethClient:PluginLedgerConnectorXdai;
    keychainId:string;
    contractName:string;
    isDev:boolean;
    keys:{
        private:string,
        public:string
    };
    contractAddress:string;
}

export class NetEmissionsTokenNetworkContract{
    static readonly CLASS_NAME = 'NetEmissionsTokenNetworkContract';
    private readonly tokenTypeId = 3;
    private readonly signer:Web3SigningCredentialPrivateKeyHex;

    // ethereum contract request options
    private  blockConfirmations = 3;
    private receiptType:ReceiptType = ReceiptType.LedgerBlockAck;
    private timeout = 3000; // ms

    // events input definitions
    private readonly EventTokenCreatedInput:any[];

    private readonly web3:Web3;
    private readonly log:Logger;
    get className():string{
        return NetEmissionsTokenNetworkContract.CLASS_NAME;
    }

    constructor(private readonly opts:INetEmissionsTokenNetworkContractOptions){
        const fnTag = `${this.className}#constructor`;
        this.log = LoggerProvider.getOrCreate({label:this.className,level:opts.logLevel});
        this.signer = {
            type : Web3SigningCredentialType.PrivateKeyHex,
            ethAccount: opts.keys.public,
            secret: opts.keys.private
        };
        if (opts.isDev){
            this.receiptType = ReceiptType.NodeTxPoolAck;
            this.timeout = 1;
            this.blockConfirmations  = 0;
        }
        this.log.debug(`${fnTag} ${this.receiptType}`);
        const tokenCreatedABI = contractABI.abi.find((value)=>{
            return value.type === 'event' && value.name === 'TokenCreated';
        });
        Checks.truthy(tokenCreatedABI,`${fnTag} tokenCreated event abi`);
        this.EventTokenCreatedInput = tokenCreatedABI.inputs;
        // web3 for decoding log messages
        this.web3 = new Web3();
    }

    async issue(token:IIssueRequest):Promise<IIssueResponse>{
        // send call to contract
        // wait for conformation
        const fnTag = 'issue';
        try {
            const automaticRetireDate = +token.automaticRetireDate.toFixed();
            const invokeReq:InvokeContractV1Request = {
                contractName: this.opts.contractName,
                signingCredential: this.signer,
                invocationType: EthContractInvocationType.Send,
                methodName: 'issue',
                params: [
                    token.addressToIssue,
                    this.tokenTypeId,
                    token.quantity,
                    token.fromDate,
                    token.thruDate,
                    automaticRetireDate,
                    token.metadata,
                    token.manifest,
                    token.description
                ],
                keychainId: this.opts.keychainId
            };
            this.log.debug(`${fnTag} invoking contract params = ${invokeReq.params}`);
            const result = await this.opts.ethClient.invokeContract(invokeReq);
            if (!result.success){
                throw new Error(`failed to invoke ${this.opts.contractName}`);
            }
            this.log.debug(`waiting for conformation from the network`);
            // TODO : fix this in cactus
            const txHash = result['out'].transactionReceipt.transactionHash;
            const txReceipt = await this.opts.ethClient.pollForTxReceipt(txHash,{
                receiptType: this.receiptType,
                timeoutMs: this.timeout,
                blockConfirmations: this.blockConfirmations
            });
            this.log.debug(`received transaction receipt with ${this.blockConfirmations} blocks confirmation`);
            // decode logs to get readable format
            const logData = txReceipt.logs[2];
            const hexString = logData.data;
            const topics = logData.topics;
            const tokenCreatedDecoded = this.web3.eth.abi.decodeLog(this.EventTokenCreatedInput,hexString,topics);
            const output:IIssueResponse = {
                tokenId : `${this.opts.contractAddress}:${tokenCreatedDecoded.tokenId}`
            };
            return output;
        } catch (error) {
            throw error;
        }
    }
}