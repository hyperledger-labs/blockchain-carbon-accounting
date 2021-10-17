import { config } from 'dotenv';
import BCGatewayConfig from '../../src/blockchain-gateway/config';
import Signer from '../../src/blockchain-gateway/signer';
import FabricRegistryGateway from '../../src/blockchain-gateway/fabricRegistry';
import { setup } from '../../src/utils/logger';
import { v4 as uuid4 } from 'uuid';
import chai from 'chai';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();
import asPromise from 'chai-as-promised';
import ClientError from '../../src/errors/clientError';
import { WsWallet } from 'ws-wallet';
import { randomBytes } from 'crypto';
import { WsIdentityClient } from 'ws-identity-client';
chai.use(asPromise);

setup('DEBUG', 'DEBUG');

config();

describe('fabric-registry', () => {
    const bcConfig = new BCGatewayConfig();
    const certstore = bcConfig.pluginRegistry.findOneByKeychainId('inMemoryKeychain');
    const fabricConnector = bcConfig.fabricConnector();
    describe('vault', () => {
        const signer = new Signer('vault', certstore.getKeychainId(), 'plain');
        const fabricRegistry = new FabricRegistryGateway({
            fabricConnector: fabricConnector.connector,
            signer: signer,
            caId: fabricConnector.caID,
            orgMSP: fabricConnector.orgMSP,
        });
        const adminVaultToken = 'tokenId';
        it('should enroll admin', async () => {
            await fabricRegistry.enroll(
                {
                    userId: 'admin',
                    vaultToken: adminVaultToken,
                },
                'adminpw',
            );
            const cert = JSON.parse(await certstore.get('admin'));
            cert.type.should.be.eq('Vault-X.509');
        });

        it('enroll throws if wrong secret passed', () => {
            return fabricRegistry
                .enroll(
                    {
                        userId: 'admin',
                        vaultToken: adminVaultToken,
                    },
                    'wrong-secret',
                )
                .should.be.rejectedWith('FabricRegistryGateway.enroll() invalid enrollmentSecret');
        });

        it('enroll throws if wrong token is passed', async () => {
            try {
                await fabricRegistry.enroll(
                    {
                        userId: 'admin',
                        vaultToken: 'wrong-token',
                    },
                    'adminpw',
                );
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
        it('should register a client', async () => {
            const enrollmentID = uuid4();
            const resp = await fabricRegistry.register(
                {
                    userId: 'admin',
                    vaultToken: adminVaultToken,
                },
                {
                    enrollmentID: enrollmentID,
                    affiliation: 'auditor1.department1',
                },
            );
            resp.enrollmentID.should.be.eq(enrollmentID);
            resp.enrollmentSecret.should.not.be.empty;
        });
        it('register throw if wrong token is passed', async () => {
            const enrollmentID = uuid4();
            try {
                await fabricRegistry.register(
                    {
                        userId: 'admin',
                        vaultToken: 'wrong-token',
                    },
                    {
                        enrollmentID: enrollmentID,
                        affiliation: 'auditor1.department1',
                    },
                );
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
    });
    // External client with private key
    const wsWalletAdmin = new WsWallet({
        keyName: 'admin',
    });
    const wsIdClient = new WsIdentityClient({
        apiVersion: 'v1',
        endpoint: process.env.WS_IDENTITY_ENDPOINT,
        rpDefaults: {
            strictSSL: false,
        },
    });
    describe('web-socket', async () => {
        const signer = new Signer('web-socket', certstore.getKeychainId(), 'plain');
        const fabricRegistry = new FabricRegistryGateway({
            fabricConnector: fabricConnector.connector,
            signer: signer,
            caId: fabricConnector.caID,
            orgMSP: fabricConnector.orgMSP,
        });

        const { sessionId, url } = JSON.parse(
            await wsIdClient.write(
                'session/new',
                {
                    pubKeyHex: wsWalletAdmin.getPubKeyHex(),
                    keyName: wsWalletAdmin.keyName,
                },
                {},
            ),
        );
        const key = await wsWalletAdmin.open(sessionId, url);
        console.log(key);

        it('should enroll admin', async () => {
            await fabricRegistry.enroll(
                {
                    userId: 'admin',
                    wsSessionId: key.sessionId,
                    wsSidSig: key.signature,
                },
                'adminpw',
            );
            const cert = JSON.parse(await certstore.get('admin'));
            cert.type.should.be.eq('WS-X.509');
        });

        it('enroll throws if wrong secret passed', () => {
            return fabricRegistry
                .enroll(
                    {
                        userId: 'admin',
                        wsSessionId: key.sessionId,
                        wsSidSig: key.signature,
                    },
                    'wrong-secret',
                )
                .should.be.rejectedWith('FabricRegistryGateway.enroll() invalid enrollmentSecret');
        });

        it('enroll throws if wrong signature is passed', async () => {
            try {
                await fabricRegistry.enroll(
                    {
                        userId: 'admin',
                        wsSessionId: key.sessionId,
                        wsSidSig: randomBytes(256).toString('hex'),
                    },
                    'adminpw',
                );
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
        it('enroll throws if wrong session id is passed', async () => {
            try {
                await fabricRegistry.enroll(
                    {
                        userId: 'admin',
                        wsSessionId: randomBytes(8).toString('hex'),
                        wsSidSig: key.signature,
                    },
                    'adminpw',
                );
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
        it('should register a client', async () => {
            const enrollmentID = uuid4();
            const resp = await fabricRegistry.register(
                {
                    userId: 'admin',
                    wsSessionId: key.sessionId,
                    wsSidSig: key.signature,
                },
                {
                    enrollmentID: enrollmentID,
                    affiliation: 'auditor1.department1',
                },
            );
            resp.enrollmentID.should.be.eq(enrollmentID);
            resp.enrollmentSecret.should.not.be.empty;
        });
        it('register throw if wrong token is passed', async () => {
            const enrollmentID = uuid4();
            try {
                await fabricRegistry.register(
                    {
                        userId: 'admin',
                        wsSessionId: randomBytes(8).toString('hex'),
                        wsSidSig: key.signature,
                    },
                    {
                        enrollmentID: enrollmentID,
                        affiliation: 'auditor1.department1',
                    },
                );
                true.should.be.false;
            } catch (error) {
                (error as ClientError).status.should.be.eq(409);
            }
        });
    });
});
