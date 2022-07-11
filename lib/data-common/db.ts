import type { EmissionsFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor"
import type { UtilityLookupItemInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/utilityLookupItem"
import type { OilAndGasAssetInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset"

export interface EmissionFactorDbInterface {
  putEmissionFactor: (doc: EmissionsFactorInterface) => Promise<void>
  getEmissionFactor: (uuid: string) => Promise<EmissionsFactorInterface | null>
  getEmissionsFactorsByDivision: (divisionID: string, divisionType: string, year?: number) => Promise<EmissionsFactorInterface[]>
  getEmissionsFactors: (query: Partial<EmissionsFactorInterface>) => Promise<EmissionsFactorInterface[]>
  getEmissionsFactorsSimple: (query: Partial<EmissionsFactorInterface>) => Promise<EmissionsFactorInterface[]>
}

export interface UtilityLookupItemDbInterface {
  putUtilityLookupItem: (doc: UtilityLookupItemInterface) => Promise<void>
}

export interface OilAndGasAssetDbInterface {
  putAsset: (doc: OilAndGasAssetInterface) => Promise<void>
  //getAsset: (uuid: string) => Promise<OilAndGasAssetInterface | null>
  getAllAssets: (query: Partial<OilAndGasAssetInterface>) => Promise<OilAndGasAssetInterface[]>
}

