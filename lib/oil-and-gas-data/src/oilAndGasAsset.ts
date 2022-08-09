export const OIL_AND_GAS_ASSET_CLASS_IDENTIFER =
    'org.hyperledger.blockchain-carbon-accounting.oil-and-gas-asset';

export interface OilAndGasAssetInterface {
    uuid: string;
    class: string;
    type: string;
    country: string;
    latitude: string;
    longitude: string;
    name?: string;
    operator?: string;
    division_type?: string;
    division_name?: string;
    sub_division_type?: string;
    sub_division_name?: string;
    status?: string;
    api?: string;
    description?: string;
    source?: string;
    source_date?: Date;
    validation_method?: string;
    validation_date?: Date;
    product?: string;
    field?: string;
    depth?: string;
}