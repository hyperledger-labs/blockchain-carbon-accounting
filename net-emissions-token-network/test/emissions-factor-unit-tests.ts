import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';
import { PostgresDBService } from 'blockchain-accounting-data-postgres/src/postgresDbService';
import type { EmissionsFactorInterface } from 'emissions_data_chaincode/src/lib/emissionsFactor';

async function addTestEmissionsFactor(efl: EmissionsFactorInterface) {
  const db = await PostgresDBService.getInstance();
  await db.getEmissionsFactorRepo().putEmissionFactor({...efl});
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
    db.close();
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
  });
});
