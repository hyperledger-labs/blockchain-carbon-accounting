/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";
const AWS = require("aws-sdk");

// Fabric smart contract classes
const { Contract, Context } = require("fabric-contract-api");

// EmissionsRecord specific classes
const EmissionsRecord = require("./emissions.js");
const EmissionsList = require("./emissionslist.js");
const EmissionsCalc = require("./emissions-calc.js");

// Egrid specific classes
const { UtilityEmissionsFactorList, UtilityLookupList, UtilityLookupItem, UtilityEmissionsFactorItem } = require("./egrid-data.js");

/**
 * A custom context provides easy access to list of all emissions records, etc.
 */
class EmissionsRecordContext extends Context {
  constructor() {
    super();
    // All emissions records are held in a list
    this.emissionsList = new EmissionsList(this);
    // Egrid data is stored here (formerly dynamodb)
    this.utilityEmissionsFactorList = new UtilityEmissionsFactorList(this);
    this.utilityLookupList = new UtilityLookupList(this);
  }
}

/**
 * Define emissions record smart contract by extending Fabric Contract class
 *
 */
class EmissionsRecordContract extends Contract {
  constructor() {
    // Unique namespace when multiple contracts per chaincode file
    super("org.hyperledger.blockchain-carbon-accounting.emissionsrecord");
  }

  /**
   * Define a custom context for emissions record
   */
  createContext() {
    return new EmissionsRecordContext();
  }

  /**
   * Initialize any setup of the ledger that might be required.
   * @param {Context} ctx the transaction context
   */
  async init(ctx) {
    // No initialization right now
    console.log("Initializing the contract");
  }

  /**
   * Store the emissions record
   *
   * @param {Context} ctx the transaction context
   * @param {String} Id for the utility
   * @param {String} Id for the party (company) which buys power from utility
   * @param {String} from date of the time period
   * @param {String} thru date of the time period
   * @param {Double} energy usage amount
   * @param {String} UOM of energy usage amount -- ie kwh
   */
  async recordEmissions(ctx, uuid, utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom, url, md5) {
    // get emissions factors from eGRID database; convert energy use to emissions factor UOM; calculate energy use
    let co2Emissions = await this.getCo2Emissions(ctx, utilityId, thruDate, energyUseAmount, energyUseUom);
    let factor_source = `eGrid ${co2Emissions.year} ${co2Emissions.division_type} ${co2Emissions.division_id}`;

    // create an instance of the emissions record
    let emissionsRecord = EmissionsRecord.createInstance(
      uuid,
      utilityId,
      partyId,
      fromDate,
      thruDate,
      co2Emissions.emissions.value, // emissions amount
      co2Emissions.renewable_energy_use_amount,
      co2Emissions.nonrenewable_energy_use_amount,
      energyUseUom,
      factor_source,
      url,
      md5,
      null // tokenId
    );

    // Add the emissions record to the list of all similar emissions records in the ledger world state
    await ctx.emissionsList.addEmissionsRecord(emissionsRecord, uuid);

    // Must return a serialized emissionsRecord to caller of smart contract
    return emissionsRecord;
  }

  async updateEmissionsRecord(
    ctx,
    uuid,
    utilityId,
    partyId,
    fromDate,
    thruDate,
    emissionsAmount,
    renewable_energy_use_amount,
    nonrenewable_energy_use_amount,
    energyUseUom,
    factor_source,
    url,
    md5,
    tokenId
  ) {
    // create an instance of the emissions record
    let emissionsRecord = EmissionsRecord.createInstance(
      uuid,
      utilityId,
      partyId,
      fromDate,
      thruDate,
      parseFloat(emissionsAmount),
      parseFloat(renewable_energy_use_amount),
      parseFloat(nonrenewable_energy_use_amount),
      energyUseUom,
      factor_source,
      url,
      md5,
      tokenId
    );

    // Update the emissions record to the list of all similar emissions records in the ledger world state
    await ctx.emissionsList.updateEmissionsRecord(emissionsRecord, uuid);

    // Must return a serialized emissionsRecord to caller of smart contract
    return emissionsRecord;
  }

  /**
   * Get the emissions record
   *
   * @param {Context} ctx the transaction context
   * @param {String} Id for the utility
   * @param {String} Id for the party (company) which buys power from utility
   * @param {String} from date of the time period
   * @param {String} thru date of the time period
   */
  async getEmissionsData(ctx, uuid) {
    // Retrieve the current emissions record using key fields provided
    // let emissionsRecordKey = EmissionsRecord.makeKey();
    let emissionsRecord = await ctx.emissionsList.getEmissionsRecord(uuid);

    return emissionsRecord;
  }

