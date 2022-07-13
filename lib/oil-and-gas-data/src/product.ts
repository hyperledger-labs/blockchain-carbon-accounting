export const PRODUCT_CLASS_IDENTIFER =
    'org.hyperledger.blockchain-carbon-accounting.product';

export interface ProductInterface {
    class: string;
    asset_uuid: string;
    type: string;
    name: string;
    amount: string;
    unit: string;
    country?: string;
    division_type?: string;
    division_name?: string;
    sub_division_type?: string;
    sub_division_name?: string;
    description?: string;
    source?: string;
    source_date?: string;
    from_date!: number;
    thru_date!: number;
    validation_method?: string;
    validation_date?: string;
    year?: string;
}