import { IFabricTxCaller, IEthTxCaller } from './I-gateway';
import {
    FabricSigningCredential,
    FabricSigningCredentialType,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {
    Web3SigningCredential,
    Web3SigningCredentialType,
} from '@hyperledger/cactus-plugin-ledger-connector-xdai';
import ClientError from '../errors/clientError';
import { IPluginKeychain } from '@hyperledger/cactus-core-api';

export default class Signer {
    private readonly className = 'Signer';
    constructor(
        private readonly hlfSupport: string,
        private readonly hlfCertStoreID: string,
        private readonly ethSupport: string,
        private readonly ethSecretKeychain?: IPluginKeychain,
    ) {
        const fnTag = `${this.className}.constructor()`;
        if (!(hlfSupport.includes('vault') || hlfSupport.includes('web-socket'))) {
            throw new Error(
                `${fnTag} support fabric tx signing using "vault" and "web-socket", but provided : ${hlfSupport}`,
            );
        }
        if (!(ethSupport.includes('plain') || ethSupport.includes('kv'))) {
            throw new Error(
                `${fnTag} support ethereum tx signing using "plain" or "kv", but provided : ${ethSupport}`,
            );
        }
    }

    fabric(caller: IFabricTxCaller): FabricSigningCredential {
        const fnTag = `${this.className}.fabric()`;
        const signer: FabricSigningCredential = {
            keychainId: this.hlfCertStoreID,
            keychainRef: caller.userId,
        };
        if (this.hlfSupport.includes('vault') && caller.vaultToken) {
            if (caller.vaultToken.length === 0) {
                throw new ClientError(
                    `${fnTag} require vault token for singing fabric transactions`,
                );
            }
            signer.type = FabricSigningCredentialType.VaultX509;
            signer.vaultTransitKey = {
                token: caller.vaultToken,
                keyName: caller.userId,
            };
        } else if (this.hlfSupport.includes('web-socket') && caller.webSocketKey) {
            if (caller.webSocketKey['sessionId'].length === 0) {
                throw new ClientError(
                    `${fnTag} require web-socket session ID to sign fabric transactions with ws-wallet`,
                );
            }
            if (caller.webSocketKey['signature'].length === 0) {
                throw new ClientError(
                    `${fnTag} require web-socket session ID signature to sign fabric transactions with ws-wallet`,
                );
            }
            signer.type = FabricSigningCredentialType.WsX509;
            signer.webSocketKey = caller.webSocketKey;
        } else {
            throw new ClientError(
                `${fnTag} missing ${this.hlfSupport
                    .split(' ')
                    .join(' or ')} API keys to sign fabric transactions`,
            );
        }
        return signer;
    }
    async ethereum(caller: IEthTxCaller): Promise<Web3SigningCredential> {
        const fnTag = `${this.className}.ethereum`;
        let signer: Web3SigningCredential;
        if (this.ethSupport.includes('plain') && caller.address && caller.private) {
            signer = {
                type: Web3SigningCredentialType.PrivateKeyHex,
                ethAccount: caller.address,
                secret: caller.private,
            };
        } else if (this.ethSupport.includes('kv') && caller.keyName) {
            try {
                // eslint-disable-next-line
                const key = (await this.ethSecretKeychain?.get(`eth-` + caller.keyName)) as any;
                signer = {
                    type: Web3SigningCredentialType.PrivateKeyHex,
                    ethAccount: key.address,
                    secret: key.private,
                };
            } catch (error) {
                throw new ClientError(`${fnTag} key not found in kv store: ${error}`);
            }
        } else {
            throw new ClientError(
                `${fnTag} missing parameter for ${this.ethSupport.split(' ').join(' or ')}`,
            );
        }
        return signer;
    }
}