  /**
   * Get all the emissions records
   * @param {Context} ctx the transaction context
   * @param {String} Id for the utility
   * @param {String} Id for the party (company) which buys power from utility
   */
  async getAllEmissionsData(ctx, utilityId, partyId) {
    let queryData = {
      utilityId: utilityId,
      partyId: partyId,
    };
    let emissionsRecord = await ctx.emissionsList.getAllEmissionRecords(queryData);

    return emissionsRecord;
  }

  async getAllEmissionsDataByDateRange(ctx, fromDate, thruDate) {
    let queryData = {
      fromDate: fromDate,
      thruDate: thruDate,
    };
    let emissionsRecord = await ctx.emissionsList.getAllEmissionsDataByDateRange(queryData);

    return emissionsRecord;
  }

  // replaces get_emmissions_factor in emissions-calc.js
  async getEmissionsFactor(ctx, uuid, thruDate) {
    let utilityLookup = await ctx.utilityLookupList.getUtilityLookupItem(uuid);

    // create newDivision object used for later query into utilityEmissionsFactorList
    let hasStateData = (JSON.parse(utilityLookup).state_province).toString().length > 0;
    let fetchedDivisions = JSON.parse(JSON.parse(utilityLookup).divisions);
    let fetchedDivisionType = fetchedDivisions["division_type"];
    let fetchedDivisionId = fetchedDivisions["division_id"];

    let isNercRegion = fetchedDivisionType.toLowerCase() === "nerc_region";
    let isNonUSCountry = (fetchedDivisionType.toLowerCase() === "country") &&
                         (fetchedDivisionId.toLowerCase() !== "usa");
    let newDivision;
    if (hasStateData) {
      newDivision = { division_id: JSON.parse(utilityLookup).state_province, division_type: "STATE" };
    } else if (isNercRegion) {
      newDivision = fetchedDivisions;
    } else if (isNonUSCountry) {
      newDivision = { division_id: fetchedDivisionId, division_type: "Country" };
    } else {
      newDivision = { division_id: "USA", division_type: "COUNTRY" };
    }

    // check if newDivision object has ID
    if (!newDivision.division_id) {
      return reject("Utility [" + uuid + "] does not have a Division ID");
    }

    // get utility emissions factors with division_type and division_id
    let queryParams = {
      division_id: newDivision.division_id,
      division_type: newDivision.division_type
    };

    // filter matching year if found
    let year = EmissionsCalc.get_year_from_date(thruDate);
    if (year) { queryParams.year = year.toString() }

    console.log(`queryParams = ${JSON.stringify(queryParams)}`);

    // query emissions factors
    let utilityFactors = await ctx.utilityEmissionsFactorList.getUtilityEmissionsFactorsByDivision(queryParams);

    console.log(`utilityFactors = ${utilityFactors}`);

    return utilityFactors;
  }

  // replaces get_co2_emissions in emissions-calc.js
  async getCo2Emissions(ctx, uuid, thruDate, usage, usage_uom) {
    // get emissions factor of given uuid through date
    let utilityFactorCall = await this.getEmissionsFactor(ctx, uuid, thruDate);
    let utilityFactor = JSON.parse(utilityFactorCall)[0].Record;

    // initialize return variables
    let emissions_value, emissions_uom, renewable_energy_use_amount, nonrenewable_energy_use_amount;

    // calculate emissions using percent_of_renewables if found
    if (utilityFactor.percent_of_renewables.toString().length > 0) {

      emissions_uom = "g";

      let co2_equivalent_emissions_uom = utilityFactor.co2_equivalent_emissions_uom;
      let emissions_uom_conversion =
        EmissionsCalc.get_uom_factor(co2_equivalent_emissions_uom) / EmissionsCalc.get_uom_factor(emissions_uom);

      emissions_value = 
        Number(utilityFactor.co2_equivalent_emissions) *
        usage *
        EmissionsCalc.get_uom_factor(usage_uom);

      renewable_energy_use_amount = usage * Number(utilityFactor.percent_of_renewables);
      nonrenewable_energy_use_amount = usage * (100 - Number(utilityFactor.percent_of_renewables));

    // otherwise, calculate emissions using net_generation
    } else {
      emissions_uom = "tons";

      let net_generation_uom = utilityFactor.net_generation_uom;
      let co2_equivalent_emissions_uom = utilityFactor.co2_equivalent_emissions_uom;

      let usage_uom_conversion = EmissionsCalc.get_uom_factor(usage_uom) / EmissionsCalc.get_uom_factor(net_generation_uom);
      let emissions_uom_conversion =
        EmissionsCalc.get_uom_factor(co2_equivalent_emissions_uom) / EmissionsCalc.get_uom_factor(emissions_uom);

      emissions_value =
        (Number(utilityFactor.co2_equivalent_emissions) / Number(utilityFactor.net_generation)) *
        usage *
        usage_uom_conversion *
        emissions_uom_conversion;

      let total_generation = Number(utilityFactor.non_renewables) + Number(utilityFactor.renewables);
      renewable_energy_use_amount = usage * (utilityFactor.renewables / total_generation);
      nonrenewable_energy_use_amount = usage * (utilityFactor.non_renewables / total_generation);
    }

    return {
      emissions: {
        value: emissions_value,
        uom: emissions_uom,
      },
      division_type: utilityFactor.division_type,
      division_id: utilityFactor.division_id,
      renewable_energy_use_amount: renewable_energy_use_amount,
      nonrenewable_energy_use_amount: nonrenewable_energy_use_amount,
      year: utilityFactor.year,
    };
  }

