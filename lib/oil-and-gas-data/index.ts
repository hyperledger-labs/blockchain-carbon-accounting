export type { 
    OilAndGasAssetInterface, 
    OIL_AND_GAS_ASSET_CLASS_IDENTIFIER
} from "./src/oilAndGasAsset"
export type { 
    OperatorInterface, 
    OperatorDetails, 
    OPERATOR_CLASS_IDENTIFIER
} from "./src/operator"
export type { 
    AssetOperatorInterface, 
    AssetOwnerDetails, 
    ASSET_OPERATOR_CLASS_IDENTIFIER
} from "./src/assetOperator"
export { 
    ProductInterface,
    productTypes,
    ProductType,
    PRODUCT_CLASS_IDENTIFIER
} from './src/product'
export { 
    importOilAndGasAssets, 
    importProductData,
    updateProductDates,
} from "./src/import"
export {
    matchAssets
} from "./src/matchAssets"