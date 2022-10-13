export const UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist';

export interface DivisionsInterface {
    division_type: string;
    division_id: string;
}
export interface UtilityLookupItemInterface {
    class: string;
    key?: string;
    uuid: string;
    year?: string;
    utility_number?: string;
    utility_name?: string;
    country?: string;
    state_province?: string;
    divisions?: DivisionsInterface;
    division_type?: string;
    division_id?: string;
}
