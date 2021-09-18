import { Checks } from "@hyperledger/cactus-common";
import { PluginRegistry } from "@hyperledger/cactus-core";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import {
  PluginLedgerConnectorFabric,
  IPluginLedgerConnectorFabricOptions,
  FabricSigningCredentialType,
} from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import { v4 as uuid4 } from "uuid";
import { readFileSync } from "fs";

interface IFabricOrgConnector {
  orgMSP: string;
  caID: string;
  connector: PluginLedgerConnectorFabric;
}

export default class BCGatewayConfig {
  private readonly className = "BCGatewayConfig";
  readonly pluginRegistry: PluginRegistry = new PluginRegistry({ plugins: [] });
  constructor() {
    this.pluginRegistry.add(
      new PluginKeychainMemory({
        keychainId: "inMemoryKeychain",
        instanceId: uuid4(),
      })
    );
  }
  fabricConnector(): IFabricOrgConnector {
    const fnTag = `${this.className}.fabricConnector()`;
    const opts: IPluginLedgerConnectorFabricOptions = {
      connectionProfile: undefined,
      pluginRegistry: this.pluginRegistry,
      cliContainerEnv: {},
      instanceId: uuid4(),
      peerBinary: "not-required",
      sshConfig: {},
      discoveryOptions: {
        enabled: true,
        asLocalhost: process.env.LEDGER_FABRIC_AS_LOCALHOST === "true",
      },
    };

    {
      // read ccp config
      const ccpPath = process.env.LEDGER_FABRIC_CCP;
      Checks.nonBlankString(ccpPath, `${fnTag} LEDGER_FABRIC_CCP`);
      opts.connectionProfile = JSON.parse(
        readFileSync(ccpPath).toString("utf-8")
      );
    }

    const signingType = process.env.LEDGER_FABRIC_TX_SIGNER_TYPE || "vault";
    {
      if (signingType === "vault") {
        // configure vault signing
        const endpoint = process.env.VAULT_ENDPOINT;
        Checks.nonBlankString(endpoint, `${fnTag} VAULT_ENDPOINT`);
        // configure vault signing
        const mount = process.env.LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT;
        Checks.nonBlankString(
          mount,
          `${fnTag} LEDGER_FABRIC_TX_SIGNER_VAULT_MOUNT`
        );
        opts.vaultConfig = {
          endpoint: endpoint,
          transitEngineMountPath: "/" + mount,
        };
        opts.supportedIdentity = [FabricSigningCredentialType.VaultX509];
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
}
