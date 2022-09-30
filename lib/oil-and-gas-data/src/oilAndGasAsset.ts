export const OIL_AND_GAS_ASSET_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.oil-and-gas-asset';
import { AssetOwner, Product } from '@blockchain-carbon-accounting/data-postgres';
//import { Point } from 'geojson';


export interface OilAndGasAssetInterface {
    uuid: string;
    class: string;
    owners?: AssetOwner[];
    products?: Product[]
    type: string;
    country: string;
    latitude: number;
    longitude: number;
    //location: Point;
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
    metadata?: string; //TO-DO store product, field depth as metadata attributes of the asset
    product?: string;
    field?: string;
    depth?: string;
}