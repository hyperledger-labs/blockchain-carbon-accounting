import { PluginLedgerConnectorFabric } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import BCGatewayConfig from '../blockchain-gateway-lib/config';
import { DataLockGateway } from '../blockchain-gateway/datalock';
import EmissionsDataGateway from '../blockchain-gateway/emissionsChannel';
import FabricRegistryGateway from '../blockchain-gateway/fabricRegistry';
import EthNetEmissionsTokenGateway from '../blockchain-gateway-lib/netEmissionsTokenNetwork';
import Signer from '../blockchain-gateway-lib/signer';
import AWSS3 from '../datasource/awsS3';
import EmissionsChannelServiceOptions from './emissionsChannel';
import FabricRegistryService from './fabricRegistry';
export let fabricRegistryService: FabricRegistryService;
export let EmissionsChannelService: EmissionsChannelServiceOptions;
export let fabricConnector: PluginLedgerConnectorFabric;
export async function setup(): Promise<void> {
    const bcConfig = new BCGatewayConfig();

    const signer = new Signer(
        process.env.LEDGER_FABRIC_TX_SIGNER_TYPES || '',
        bcConfig.certStoreID,
        process.env.LEDGER_ETH_TX_SIGNER || 'plain',
        bcConfig.pluginRegistry.findOneByKeychainId(bcConfig.certStoreID),
    );

    const orgFabric = bcConfig.fabricConnector();
    fabricConnector = orgFabric.connector;
    const ethConnector = await bcConfig.ethConnector();

    const fabricRegistryGateway = new FabricRegistryGateway({
        fabricConnector: orgFabric.connector,
        signer: signer,
        caId: orgFabric.caID,
        orgMSP: orgFabric.orgMSP,
    });

    fabricRegistryService = new FabricRegistryService(fabricRegistryGateway);

    const netEmissionsContractGateway = new EthNetEmissionsTokenGateway({
        ethClient: ethConnector.connector,
        signer: signer,
        contractStoreKeychain: ethConnector.contractStoreKeychain,
    });

    const EmissionsGateway = new EmissionsDataGateway({
        fabricConnector: orgFabric.connector,
        signer: signer,
    });
    const s3 = new AWSS3();
    const datalockGateway = new DataLockGateway({
        fabricConnector: orgFabric.connector,
        signer: signer,
    });
    EmissionsChannelService = new EmissionsChannelServiceOptions({
        EmissionsGateway: EmissionsGateway,
        netEmissionsContractGateway: netEmissionsContractGateway,
        datalockGateway: datalockGateway,
        ethContractAddress: process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS || '',
        s3: s3,
        orgName: process.env.LEDGER_FABRIC_ORG_MSP || '',
    });
}
