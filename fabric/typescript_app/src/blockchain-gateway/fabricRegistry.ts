import { PluginLedgerConnectorFabric } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {
    IFabricRegistryGateway,
    IFabricTxCaller,
    IFabricRegisterInput,
    IFabricRegisterOutput,
} from '../blockchain-gateway-lib/I-gateway';
import Signer from '../blockchain-gateway-lib/signer';
import { ledgerLogger } from '../utils/logger';
import ClientError from '../errors/clientError';

interface IFabricRegistryGatewayOptions {
    fabricConnector: PluginLedgerConnectorFabric;
    signer: Signer;
    caId: string;
    orgMSP: string;
}

export default class FabricRegistryGateway implements IFabricRegistryGateway {
    private readonly className = 'FabricRegistryGateway';
    constructor(private readonly opts: IFabricRegistryGatewayOptions) {}

    async enroll(caller: IFabricTxCaller, secret: string): Promise<void> {
        const fnTag = `${this.className}.enroll()`;
        ledgerLogger.debug(`${fnTag} getting signer for the caller`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} enroll with fabric ca`);
        try {
            await this.opts.fabricConnector.enroll(signer, {
                enrollmentID: caller.userId,
                enrollmentSecret: secret,
                mspId: this.opts.orgMSP,
                caId: this.opts.caId,
            });
            ledgerLogger.debug(`${fnTag} client enrolled with fabric-ca`);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errors = (error as any)?.errors;
            if (errors && errors[0] && errors[0].code === 20) {
                throw new ClientError(`${fnTag} invalid enrollmentSecret`, 403);
            }
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to enroll : ${m}`, 409);
        }
    }

    async register(
        caller: IFabricTxCaller,
        input: IFabricRegisterInput,
    ): Promise<IFabricRegisterOutput> {
        const fnTag = `${this.className}.register()`;
        ledgerLogger.debug(`${fnTag} getting signer for the client`);
        const signer = this.opts.signer.fabric(caller);
        ledgerLogger.debug(`${fnTag} register with fabric ca`);
        try {
            const secret = await this.opts.fabricConnector.register(
                signer,
                {
                    enrollmentID: input.enrollmentID,
                    affiliation: input.affiliation,
                    role: 'client',
                },
                this.opts.caId,
            );
            ledgerLogger.debug(`${fnTag} client registered`);
            return {
                enrollmentID: input.enrollmentID,
                enrollmentSecret: secret,
            };
        } catch (error) {
            const m = error instanceof Error ? error.message : String(error);
            throw new ClientError(`${fnTag} failed to register : ${m}`, 409);
        }
    }
}
