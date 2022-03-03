import { UtilityEmissionsFactorInterface } from '../../../chaincode/emissionscontract/typescript/src/lib/utilityEmissionsFactor';
import { ActivityInterface, OrbitDBService } from './orbitDbService';

(async () => {
    // await OrbitDBService.init();
    const db = new OrbitDBService();
    const activity: ActivityInterface = {
        scope: 'scope 1',
        level_1: 'REFRIGERANT & OTHER',
        level_2: 'KYOTO PROTOCOL - STANDARD',
        level_3: 'PERFLUOROBUTANE (PFC-3-1-10)',
        activity_uom: 'kg',
        activity: 2,
    };
    const factor: UtilityEmissionsFactorInterface = {
        text: '',
        type: 'UTILITY_EMISSIONS_SCOPE_1',
        uuid: 'SCOPE_1 PERFLUOROBUTANE (PFC-3-1-10)',
        year: '2021',
        class: 'org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactoritem',
        scope: 'Scope 1',
        source: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021',
        level_1: 'REFRIGERANT & OTHER',
        level_2: 'KYOTO PROTOCOL - STANDARD',
        level_3: 'PERFLUOROBUTANE (PFC-3-1-10)',
        activity_uom: 'kg',
        co2_equivalent_emissions: '8860',
        co2_equivalent_emissions_uom: 'kg',
    };
    console.log(db.getCO2EmissionFactorByActivity(factor, activity));
})();
