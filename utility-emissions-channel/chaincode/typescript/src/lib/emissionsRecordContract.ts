import { ChaincodeStub } from 'fabric-shim';
import { REGIONS } from '../util/const';
import { EmissionRecordState } from './emissions';
import { UtilityEmissionsFactorState } from './utilityEmissionsFactor';
import {
  UtilityLookupItemInterface,
  UtilityLookupItemState,
  UtilityLookupItem,
} from './utilityLookupItem';

// EmissionsRecordContract : core bushiness logic of emissions record chaincode
export class EmissionsRecordContract {
  protected emissionsState: EmissionRecordState;
  protected utilityEmissionsFactorState: UtilityEmissionsFactorState;
  protected utilityLookupState: UtilityLookupItemState;
  constructor(stub: ChaincodeStub) {
    this.emissionsState = new EmissionRecordState(stub);
    this.utilityEmissionsFactorState = new UtilityEmissionsFactorState(stub);
    this.utilityLookupState = new UtilityLookupItemState(stub);
  }
  async importUtilityIdentifier(
    lookupInterface: UtilityLookupItemInterface
  ): Promise<Uint8Array> {
    const lookup = new UtilityLookupItem(lookupInterface);
    await this.utilityLookupState.addUtilityLookupItem(
      lookup,
      lookupInterface.uuid
    );
    return lookup.toBuffer();
  }
  async updateUtilityIdentifier(
    lookupInterface: UtilityLookupItemInterface
  ): Promise<Uint8Array> {
    const lookup = new UtilityLookupItem(lookupInterface);
    await this.utilityLookupState.updateUtilityLookupItem(
      lookup,
      lookupInterface.uuid
    );
    return lookup.toBuffer();
  }
  async getUtilityIdentifier(uuid: string): Promise<Uint8Array> {
    return (
      await this.utilityLookupState.getUtilityLookupItem(uuid)
    ).toBuffer();
  }
  async getAllUtilityIdentifiers(): Promise<Uint8Array> {
    const result = await this.utilityLookupState.getAllUtilityLookupItems();
    return Buffer.from(JSON.stringify(result));
  }
}
