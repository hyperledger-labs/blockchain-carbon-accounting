import { PluginLedgerConnectorFabric } from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import {
  IFabricRegistryGateway,
  IFabricTxCaller,
  IFabricRegisterInput,
  IFabricRegisterOutput,
} from "./gateway";
import Singer from "./singer";
import { ledgerLogger } from "../utils/logger";

interface IFabricRegistryGatewayOptions {
  fabricConnector: PluginLedgerConnectorFabric;
  singer: Singer;
  caId: string;
  orgMSP: string;
}

export default class FabricRegistryGateway implements IFabricRegistryGateway {
  private readonly className = "FabricRegistryGateway";
  constructor(private readonly opts: IFabricRegistryGatewayOptions) {}

  async enroll(caller: IFabricTxCaller, secret: string): Promise<void> {
    const fnTag = `${this.className}.enroll()`;
    ledgerLogger.debug(`${fnTag} getting singer for the caller`);
    const singer = this.opts.singer.fabric(caller);
    ledgerLogger.debug(`${fnTag} enroll with fabric ca`);
    await this.opts.fabricConnector.enroll(singer, {
      enrollmentID: caller.userId,
      enrollmentSecret: secret,
      mspId: this.opts.orgMSP,
      caId: this.opts.caId,
    });
  }
  async register(
    caller: IFabricTxCaller,
    input: IFabricRegisterInput
  ): Promise<IFabricRegisterOutput> {
    const fnTag = `${this.className}.register()`;
    ledgerLogger.debug(`${fnTag} getting singer for the client`);
    const singer = this.opts.singer.fabric(caller);
    ledgerLogger.debug(`${fnTag} register with fabric ca`);
    const secret = await this.opts.fabricConnector.register(
      singer,
      {
        enrollmentID: input.enrollmentID,
        affiliation: input.affiliation,
        role: "client",
      },
      this.opts.caId
    );
    return {
      enrollmentID: input.enrollmentID,
      enrollmentSecret: secret,
    };
  }
}
