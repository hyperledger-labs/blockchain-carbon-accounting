import { Checks } from '@hyperledger/cactus-common';
import { PluginRegistry } from '@hyperledger/cactus-core';
import { PluginKeychainMemory } from '@hyperledger/cactus-plugin-keychain-memory';
import {
    PluginLedgerConnectorXdai,
    IPluginLedgerConnectorXdaiOptions,
} from '@hyperledger/cactus-plugin-ledger-connector-xdai';
import {
    PluginLedgerConnectorFabric,
    IPluginLedgerConnectorFabricOptions,
    FabricSigningCredentialType,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import { v4 as uuid4 } from 'uuid';
import { readFileSync } from 'fs';
import abi from '../static/contract-NetEmissionsTokenNetwork.json';
import { PluginKeychainVault } from '@hyperledger/cactus-plugin-keychain-vault';

interface IFabricOrgConnector {
    orgMSP: string;
    caID: string;
    connector: PluginLedgerConnectorFabric;
}

interface IEthConnector {
    connector: PluginLedgerConnectorXdai;
    contractStoreKeychain: string;
}

export default class BCGatewayConfig {
    private readonly className = 'BCGatewayConfig';
    readonly inMemoryKeychainID = 'inMemoryKeychain';
    readonly certStoreID = 'certStoreKeychain';
    readonly pluginRegistry: PluginRegistry = new PluginRegistry({ plugins: [] });
    constructor() {
        this.pluginRegistry.add(
            new PluginKeychainMemory({
                keychainId: this.inMemoryKeychainID,
                instanceId: uuid4(),
            }),
        );
        this.pluginRegistry.add(
            new PluginKeychainVault({
                endpoint: process.env.VAULT_ENDPOINT,
                token: process.env.VAULT_TOKEN,
                kvSecretsMountPath: process.env.VAULT_KV_MOUNT_PATH + '/data/',
                apiVersion: 'v1',
                keychainId: this.certStoreID,
                instanceId: uuid4(),
            }),
        );
    }
    fabricConnector(): IFabricOrgConnector {
        const fnTag = `${this.className}.fabricConnector()`;
        const opts: IPluginLedgerConnectorFabricOptions = {
            connectionProfile: undefined,
            pluginRegistry: this.pluginRegistry,
            cliContainerEnv: {},
            instanceId: uuid4(),
            peerBinary: 'not-required',
            sshConfig: {},
            discoveryOptions: {
                enabled: true,
                asLocalhost: process.env.LEDGER_FABRIC_AS_LOCALHOST === 'true',
            },
            supportedIdentity: [FabricSigningCredentialType.X509], // for testing
        };

        {
            // read ccp config
            const ccpPath = process.env.LEDGER_FABRIC_CCP;
            Checks.nonBlankString(ccpPath, `${fnTag} LEDGER_FABRIC_CCP`);
            opts.connectionProfile = JSON.parse(readFileSync(ccpPath).toString('utf-8'));
        }

        const signingType = process.env.LEDGER_FABRIC_TX_SIGNER_TYPE || 'vault';
        {
            if (signingType === 'vault') {
                // configure vault signing
                const endpoint = process.env.VAULT_ENDPOINT;
                Checks.nonBlankString(endpoint, `${fnTag} VAULT_ENDPOINT`);
                // configure vault signing
                const mount = process.env.LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT;
                Checks.nonBlankString(mount, `${fnTag} LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT`);
                opts.vaultConfig = {
                    endpoint: endpoint,
                    transitEngineMountPath: '/' + mount,
                };
                opts.supportedIdentity.push(FabricSigningCredentialType.VaultX509);
            }
        }

        const caID = process.env.LEDGER_FABRIC_ORG_CA;
        Checks.nonBlankString(caID, `${fnTag} process.env.LEDGER_FABRIC_ORG_CA`);

        const orgMSP = process.env.LEDGER_FABRIC_ORG_MSP;
        Checks.nonBlankString(orgMSP, `${fnTag} process.env.LEDGER_FABRIC_ORG_MSP`);

        return {
            connector: new PluginLedgerConnectorFabric(opts),
            caID: caID,
            orgMSP: orgMSP,
        };
    }

    async ethConnector(): Promise<IEthConnector> {
        const fnTag = `${this.className}.ethConnector()`;
        const endpoint = process.env.LEDGER_ETH_JSON_RPC_URL;
        {
            Checks.nonBlankString(endpoint, `${fnTag} LEDGER_ETH_JSON_RPC_URL`);
        }
        const opts: IPluginLedgerConnectorXdaiOptions = {
            rpcApiHttpHost: endpoint,
            instanceId: uuid4(),
            pluginRegistry: this.pluginRegistry,
        };

        // store contract
        const network = process.env.LEDGER_ETH_NETWORK;
        const ccAddress = process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS;
        {
            Checks.nonBlankString(ccAddress, `${fnTag} LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS`);
        }
        const networks: { [key: number]: any } = {};
        networks[this.__getEthNetworkID(network)] = {
            address: ccAddress,
        };
        const json = {
            abi: abi,
            networks: networks,
        };
        const contractName = 'NetEmissionsTokenNetwork';
        await this.pluginRegistry
            .findOneByKeychainId(this.inMemoryKeychainID)
            .set(contractName, JSON.stringify(json));
        return {
            connector: new PluginLedgerConnectorXdai(opts),
            contractStoreKeychain: this.inMemoryKeychainID,
        };
    }
    private __getEthNetworkID(network: string): number {
        switch (network) {
            case 'hardhat':
                return 1337;
            case 'goerli':
                return 5;
            case 'ropsten':
                return 3;
            default:
                throw new Error(
                    'LEDGER_ETH_NETWORK : hardhat || goerli || ropsten ethereum network are supported',
                );
        }
    }
}
