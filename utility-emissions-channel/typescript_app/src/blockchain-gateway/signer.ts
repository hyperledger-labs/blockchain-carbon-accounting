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

export default class Signer {
    private readonly className = 'Signer';
    constructor(
        private readonly hlfSupport: string,
        private readonly hlfCertStoreID: string,
        private readonly ethSupport: string,
        private readonly ethSecretKeychainID?: string,
    ) {
        const fnTag = `${this.className}.constructor()`;
        if (!(hlfSupport.includes('vault') || hlfSupport.includes('web-socket'))) {
            throw new Error(
                `${fnTag} support fabric tx signing using "vault" and "web-socket", but provided : ${hlfSupport}`,
            );
        }
        if (!(ethSupport === 'plain' || ethSupport === 'kv')) {
            throw new Error(
                `${fnTag} support ethereum tx signing using "plain", but provided : ${ethSupport}`,
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
        } else if (this.hlfSupport.includes('web-socket') && caller.wsSessionId) {
            if (caller.wsSessionId.length === 0) {
                throw new ClientError(
                    `${fnTag} require web-socket session ID to sign fabric transactions with ws-wallet`,
                );
            }
            if (!caller.wsSidSig || caller.wsSidSig.length === 0) {
                throw new ClientError(
                    `${fnTag} require web-socket session ID signature to sign fabric transactions with ws-wallet`,
                );
            }
            signer.type = FabricSigningCredentialType.WsX509;
            signer.webSocketKey = {
                sessionId: caller.wsSessionId,
                signature: caller.wsSidSig,
            };
        } else {
            throw new ClientError(
                `${fnTag} missing ${this.hlfSupport
                    .split(' ')
                    .join('or')} API keys to sign fabric transactions`,
            );
        }
        return signer;
    }
    ethereum(caller: IEthTxCaller): Web3SigningCredential {
        const fnTag = `${this.className}.ethereum`;
        let signer: Web3SigningCredential;
        switch (this.ethSupport) {
            case 'plain':
                if (!caller.address || !caller.private) {
                    throw new ClientError(
                        `${fnTag} require eth address and private key for signing ethereum tx`,
                    );
                }
                signer = {
                    type: Web3SigningCredentialType.PrivateKeyHex,
                    ethAccount: caller.address,
                    secret: caller.private,
                };
                break;
            case 'kv':
                if (!caller.keyName || !caller.address) {
                    throw new ClientError(
                        `${fnTag} require eth address and key name stored on key-value keychain, for signing ethereum tx`,
                    );
                }
                signer = {
                    type: Web3SigningCredentialType.CactusKeychainRef,
                    ethAccount: caller.address,
                    keychainEntryKey: 'eth-' + caller.keyName,
                    keychainId: this.ethSecretKeychainID,
                };
                break;
        }
        return signer;
    }
}
