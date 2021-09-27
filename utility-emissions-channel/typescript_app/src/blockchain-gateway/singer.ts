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
    private readonly className = 'Singer';
    constructor(
        private readonly hlfSupport: string,
        private readonly hlfCertStoreID: string,
        private readonly ethSupport: string,
        private readonly ethSecretKeychainID?: string,
    ) {
        const fnTag = `${this.className}.constructor()`;
        if (!(hlfSupport === 'vault')) {
            throw new Error(
                `${fnTag} support fabric tx signing using "vault", but provided : ${hlfSupport}`,
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
        const singer: FabricSigningCredential = {
            keychainId: this.hlfCertStoreID,
            keychainRef: caller.userId,
        };
        switch (this.hlfSupport) {
            case 'vault':
                if (!caller.vaultToken || caller.vaultToken.length === 0) {
                    throw new ClientError(
                        `${fnTag} require vault token for singing fabric transactions`,
                    );
                }
                singer.type = FabricSigningCredentialType.VaultX509;
                singer.vaultTransitKey = {
                    token: caller.vaultToken,
                    keyName: caller.userId,
                };
                break;
        }
        return singer;
    }
    ethereum(caller: IEthTxCaller): Web3SigningCredential {
        const fnTag = `${this.className}.ethereum`;
        let singer: Web3SigningCredential;
        switch (this.ethSupport) {
            case 'plain':
                if (!caller.address || !caller.private) {
                    throw new ClientError(
                        `${fnTag} require eth address and private key for signing ethereum tx`,
                    );
                }
                singer = {
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
                singer = {
                    type: Web3SigningCredentialType.CactusKeychainRef,
                    ethAccount: caller.address,
                    keychainEntryKey: 'eth-' + caller.keyName,
                    keychainId: this.ethSecretKeychainID,
                };
                break;
        }
        return singer;
    }
}
