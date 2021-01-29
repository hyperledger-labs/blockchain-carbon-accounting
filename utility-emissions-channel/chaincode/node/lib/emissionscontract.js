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
    // load_utility_emissions(ctx, "./eGRID2018_Data_v2.xlsx", { sheet: "NRL18" });
    // load_utility_emissions(ctx, "./eGRID2018_Data_v2.xlsx", { sheet: "ST18" });
    // load_utility_identifiers(ctx, "./Utility_Data_2019.xlsx");
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
    // TODO: use a constants file
    var emissionsUom = "tc02e";
    // get emissions factors from eGRID database; convert energy use to emissions factor UOM; calculate energy use
    const db = EmissionsCalc.connectdb(AWS);
    let calc = await EmissionsCalc.get_co2_emissions(db, utilityId, thruDate, energyUseAmount, {
      usage_uom: energyUseUom,
      emssions_uom: emissionsUom,
    });
    var emissionsAmount = calc.Emissions.value;
    let renewable_energy_use_amount = calc.renewableEnergyUseAmount;
    let nonrenewable_energy_use_amount = calc.nonRenewableEnergyUseAmount;
    let division_type = calc.Division_type;
    let division_id = calc.divisionId;
    let year = calc.year;
    let factor_source = `eGrid ${year} ${division_type} ${division_id}`;
    let tokenId = null;

    // create an instance of the emissions record
    let emissionsRecord = EmissionsRecord.createInstance(
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

  async getUtilityFactor(ctx, uuid, thruDate) {
    let utilityLookup = await ctx.utilityLookupList.getUtilityLookupItem(uuid);

    // create division object used for later query into utilityEmissionsFactorList
    let hasStateData = utilityLookup.state_province;
    let isNercRegion = utilityLookup.divisions.division_type === "NERC_REGION";
    let division;
    if (hasStateData) {
      division = { division_id: utilityLookup.state_province, division_type: "STATE" };
    } else if (isNercRegion) {
      division = utilityLookup.divisions;
    } else {
      division = { division_id: "USA", division_type: "COUNTRY" };
    }

    // check if new division object has ID
    if (!division.division_id) {
      return reject("Utility [" + uuid + "] does not have a Division ID");
    }

    // get utility emissions factors with division_type and division_id
    let params = {
      division_id: division.division_id,
      division_type: division.division_type
    };

    // filter matching year if found
    let year = EmissionsCalc.get_year_from_date(thruDate);
    if (year) { params.year = year }

    // query emissions factors
    let utilityFactors = await ctx.utilityEmissionsFactorList.getUtilityEmissionsFactorsByDivision(uuid);

    return utilityFactors;
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
    renewables
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
      renewables
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
    renewables
  ) {
    let utilityFactor = EmissionsRecord.createInstance(
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
      renewables
    );
    await ctx.utilityEmissionsFactorList.updateUtilityEmissionsFactor(utilityFactor, uuid);
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
    await ctx.utilityLookupList.updateUtilityLookupItem(utilityIdentifier, uuid);
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
    await ctx.utilityLookupList.addUtilityLookupItem(utilityIdentifier, uuid);
    return utilityIdentifier;
  }

  async getAllUtilityIndentifiers(ctx) {
    let utilityIndentifiers = await ctx.utilityLookupList.getAllUtilityLookupItems();

    return utilityIndentifiers;
  }
}

module.exports = EmissionsRecordContract;
