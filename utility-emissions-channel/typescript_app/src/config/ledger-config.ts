// ledger-config.ts : defines and read configuration for ledger integration
import {LogLevelDesc,Checks} from '@hyperledger/cactus-common'
import netEmissionTokenContractJSON from '../contracts/NetEmissionsTokenNetwork.json'

interface IEthNode{
    url:string
    networkId:number
}

interface IEthContract{
    name:string
    address:string
    abi:Array<any>
}


interface INetEmissionTokenContractConfigs{
    contractInfo:IEthContract
    Keys:{
        public:string,
        private:string,
    }
}

interface ILedgerIntegrationConfig{
    logLevel?:LogLevelDesc,
    keychainID?:string
    ethNode?:IEthNode
    netEmissionTokenContract?:INetEmissionTokenContractConfigs
}

export function getLedgerConfigs():ILedgerIntegrationConfig{
    const config:ILedgerIntegrationConfig = {}
    const env = process.env.LEDGER_ENV || "prod"
    config.logLevel = "DEBUG"
    if (env == "prod"){
        config.logLevel = "INFO"
    }

    const ethNodeURL = process.env.LEDGER_ETH_JSON_RPC_URL
    const ethNetwork = process.env.LEDGER_ETH_NETWORK
    Checks.nonBlankString(ethNodeURL,'LEDGER_ETH_JSON_RPC_URL')
    Checks.nonBlankString(ethNetwork,'LEDGER_ETH_NETWORK')
    let ethNetworkID:number
    if (ethNetwork == "xdai"){
        ethNetworkID = 1337
    }else if (ethNetwork == "goerli"){
        ethNetworkID = 5
    }else{
        throw new Error("LEDGER_ETH_NETWORK : xdai || goerli ethereum network are supported")
    }

    config.ethNode = {
        url: ethNodeURL,
        networkId: ethNetworkID,
    }

    config.keychainID = process.env.LEDGER_KEYCHAINID
    Checks.nonBlankString(config.keychainID,'LEDGER_KEYCHAINID')
    // net emission token contract details
    {
        const address = process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS
        Checks.nonBlankString(address,'LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS')
        const abi = netEmissionTokenContractJSON.abi
        const name = netEmissionTokenContractJSON.contractName

        const publicKey = process.env.LEDGER_EMISSION_TOKEN_PUBLIC_KEY
        const privateKey = process.env.LEDGER_EMISSION_TOKEN_PRIVATE_KEY

        Checks.nonBlankString(publicKey,'LEDGER_EMISSION_TOKEN_PUBLIC_KEY')
        Checks.nonBlankString(privateKey,'LEDGER_EMISSION_TOKEN_PRIVATE_KEY')

        config.netEmissionTokenContract = {
            Keys: {
                private: privateKey,
                public: publicKey,
            },
            contractInfo: {
                abi: abi,
                name: name,
                address: address
            }
        }
    }

    return config
}