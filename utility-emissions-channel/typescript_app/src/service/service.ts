import BCGatewayConfig from "../blockchain-gateway/config";
import FabricRegistryGateway from "../blockchain-gateway/fabricRegistry";
import Signer from "../blockchain-gateway/singer";
import FabricRegistryService from "./fabricRegistry";

export let fabricRegistryService: FabricRegistryService;

export async function setup(): Promise<void> {
  const bcConfig = new BCGatewayConfig();

  const signer = new Signer(
    process.env.LEDGER_FABRIC_TX_SIGNER_TYPE,
    bcConfig.certStoreID,
    "plain"
  );

  const orgFabric = bcConfig.fabricConnector();
  const ethConnector = await bcConfig.ethConnector();

  {
    const gateway = new FabricRegistryGateway({
      fabricConnector: orgFabric.connector,
      singer: signer,
      caId: orgFabric.caID,
      orgMSP: orgFabric.orgMSP,
    });

    fabricRegistryService = new FabricRegistryService(gateway);
  }
}
