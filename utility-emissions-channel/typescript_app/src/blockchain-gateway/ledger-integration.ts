// ledger-integration : setup cactus plugin registry and register routers to the express server
// reads ledger integration config from `../config/ledger-config.ts`

import {Express} from 'express'
import {CarbonAccountingRouter} from '../routers/carbonAccounting'
import {getLedgerConfigs,ILedgerIntegrationConfig} from '../config/ledger-config'
import {NetEmissionsTokenNetworkContract} from './netEmissionsTokenNetwork'
import { Logger, LoggerProvider } from '@hyperledger/cactus-common'
import {PluginKeychainMemory} from '@hyperledger/cactus-plugin-keychain-memory'
import {PluginRegistry} from '@hyperledger/cactus-core'
import {v4 as uuid4} from 'uuid'
import { PluginLedgerConnectorXdai } from '@hyperledger/cactus-plugin-ledger-connector-xdai'
import {PluginLedgerConnectorFabric} from '@hyperledger/cactus-plugin-ledger-connector-fabric'
import {FabricRegistryRouter} from '../routers/fabricRegistry'
import { FabricRegistry } from './fabricRegistry'
interface IContractJSON{
    abi : Array<any>
    networks:Map<number,{address:string}>
}

export default class LedgerIntegration{
    private readonly carbonAccountingRouter:CarbonAccountingRouter
    private readonly fabricRegistryRouter:FabricRegistryRouter

    private readonly ledgerConfig: ILedgerIntegrationConfig
    private readonly log:Logger
    private readonly keychainPlugin:PluginKeychainMemory

    constructor(private readonly app:Express){
        const fntag = `LedgerIntegration#constructor`

        this.ledgerConfig = getLedgerConfigs()
        this.log = LoggerProvider.getOrCreate({label: "LedgerIntegration",level : this.ledgerConfig.logLevel})

        this.keychainPlugin = new PluginKeychainMemory({
            instanceId: uuid4(),
            keychainId: this.ledgerConfig.keychainID,
            logLevel: this.ledgerConfig.logLevel
        })

        const pluginRegistry = new PluginRegistry({plugins : [this.keychainPlugin]})

        // TODO : support infura provider
        const ethClient = new PluginLedgerConnectorXdai({
            rpcApiHttpHost: this.ledgerConfig.ethNode.url,
            logLevel: this.ledgerConfig.logLevel,
            instanceId : uuid4(),
            pluginRegistry: pluginRegistry
        })

        const fabricClient = new PluginLedgerConnectorFabric({
            pluginRegistry: pluginRegistry,
            connectionProfile: this.ledgerConfig.utilityEmissionsChaincode.network,
            cliContainerEnv: {},
            instanceId: uuid4(),
            peerBinary: "anything",
            sshConfig: {},
            discoveryOptions: {
                enabled: true,
                asLocalhost: true
            }
        })
        
        // create ledger's contract classes
        const netEmissionTokenContract = new NetEmissionsTokenNetworkContract({
            logLevel: this.ledgerConfig.logLevel,
            ethClient: ethClient,
            keychainId: this.keychainPlugin.getKeychainId(),
            contractName: this.ledgerConfig.netEmissionTokenContract.contractInfo.name,
            isDev: this.ledgerConfig.isDev,
            keys: {
                private: this.ledgerConfig.netEmissionTokenContract.Keys.private,
                public : this.ledgerConfig.netEmissionTokenContract.Keys.public,
            },
            contractAddress: this.ledgerConfig.netEmissionTokenContract.contractInfo.address
        })
        // create Router class
        this.carbonAccountingRouter = new CarbonAccountingRouter({
            logLevel: this.ledgerConfig.logLevel,
            netEmissionsTokenContract: netEmissionTokenContract
        })

        const orgCAs:{[key:string]:{mspId:string,ca:string}} = {}
        const orgs = this.ledgerConfig.utilityEmissionsChaincode.network.organizations
        for (const orgName of Object.keys(orgs)){
            orgCAs[orgName] = {
                ca :orgs[orgName]["certificateAuthorities"][0],
                mspId: orgs[orgName]["mspid"]
            }
        }
        const fabricRegistry = new FabricRegistry({
            logLevel: this.ledgerConfig.logLevel,
            fabricClient: fabricClient,
            orgCAs: orgCAs,
            keychain: this.keychainPlugin
        })

        this.fabricRegistryRouter = new FabricRegistryRouter({
            logLevel : this.ledgerConfig.logLevel,
            fabricRegistry: fabricRegistry
        })
    }

    async build():Promise<void>{
        this.storeContracts()

        this.registerRouters()
    }

    private registerRouters(){
        this.app.use('/api/v1',this.carbonAccountingRouter.router)
        this.app.use('/api/v1/fabricRegistry',this.fabricRegistryRouter.router)
    }

    private async storeContracts(){
        // net emission token contract
        {
            const contractName = this.ledgerConfig.netEmissionTokenContract.contractInfo.name
            const networkId = this.ledgerConfig.ethNode.networkId
            const networks:{[key:number]:any} = {}
            networks[networkId] = {
                address : this.ledgerConfig.netEmissionTokenContract.contractInfo.address
            }
            const json = {
                abi: this.ledgerConfig.netEmissionTokenContract.contractInfo.abi,
                networks: networks
            }
            await this.keychainPlugin.set(contractName,json)
        }
    }
}