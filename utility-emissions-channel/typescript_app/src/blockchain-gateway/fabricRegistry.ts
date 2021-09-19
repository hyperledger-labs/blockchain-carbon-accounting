import { PluginLedgerConnectorFabric } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {
    IFabricRegistryGateway,
    IFabricTxCaller,
    IFabricRegisterInput,
    IFabricRegisterOutput,
} from './I-gateway';
import Singer from './singer';
import { ledgerLogger } from '../utils/logger';
import ClientError from '../errors/clientError';

interface IFabricRegistryGatewayOptions {
    fabricConnector: PluginLedgerConnectorFabric;
    singer: Singer;
    caId: string;
    orgMSP: string;
}

export default class FabricRegistryGateway implements IFabricRegistryGateway {
    private readonly className = 'FabricRegistryGateway';
    constructor(private readonly opts: IFabricRegistryGatewayOptions) {}

    async enroll(caller: IFabricTxCaller, secret: string): Promise<void> {
        const fnTag = `${this.className}.enroll()`;
        ledgerLogger.debug(`${fnTag} getting singer for the caller`);
        const singer = this.opts.singer.fabric(caller);
        ledgerLogger.debug(`${fnTag} enroll with fabric ca`);
        try {
            await this.opts.fabricConnector.enroll(singer, {
                enrollmentID: caller.userId,
                enrollmentSecret: secret,
                mspId: this.opts.orgMSP,
                caId: this.opts.caId,
            });
            ledgerLogger.debug(`${fnTag} client enrolled with fabric-ca`);
        } catch (error) {
            if (error?.errors && error.errors[0] && error.errors[0].code === 20) {
                throw new ClientError(`${fnTag} invalid enrollmentSecret`, 403);
            }
            throw new ClientError(`${fnTag} failed to enroll : ${error.message}`, 409);
        }
    }
    async register(
        caller: IFabricTxCaller,
        input: IFabricRegisterInput,
    ): Promise<IFabricRegisterOutput> {
        const fnTag = `${this.className}.register()`;
        ledgerLogger.debug(`${fnTag} getting singer for the client`);
        const singer = this.opts.singer.fabric(caller);
        ledgerLogger.debug(`${fnTag} register with fabric ca`);
        try {
            const secret = await this.opts.fabricConnector.register(
                singer,
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
            throw new ClientError(`${fnTag} failed to register : ${error.message}`, 409);
        }
    }
}
