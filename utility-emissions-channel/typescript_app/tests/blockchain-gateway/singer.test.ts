import Singer from '../../src/blockchain-gateway/singer';
import chai from 'chai';
import { FabricSigningCredentialType } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import ClientError from '../../src/errors/clientError';
import {
    Web3SigningCredentialPrivateKeyHex,
    Web3SigningCredentialType,
} from '@hyperledger/cactus-plugin-ledger-connector-xdai';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const should = chai.should();

describe('Singer', () => {
    it('should create singer', () => {
        const signer = new Singer('vault', 'certstore', 'plain');
        signer.should.not.undefined;
    });

    it('throw for non supporting hlf identity', () => {
        try {
            new Singer('unknown', 'certstore', 'plain');
            true.should.be.false;
        } catch (error) {
            (error as Error).message.should.be.eq(
                `Singer.constructor() support fabric tx signing using "vault", but provided : unknown`,
            );
        }
    });

    it('throw for non supporting eth identity', () => {
        try {
            new Singer('vault', 'certstore', 'unknown');
            true.should.be.false;
        } catch (error) {
            (error as Error).message.should.be.eq(
                `Singer.constructor() support ethereum tx signing using "plain", but provided : unknown`,
            );
        }
    });

    it('should return fabric signer type = vault', () => {
        const s = new Singer('vault', 'certstore', 'plain');
        const userId = 'admin';
        const token = 'vault-token';
        const singer = s.fabric({
            userId: userId,
            vaultToken: token,
        });
        singer.keychainId.should.eq('certstore');
        singer.keychainRef.should.eq(userId);
        singer.type.should.eq(FabricSigningCredentialType.VaultX509);
        singer.vaultTransitKey.should.not.be.undefined;
        singer.vaultTransitKey.keyName.should.eq(userId);
        singer.vaultTransitKey.token.should.eq(token);
    });

    it('throws if vault token is not provided', () => {
        const s = new Singer('vault', 'certstore', 'plain');
        try {
            s.fabric({
                userId: 'admin',
            });
            true.should.be.false;
        } catch (error) {
            (error as ClientError).message.should.be.eq(
                'Singer.fabric() require vault token for singing fabric transactions',
            );
            (error as ClientError).status.should.be.eq(400);
        }
    });

    it('should return eth signer for type=plain', () => {
        const s = new Singer('vault', 'certstore', 'plain');
        const signer = s.ethereum({
            address: '0xaddress',
            private: '0xprivate',
        });
        signer.type.should.be.eq(Web3SigningCredentialType.PrivateKeyHex);
        (signer as Web3SigningCredentialPrivateKeyHex).ethAccount.should.be.eq('0xaddress');
        (signer as Web3SigningCredentialPrivateKeyHex).secret.should.be.eq('0xprivate');
    });

    it('throws if eth address || private is not provided', () => {
        const s = new Singer('vault', 'certstore', 'plain');
        try {
            s.ethereum({});
            true.should.be.false;
        } catch (error) {
            (error as ClientError).message.should.be.eq(
                'Singer.ethereum require eth address and private key for signing ethereum tx',
            );
            (error as ClientError).status.should.be.eq(400);
        }
    });
});
