export const EMISSIONS_FACTOR_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem';

export interface EmissionsFactorInterface {
    class: string;
    key?: string;
    uuid: string;
    type: string;
    scope?: string;
    level_1: string;
    level_2: string;
    level_3: string;
    level_4?: string;
    text?: string;
    year?: string;
    from_year?: string;
    thru_year?: string;
    country?: string;
    division_type?: string;
    division_id?: string;
    division_name?: string;
    activity_uom?: string;
    net_generation?: string;
    net_generation_uom?: string;
    co2_equivalent_emissions?: string;
    co2_equivalent_emissions_uom?: string;
    source?: string;
    non_renewables?: string;
    renewables?: string;
    percent_of_renewables?: string;
}
