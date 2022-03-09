import yargs = require('yargs')
import { hideBin } from 'yargs/helpers'
import { UtilityEmissionsFactorInterface } from '../../utility-emissions-channel/chaincode/emissionscontract/typescript/src/lib/utilityEmissionsFactor'
import { addCommonYargsOptions } from './config'
import { ActivityInterface, OrbitDBService } from './orbitDbService'

let db: OrbitDBService;

(async () => {
  const init = async (argv) => {
    await OrbitDBService.init(argv)
    db = new OrbitDBService()
  }
  const argv = addCommonYargsOptions(yargs(hideBin(process.argv)))
    .showHelpOnFail(true).argv
  await init(argv)

  const activity: ActivityInterface = {
    scope: 'scope 1',
    level_1: 'REFRIGERANT & OTHER',
    level_2: 'KYOTO PROTOCOL - STANDARD',
    level_3: 'PERFLUOROBUTANE (PFC-3-1-10)',
    activity_uom: 'kg',
    activity: 2,
  }
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
  }
  console.log('Test getCO2EmissionFactorByActivity: ', db.getCO2EmissionFactorByActivity(factor, activity))

  const allLookup = db.getAllFactors()
  console.log('Test getAllFactors got count : ', allLookup ? allLookup.length : null)
  if (allLookup && allLookup.length) {
    console.log('Sample first factor ...')
    console.log(allLookup[0])
  }
  process.exit(0)
})();
