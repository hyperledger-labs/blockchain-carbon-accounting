export const PRODUCT_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.oil-and-gas-product';

export interface ProductInterface {
    uuid: string;
    class: string;
    type: string;
    name: string;
    amount: string;
    unit: string;
    asset_uuid?: string;
    country?: string;
    division_type?: string;
    division_name?: string;
    year?: string;
    month?: string;
    from_date?: number;
    thru_date?: number;
    description?: string;
    source?: string;
    source_date?: string;
}