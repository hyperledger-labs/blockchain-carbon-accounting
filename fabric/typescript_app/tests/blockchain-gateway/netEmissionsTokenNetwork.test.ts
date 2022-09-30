import BCGatewayConfig from '../../src/blockchain-gateway-lib/config';
import EthNetEmissionsTokenGateway from '../../src/blockchain-gateway-lib/netEmissionsTokenNetwork';
import Signer from '../../src/blockchain-gateway-lib/signer';
import {
    IEthTxCaller,
    IEthNetEmissionsTokenIssueInput,
} from '../../src/blockchain-gateway-lib/I-gateway';
import { config } from 'dotenv';
import { setup } from '../../src/utils/logger';
import ClientError from '../../src/errors/clientError';
import chai from 'chai';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();

// env
config();
setup('DEBUG', 'DEBUG');

describe('EthNetEmissionsTokenGateway', () => {
    const bcConfig = new BCGatewayConfig();
    describe('plain', async () => {
        let gateway: EthNetEmissionsTokenGateway;
        before(async () => {
            const ethConnector = await bcConfig.ethConnector();
            const signer = new Signer('vault', bcConfig.inMemoryKeychainID, 'plain');
            gateway = new EthNetEmissionsTokenGateway({
                contractStoreKeychain: ethConnector.contractStoreKeychain,
                ethClient: ethConnector.connector,
                signer: signer,
            });
        });
        const caller: Required<Pick<IEthTxCaller, 'address' | 'private'>> = {
            address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
            private: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        };

        it('should register consumer', async () => {
            await gateway.registerConsumer(caller, {
                address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
            });
        });

        it('should issue emission token', async () => {
            const input: IEthNetEmissionsTokenIssueInput = {
                issuedFrom: caller.address,
                issuedTo: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
                quantity: BigInt(100),
                fromDate: 454545,
                thruDate: 45454,
                metadata: 'test-token-metadata',
                manifest: 'test-token-manifest',
                description: 'test-token-description',
            };
            const token = await gateway.issue(caller, input);
            token.tokenTypeId.should.be.eq('3');
            token.manifest.should.be.eq(input.manifest);
            token.metadata.should.be.eq(input.metadata);
            token.description.should.be.eq(input.description);
            token.fromDate.should.be.eq(input.fromDate.toString());
            token.thruDate.should.be.eq(input.thruDate.toString());
        });

        it('throws', async () => {
            try {
                await gateway.issue(caller, {
                    issuedFrom: caller.address,
                    issuedTo: '0x7invalid',
                    quantity: BigInt(100),
                    fromDate: 454545,
                    thruDate: 45454,
                    metadata: 'test-token-metadata',
                    manifest: 'test-token-manifest',
                    description: 'test-token-description',
                });
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
    });
    describe('kv', async () => {
        let gateway: EthNetEmissionsTokenGateway;
        before(async () => {
            const ethConnector = await bcConfig.ethConnector();
            const signer = new Signer(
                'vault',
                bcConfig.inMemoryKeychainID,
                'kv',
                bcConfig.pluginRegistry.findOneByKeychainId(bcConfig.certStoreID),
            );
            gateway = new EthNetEmissionsTokenGateway({
                contractStoreKeychain: ethConnector.contractStoreKeychain,
                ethClient: ethConnector.connector,
                signer: signer,
            });
        });
        const caller: Required<Pick<IEthTxCaller, 'address' | 'keyName'>> = {
            address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
            keyName: 'admin',
        };
        it('should issue emission token', async () => {
            const input: IEthNetEmissionsTokenIssueInput = {
                issuedFrom: caller.address,
                issuedTo: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
                quantity: BigInt(100),
                fromDate: 454545,
                thruDate: 45454,
                metadata: 'test-token-metadata',
                manifest: 'test-token-manifest',
                description: 'test-token-description',
            };
            const token = await gateway.issue(caller, input);
            token.tokenTypeId.should.be.eq('3');
            token.manifest.should.be.eq(input.manifest);
            token.metadata.should.be.eq(input.metadata);
            token.description.should.be.eq(input.description);
            token.fromDate.should.be.eq(input.fromDate.toString());
            token.thruDate.should.be.eq(input.thruDate.toString());
        });

        it('throws', async () => {
            try {
                await gateway.issue(caller, {
                    issuedFrom: caller.address,
                    issuedTo: '0x7invalid',
                    quantity: BigInt(100),
                    fromDate: 454545,
                    thruDate: 45454,
                    metadata: 'test-token-metadata',
                    manifest: 'test-token-manifest',
                    description: 'test-token-description',
                });
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
    });
});