  async importUtilityFactor(
    ctx,
    uuid,
    year,
    country,
    division_type,
    division_id,
    division_name,
    net_generation,
    net_generation_uom,
    co2_equivalent_emissions,
    co2_equivalent_emissions_uom,
    source,
    non_renewables,
    renewables,
    percent_of_renewables
  ) {
    let utilityFactor = UtilityEmissionsFactorItem.createInstance(
      uuid,
      year,
      country,
      division_type,
      division_id,
      division_name,
      net_generation,
      net_generation_uom,
      co2_equivalent_emissions,
      co2_equivalent_emissions_uom,
      source,
      non_renewables,
      renewables,
      percent_of_renewables
    );
    await ctx.utilityEmissionsFactorList.addUtilityEmissionsFactor(utilityFactor, uuid);
    return utilityFactor;
  }

  async updateUtilityFactor(
    ctx,
    uuid,
    year,
    country,
    division_type,
    division_id,
    division_name,
    net_generation,
    net_generation_uom,
    co2_equivalent_emissions,
    co2_equivalent_emissions_uom,
    source,
    non_renewables,
    renewables,
    percent_of_renewables
  ) {
    let utilityFactor = UtilityEmissionsFactorItem.createInstance(
      uuid,
      year,
      country,
      division_type,
      division_id,
      division_name,
      net_generation,
      net_generation_uom,
      co2_equivalent_emissions,
      co2_equivalent_emissions_uom,
      source,
      non_renewables,
      renewables,
      percent_of_renewables
    );
    await ctx.utilityEmissionsFactorList.updateUtilityEmissionsFactor(utilityFactor, uuid);
    return utilityFactor;
  }

  async getUtilityFactor(ctx, uuid) {
    let utilityFactor = await ctx.utilityEmissionsFactorList.getUtilityEmissionsFactor(uuid);

    return utilityFactor;
  }

  async importUtilityIdentifier(ctx, uuid, year, utility_number, utility_name, country, state_province, divisions) {
    let utilityIdentifier = UtilityLookupItem.createInstance(
      uuid,
      year,
      utility_number,
      utility_name,
      country,
      state_province,
      divisions
    );
    await ctx.utilityLookupList.addUtilityLookupItem(utilityIdentifier, uuid);
    return utilityIdentifier;
  }

  async updateUtilityIdentifier(ctx, uuid, year, utility_number, utility_name, country, state_province, divisions) {
    let utilityIdentifier = UtilityLookupItem.createInstance(
      uuid,
      year,
      utility_number,
      utility_name,
      country,
      state_province,
      divisions
    );
    await ctx.utilityLookupList.updateUtilityLookupItem(utilityIdentifier, uuid);
    return utilityIdentifier;
  }

  async getUtilityIdentifier(ctx, uuid) {
    let utilityIdentifier = await ctx.utilityLookupList.getUtilityLookupItem(uuid);

    return utilityIdentifier;
  }

  async getAllUtilityIdentifiers(ctx) {
    let utilityIndentifiers = await ctx.utilityLookupList.getAllUtilityLookupItems();

    return utilityIdentifiers;
  }
}

module.exports = EmissionsRecordContract;
