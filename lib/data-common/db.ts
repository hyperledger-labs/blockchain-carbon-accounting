import type { 
  EmissionsFactorInterface,
  UtilityLookupItemInterface 
} from "@blockchain-carbon-accounting/emissions_data_lib"
import type { 
  AssetOperatorInterface,
  OilAndGasAssetInterface,
  ProductInterface,
  OperatorInterface
} from "@blockchain-carbon-accounting/oil-and-gas-data-lib"

export type QueryBundle = {
  field: string,
  fieldType: string,
  value: number | string,
  op: string,
  fieldSuffix?: string, // use this if conditioning the same field more than once
  conjunction?:boolean, // use this for AND querries. 
  // does not support combination of conjuction and disjunction
}


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
  getAsset: (uuid: string) => Promise<OilAndGasAssetInterface | null>
  select: (bundles: Array<QueryBundle>) => Promise<Array<OilAndGasAssetInterface>>
}

export interface ProductDbInterface {
  putProduct: (doc: ProductInterface) => Promise<void>
  getProduct: (uuid: string) => Promise<ProductInterface | null>
  getAllProducts: () => Promise<ProductInterface[]>
  count: (bundles: Array<QueryBundle>) => Promise<number>
}

export interface OperatorDbInterface {
  putOperator: (doc: OperatorInterface) => Promise<void>
  getOperator: (uuid: string) => Promise<OperatorInterface | null>
  getOperators: (query: Partial<OperatorInterface>) => Promise<OperatorInterface[]>
  selectPaginated: (offset: number, imit: number, 
    bundles: Array<QueryBundle>) => Promise<Array<OperatorInterface>>
  selectOne: (bundles: Array<QueryBundle>) => Promise<OperatorInterface | null>
  findByName: (name: string) => Promise<OperatorInterface | null>
}


export interface AssetOperatorDbInterface {
  putAssetOperator: (doc: AssetOperatorInterface) => Promise<void>
  select: (bundles: Array<QueryBundle>) => Promise<Array<AssetOperatorInterface>>

}

