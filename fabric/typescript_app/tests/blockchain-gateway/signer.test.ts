import Signer from '../../src/blockchain-gateway-lib/signer';
import chai from 'chai';
import { FabricSigningCredentialType } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import ClientError from '../../src/errors/clientError';
import {
    Web3SigningCredentialPrivateKeyHex,
    Web3SigningCredentialType,
} from '@hyperledger/cactus-plugin-ledger-connector-xdai';
import { randomBytes } from 'crypto';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();

describe('Signer', () => {
    it('should create signer', () => {
        const signer = new Signer('vault', 'certstore', 'plain');
        signer.should.not.undefined;
    });

    it('throw for non supporting hlf identity', () => {
        try {
            new Signer('unknown', 'certstore', 'plain');
            true.should.be.false;
        } catch (error) {
            (error as Error).message.should.be.eq(
                `Signer.constructor() support fabric tx signing using "vault" and "web-socket", but provided : unknown`,
            );
        }
    });

    it('throw for non supporting eth identity', () => {
        try {
            new Signer('vault', 'certstore', 'unknown');
            true.should.be.false;
        } catch (error) {
            (error as Error).message.should.be.eq(
                `Signer.constructor() support ethereum tx signing using "plain" or "kv", but provided : unknown`,
            );
        }
    });

    it('throws if web-socket or vault API keys are not provided', () => {
        const hlfSupport = process.env.LEDGER_FABRIC_TX_SIGNER_TYPES || '';
        const s = new Signer(hlfSupport, 'certstore', 'plain');
        try {
            s.fabric({
                userId: 'admin',
            });
            true.should.be.false;
        } catch (error) {
            (error as ClientError).message.should.be.eq(
                `Signer.fabric() missing ${hlfSupport
                    .split(' ')
                    .join(' or ')} API keys to sign fabric transactions`,
            );
            (error as ClientError).status.should.be.eq(400);
        }
    });

    it('should return fabric signer type = vault', () => {
        const s = new Signer('vault', 'certstore', 'plain');
        const userId = 'admin';
        const token = 'vault-token';
        const signer = s.fabric({
            userId: userId,
            vaultToken: token,
        });
        signer.keychainId.should.eq('certstore');
        signer.keychainRef.should.eq(userId);
        chai.expect(signer.type).not.be.undefined;
        chai.expect(signer.type).exist;
        if (signer.type) {
            signer.type.should.eq(FabricSigningCredentialType.VaultX509);
        }
        chai.expect(signer.vaultTransitKey).not.be.undefined;
        chai.expect(signer.vaultTransitKey).exist;
        if (signer.vaultTransitKey) {
            signer.vaultTransitKey.should.not.be.undefined;
            signer.vaultTransitKey.keyName.should.eq(userId);
            signer.vaultTransitKey.token.should.eq(token);
        }
    });

    const sessionId = randomBytes(8).toString('hex');
    const signature = randomBytes(256).toString('hex');
    it('should return fabric signer type = web-socket', () => {
        const userId = 'admin';
        const s = new Signer('web-socket', 'certstore', 'plain');
        const signer = s.fabric({
            userId: userId,
            webSocketKey: {
                sessionId,
                signature,
            },
        });
        signer.keychainId.should.eq('certstore');
        signer.keychainRef.should.eq(userId);
        chai.expect(signer.type).not.be.undefined;
        chai.expect(signer.type).exist;
        if (signer.type) {
            signer.type.should.eq(FabricSigningCredentialType.WsX509);
        }
        chai.expect(signer.webSocketKey).not.be.undefined;
        chai.expect(signer.webSocketKey).exist;
        if (signer.webSocketKey) {
            signer.webSocketKey.should.not.be.undefined;
            signer.webSocketKey.sessionId.should.eq(sessionId);
            signer.webSocketKey.signature.should.eq(signature);
        }
    });

    it('throws if ws session id is not provided', () => {
        const s = new Signer('web-socket', 'certstore', 'plain');
        try {
            s.fabric({
                userId: 'admin',
                webSocketKey: {
                    sessionId: '',
                    signature,
                },
            });
            true.should.be.false;
        } catch (error) {
            (error as ClientError).message.should.be.eq(
                'Signer.fabric() require web-socket session ID to sign fabric transactions with ws-wallet',
            );
            (error as ClientError).status.should.be.eq(400);
        }
    });

    it('throws if ws session id signature is not provided', () => {
        const s = new Signer('web-socket', 'certstore', 'plain');
        try {
            s.fabric({
                userId: 'admin',
                webSocketKey: {
                    sessionId,
                    signature: '',
                },
            });
            true.should.be.false;
        } catch (error) {
            (error as ClientError).message.should.be.eq(
                'Signer.fabric() require web-socket session ID signature to sign fabric transactions with ws-wallet',
            );
            (error as ClientError).status.should.be.eq(400);
        }
    });

    it('should return eth signer for type=plain', async () => {
        const s = new Signer('vault', 'certstore', 'plain');
        const signer = await s.ethereum({
            address: '0xaddress',
            private: '0xprivate',
        });
        signer.type.should.be.eq(Web3SigningCredentialType.PrivateKeyHex);
        (signer as Web3SigningCredentialPrivateKeyHex).ethAccount.should.be.eq('0xaddress');
        (signer as Web3SigningCredentialPrivateKeyHex).secret.should.be.eq('0xprivate');
    });

    it('throws if eth address || private is not provided', async () => {
        const s = new Signer('vault', 'certstore', 'plain');
        try {
            await s.ethereum({});
            true.should.be.false;
        } catch (error) {
            (error as ClientError).status.should.be.eq(400);
        }
    });
});
