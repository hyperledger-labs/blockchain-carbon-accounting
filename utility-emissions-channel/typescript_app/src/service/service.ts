import BCGatewayConfig from '../blockchain-gateway/config';
import FabricRegistryGateway from '../blockchain-gateway/fabricRegistry';
import EthNetEmissionsTokenGateway from '../blockchain-gateway/netEmissionsTokenNetwork';
import Signer from '../blockchain-gateway/singer';
import FabricRegistryService from './fabricRegistry';
import UtilityEmissionsChannelServiceOptions from './utilityEmissionsChannel';
import UtilityemissionchannelGateway from '../blockchain-gateway/utilityEmissionsChannel';
import AWSS3 from '../datasource/awsS3';

export let fabricRegistryService: FabricRegistryService;
export let utilityEmissionsChannelService: UtilityEmissionsChannelServiceOptions;

export async function setup(): Promise<void> {
    const bcConfig = new BCGatewayConfig();

    const signer = new Signer(
        process.env.LEDGER_FABRIC_TX_SIGNER_TYPE,
        bcConfig.certStoreID,
        process.env.LEDGER_ETH_TX_SIGNER || 'plain',
        bcConfig.certStoreID,
    );

    const orgFabric = bcConfig.fabricConnector();
    const ethConnector = await bcConfig.ethConnector();

    const fabricRegistryGateway = new FabricRegistryGateway({
        fabricConnector: orgFabric.connector,
        singer: signer,
        caId: orgFabric.caID,
        orgMSP: orgFabric.orgMSP,
    });

    fabricRegistryService = new FabricRegistryService(fabricRegistryGateway);

    const netEmissionsContractGateway = new EthNetEmissionsTokenGateway({
        ethClient: ethConnector.connector,
        singer: signer,
        contractStoreKeychain: ethConnector.contractStoreKeychain,
    });

    const utilityEmissionsGateway = new UtilityemissionchannelGateway({
        fabricConnector: orgFabric.connector,
        signer: signer,
    });
    const s3 = new AWSS3();
    utilityEmissionsChannelService = new UtilityEmissionsChannelServiceOptions({
        utilityEmissionsGateway: utilityEmissionsGateway,
        netEmissionsContractGateway: netEmissionsContractGateway,
        ethContractAddress: process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS,
        s3: s3,
        orgName: process.env.LEDGER_FABRIC_ORG_MSP,
    });
}
