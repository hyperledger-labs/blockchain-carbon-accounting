import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres/src/postgresDbService';
import type { EmissionsFactorInterface } from '@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor';
import type { UtilityLookupItemInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/utilityLookupItem";
import { Activity } from '@blockchain-carbon-accounting/supply-chain-lib/src/common-types';
import { process_activity } from '@blockchain-carbon-accounting/supply-chain-lib/src/emissions-utils';
import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';

async function addTestEmissionsFactor(efl: EmissionsFactorInterface) {
  const db = await PostgresDBService.getInstance();
  await db.getEmissionsFactorRepo().putEmissionFactor({...efl});
}

async function addUtilityLookupItem(uli: UtilityLookupItemInterface) {
  const db = await PostgresDBService.getInstance();
  await db.getUtilityLookupItemRepo().putUtilityLookupItem(uli);
}

async function setupDBSeed() {
  await addTestEmissionsFactor({
    uuid: uuidv4(),
    class:'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
    type: 'EMISSIONS_ELECTRICITY',
    scope: 'SCOPE 2',
    level_1: 'eGRID EMISSIONS FACTORS',
    level_2: 'USA',
    level_3: 'STATE: CA',
    year: '2019',
    country: 'USA',
    division_type: 'STATE',
    division_id: 'CA',
    division_name: 'California',
    activity_uom: 'MWH',
    net_generation: '201747828.474',
    net_generation_uom: 'MWH',
    co2_equivalent_emissions: '0.19359146878269065',
    co2_equivalent_emissions_uom: 'tons'
  });
  await addTestEmissionsFactor({
    uuid: uuidv4(),
    class:'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
    type: 'EMISSIONS_ELECTRICITY',
    scope: 'SCOPE 2',
    level_1: 'eGRID EMISSIONS FACTORS',
    level_2: 'USA',
    level_3: 'STATE: CA',
    year: '2018',
    country: 'USA',
    division_type: 'STATE',
    division_id: 'CA',
    division_name: 'California',
    activity_uom: 'MWH',
    net_generation: '195212859.582',
    net_generation_uom: 'MWH',
    co2_equivalent_emissions: '0.21101443649872265',
    co2_equivalent_emissions_uom: 'tons'
  });
  await addTestEmissionsFactor({
    uuid: uuidv4(),
    class:'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
    type: 'EMISSIONS_ELECTRICITY',
    scope: 'SCOPE 2',
    level_1: 'eGRID EMISSIONS FACTORS',
    level_2: 'USA',
    level_3: 'STATE: CA',
    year: '2020',
    country: 'USA',
    division_type: 'STATE',
    division_id: 'CA',
    division_name: 'California',
    activity_uom: 'MWH',
    net_generation: '192954153.405',
    net_generation_uom: 'MWH',
    co2_equivalent_emissions: '0.2265591892870195',
    co2_equivalent_emissions_uom: 'tons'
  });

  await addTestEmissionsFactor({
    uuid: uuidv4(),
    class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
    type: 'SCOPE_1_EMISSIONS',
    scope: 'Scope 1',
    level_1: 'FUELS',
    level_2: 'GASEOUS FUELS',
    level_3: 'NATURAL GAS',
    level_4: '',
    text: 'Volume',
    year: '2019',
    activity_uom: 'cubic metres',
    co2_equivalent_emissions: '2.03053',
    co2_equivalent_emissions_uom: 'kg'
  });
  await addTestEmissionsFactor({
    uuid: uuidv4(),
    class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
    type: 'SCOPE_1_EMISSIONS',
    scope: 'Scope 1',
    level_1: 'FUELS',
    level_2: 'GASEOUS FUELS',
    level_3: 'NATURAL GAS',
    level_4: '',
    text: 'Volume',
    year: '2021',
    activity_uom: 'cubic metres',
    co2_equivalent_emissions: '2.02135',
    co2_equivalent_emissions_uom: 'kg'
  });
  await addTestEmissionsFactor({
    uuid: uuidv4(),
    class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
    type: 'SCOPE_1_EMISSIONS',
    scope: 'Scope 1',
    level_1: 'FUELS',
    level_2: 'GASEOUS FUELS',
    level_3: 'NATURAL GAS',
    level_4: '',
    text: 'Volume',
    year: '2020',
    activity_uom: 'cubic metres',
    co2_equivalent_emissions: '2.02266',
    co2_equivalent_emissions_uom: 'kg'
  });

  await addUtilityLookupItem({
    uuid: uuidv4(),
    class:'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist',
    year: '2019',
    utility_number: '14328',
    utility_name: 'Pacific_Gas_&_Electric_Co.',
    country: 'USA',
    state_province: 'CA',
    divisions: { division_type: 'NERC_REGION', division_id: 'WECC' }
  });
}


describe("Emissions Factors tests", function() {
  before(async function() {
    // create a test connection instance
    const db = await PostgresDBService.getInstance({
      dbName: 'blockchain-carbon-accounting-test',
      dbUser: process.env.POSTGRES_USER || '',
      dbPassword: process.env.POSTGRES_PASSWORD || '',
      dbHost: process.env.POSTGRES_HOST || 'localhost',
      dbPort: 5432,
      dbVerbose: false,
    });
    // clean DB state
    await db.getConnection().synchronize(true);
    // add some factors needed for the test
    await setupDBSeed();
  });

  after(async function () {
    // close DB connection instance
    const db = await PostgresDBService.getInstance();
    await db.close();
  });

  it("should get last emissions factor if factors are not found for given date range", async function() {
    const db = await PostgresDBService.getInstance();
    const condition = {
      level_1: 'eGRID EMISSIONS FACTORS',
      level_2: 'USA',
      level_3: 'STATE: CA',
      level_4: '',
      from_year: '2021',
      thru_year: '2022'
    }

    const emissionsFactors = await db.getEmissionsFactorRepo().getEmissionsFactors(condition);
    expect(emissionsFactors).to.have.lengthOf(1);
    expect(emissionsFactors[0]).to.have.property('year').equal('2020');
  });

  it("should get last emissions factor if factors are not found for given year", async function() {
    const db = await PostgresDBService.getInstance();
    const condition = {
      level_1: 'eGRID EMISSIONS FACTORS',
      level_2: 'USA',
      level_3: 'STATE: CA',
      level_4: '',
      year: '2010'
    }

    const emissionsFactors = await db.getEmissionsFactorRepo().getEmissionsFactors(condition);
    expect(emissionsFactors).to.have.lengthOf(1);
    expect(emissionsFactors[0]).to.have.property('year').equal('2020');
  });

  it("should get emissions factors list for given date range", async function() {
    const db = await PostgresDBService.getInstance();
    const condition = {
      level_1: 'eGRID EMISSIONS FACTORS',
      level_2: 'USA',
      level_3: 'STATE: CA',
      level_4: '',
      from_year: '2018',
      thru_year: '2019'
    }

    const emissionsFactors = await db.getEmissionsFactorRepo().getEmissionsFactors(condition);
    expect(emissionsFactors).to.have.lengthOf(2);
    expect(emissionsFactors[0]).to.have.property('year').equal('2019');
    expect(emissionsFactors[1]).to.have.property('year').equal('2018');
  });

  it("should get emissions factor for given year", async function() {
    const db = await PostgresDBService.getInstance();
    const condition = {
      level_1: 'eGRID EMISSIONS FACTORS',
      level_2: 'USA',
      level_3: 'STATE: CA',
      level_4: '',
      year: '2019'
    }

    const emissionsFactors = await db.getEmissionsFactorRepo().getEmissionsFactors(condition);
    expect(emissionsFactors).to.have.lengthOf(1);
    expect(emissionsFactors[0]).to.have.property('year').equal('2019');

    const condition2 = {
      level_1: 'eGRID EMISSIONS FACTORS',
      level_2: 'USA',
      level_3: 'STATE: CA',
      level_4: '',
      year: '2020'
    }

    const emissionsFactors2 = await db.getEmissionsFactorRepo().getEmissionsFactors(condition2);
    expect(emissionsFactors2).to.have.lengthOf(1);
    expect(emissionsFactors2[0]).to.have.property('year').equal('2020');
  });

  it("should be correct calculation of US electricity based on state", async function() {
    const db = await PostgresDBService.getInstance();
    const utilityLookupItems = await db.getUtilityLookupItemRepo().getAllUtilityLookupItems();
    expect(utilityLookupItems).to.have.lengthOf.at.least(1);
    const activity: Activity = {
      id: '1',
      type: 'electricity',
      activity_amount: 128,
      activity_uom: 'kwh',
      country: 'UNITED STATES',
      state: 'CA',
      utility: utilityLookupItems[0].uuid,
      from_date: new Date('2019-01-31T22:00:00.000Z'),
      thru_date: new Date('2019-03-01T21:59:59.999Z'),
      from: '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199',
      to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    }
    const result = await process_activity(activity);
    expect(result).to.have.property('emissions');
    expect(result).to.have.property('emissions').to.have.property('amount');
    expect(result).to.have.property('emissions').to.have.property('amount').to.have.property('unit').equal('kgCO2e');
    if (result.emissions && result.emissions.amount && result.emissions.amount.value) {
      const emissions_amount = result.emissions.amount.value;
      expect(Math.round(emissions_amount)).equal(25);
    } else {
      throw new Error('empty emissions.amount.value');
    }
  });

  it("should be correct calculation of natural gas from therm to kgCO2e", async function() {
    const activity: Activity = {
      id: '1',
      type: 'natural_gas',
      activity_amount: 100,
      activity_uom: 'therm',
      from_date: new Date('2019-01-31T22:00:00.000Z'),
      thru_date: new Date('2019-03-01T21:59:59.999Z'),
      from: '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199',
      to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    }
    const result = await process_activity(activity);
    expect(result).to.have.property('emissions');
    expect(result).to.have.property('emissions').to.have.property('amount');
    expect(result).to.have.property('emissions').to.have.property('amount').to.have.property('unit').equal('kgCO2e');
    if (result.emissions && result.emissions.amount && result.emissions.amount.value) {
      const emissions_amount = result.emissions.amount.value;
      expect(Math.round(emissions_amount)).equal(575);
    } else {
      throw new Error('empty emissions.amount.value');
    }
  });
});
