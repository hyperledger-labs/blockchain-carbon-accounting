import { EmissionsFactorInterface } from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissionsFactor";
import { UtilityLookupItemInterface } from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/utilityLookupItem";

export interface DbInterface {
  putEmissionFactor: (doc: EmissionsFactorInterface) => Promise<void>;
  getEmissionFactor: (uuid: string) => Promise<EmissionsFactorInterface>;
  putUtilityLookupItem: (doc: UtilityLookupItemInterface) => Promise<void>;
}

