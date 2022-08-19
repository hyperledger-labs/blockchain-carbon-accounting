export const PRODUCT_CLASS_IDENTIFER =
    'org.hyperledger.blockchain-carbon-accounting.oil-and-gas-product';

export interface ProductInterface {
    uuid: string;
    class: string;
    name: string;
    type: string;
    amount: string;
    unit: string;
    asset_uuid?: string;
    country?: string;
    division_type?: string;
    division_name?: string;
    sub_division_type?: string;
    sub_division_name?: string;
    latitude?: string;
    longitude?: string;
    year?: string;
    month?: string;
    from_date?: Date;
    thru_date?: Date;
    description?: string;
    metadata?: string;
    source?: string;
    source_date?: string;
}