import type { EmissionsFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor"
import type { UtilityLookupItemInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/utilityLookupItem"

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

