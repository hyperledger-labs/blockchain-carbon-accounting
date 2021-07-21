// ledger-integration : setup cactus plugin registry and register routers to the express server
// reads ledger integration config from `../config/ledger-config.ts`

import {Express} from 'express';
import {CarbonAccountingRouter} from '../routers/carbonAccounting';
import {getLedgerConfigs,ILedgerIntegrationConfig} from '../config/ledger-config';
import {NetEmissionsTokenNetworkContract} from './netEmissionsTokenNetwork';
import { Logger, LoggerProvider } from '@hyperledger/cactus-common';
import {PluginKeychainMemory} from '@hyperledger/cactus-plugin-keychain-memory';
import {PluginKeychainVault} from '@hyperledger/cactus-plugin-keychain-vault';
import {PluginRegistry} from '@hyperledger/cactus-core';
import {v4 as uuid4} from 'uuid';
import { PluginLedgerConnectorXdai } from '@hyperledger/cactus-plugin-ledger-connector-xdai';
import {PluginLedgerConnectorFabric} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {FabricRegistryRouter} from '../routers/fabricRegistry';
import { FabricRegistry } from './fabricRegistry';
import { UtilityEmissionsChannel } from './utilityEmissionsChannel';
import {UtilityEmissionsChannelRouter} from '../routers/utilityEmissionsChannel';
import AWSS3 from './utils/aws';


export default class LedgerIntegration{
    private readonly carbonAccountingRouter:CarbonAccountingRouter;
    private readonly fabricRegistryRouter:FabricRegistryRouter;
    private readonly utilityEmissionsChannelRouter:UtilityEmissionsChannelRouter;

    private readonly ledgerConfig: ILedgerIntegrationConfig;
    private readonly log:Logger;
    private readonly keychainPlugin:PluginKeychainMemory;

    constructor(private readonly app:Express){
        const fntag = `LedgerIntegration#constructor`;

        this.ledgerConfig = getLedgerConfigs();
        this.log = LoggerProvider.getOrCreate({label: 'LedgerIntegration',level : this.ledgerConfig.logLevel});

        this.keychainPlugin = new PluginKeychainMemory({
            instanceId: uuid4(),
            keychainId: this.ledgerConfig.keychainID,
            logLevel: this.ledgerConfig.logLevel
        });

        // vault keychain for storing private key and certificates of fabric client
        const certKeychain = new PluginKeychainVault({
            keychainId : 'certKeychain',
            apiVersion: this.ledgerConfig.vaultKeychain.apiVersion,
            endpoint: this.ledgerConfig.vaultKeychain.endpoint,
            token: this.ledgerConfig.vaultKeychain.token,
            kvSecretsMountPath: `${this.ledgerConfig.vaultKeychain.kvMountPath}/data/`,
            instanceId: uuid4(),
            logLevel: this.ledgerConfig.logLevel
        });

        const pluginRegistry = new PluginRegistry({plugins : [this.keychainPlugin,certKeychain]});

        // TODO : support infura provider
        const ethClient = new PluginLedgerConnectorXdai({
            rpcApiHttpHost: this.ledgerConfig.ethNode.url,
            logLevel: this.ledgerConfig.logLevel,
            instanceId : uuid4(),
            pluginRegistry,
        });

        const fabricClient = new PluginLedgerConnectorFabric({
            pluginRegistry,
            connectionProfile: this.ledgerConfig.utilityEmissionsChaincode.network,
            cliContainerEnv: {},
            instanceId: uuid4(),
            peerBinary: 'anything',
            sshConfig: {},
            discoveryOptions: {
                enabled: true,
                asLocalhost: true
            }
        });

        // create ledger's contract classes
        const netEmissionTokenContract = new NetEmissionsTokenNetworkContract({
            logLevel: this.ledgerConfig.logLevel,
            ethClient,
            keychainId: this.keychainPlugin.getKeychainId(),
            contractName: this.ledgerConfig.netEmissionTokenContract.contractInfo.name,
            isDev: this.ledgerConfig.isDev,
            keys: {
                private: this.ledgerConfig.netEmissionTokenContract.Keys.private,
                public : this.ledgerConfig.netEmissionTokenContract.Keys.public,
            },
            contractAddress: this.ledgerConfig.netEmissionTokenContract.contractInfo.address
        });
        // configure and setup data storage
        const dataStorage = new AWSS3();
        // create Router class
        // utility emission channel : fabric network
        const utilityEmissionChannel = new UtilityEmissionsChannel({
            logLevel: this.ledgerConfig.logLevel,
            fabricClient,
            keychainId: certKeychain.getKeychainId(),
            dataStorage
        });
        this.carbonAccountingRouter = new CarbonAccountingRouter({
            logLevel: this.ledgerConfig.logLevel,
            netEmissionsTokenContract: netEmissionTokenContract,
            utilityEmissionChannel
        });

        this.utilityEmissionsChannelRouter =  new UtilityEmissionsChannelRouter({
            logLevel: this.ledgerConfig.logLevel,
            utilityEmissionsChannel: utilityEmissionChannel,
            dataStorage
        });

        // fabric registry
        const orgCAs:{[key:string]:{mspId:string,ca:string}} = {};
        const orgs = this.ledgerConfig.utilityEmissionsChaincode.network.organizations;
        for (const orgName of Object.keys(orgs)){
            orgCAs[orgName] = {
                ca :orgs[orgName]['certificateAuthorities'][0],
                mspId: orgs[orgName]['mspid']
            };
        }
        const fabricRegistry = new FabricRegistry({
            logLevel: this.ledgerConfig.logLevel,
            fabricClient,
            orgCAs,
            keychain: certKeychain,
            adminUsername: this.ledgerConfig.utilityEmissionsChaincode.adminUsername,
            adminPassword: this.ledgerConfig.utilityEmissionsChaincode.adminPassword
        });

        this.fabricRegistryRouter = new FabricRegistryRouter({
            logLevel : this.ledgerConfig.logLevel,
            fabricRegistry
        });
    }

    async build():Promise<void>{
        this.storeContracts();

        this.registerRouters();
    }

    private registerRouters(){
        // /api/v1/carbonAccounting : endpoints for interacting multiple ledgers
        // fabric for utilityEmissionChannel chaincode
        // ethereum for netEmissionsToken contract
        this.app.use('/api/v1/utilityemissionchannel/emissionscontract',this.carbonAccountingRouter.router);

        // /api/v1/fabricRegistry : endpoints for interacting fabric-ca
        this.app.use('/api/v1/utilityemissionchannel/registerEnroll',this.fabricRegistryRouter.router);

        // /api/v1/utilityemissionchannel : endpoints for interacting only utilityEmissionsChannel
        // chaincode installed on fabric network
        this.app.use('/api/v1/utilityemissionchannel/emissionscontract',this.utilityEmissionsChannelRouter.router);
    }

    private async storeContracts(){
        // net emission token contract
        {
            const contractName = this.ledgerConfig.netEmissionTokenContract.contractInfo.name;
            const networkId = this.ledgerConfig.ethNode.networkId;
            const networks:{[key:number]:any} = {};
            networks[networkId] = {
                address : this.ledgerConfig.netEmissionTokenContract.contractInfo.address
            };
            const json = {
                abi: this.ledgerConfig.netEmissionTokenContract.contractInfo.abi,
                networks
            };
            await this.keychainPlugin.set(contractName,json);
        }
    }
}