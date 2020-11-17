/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";
const AWS = require("aws-sdk");

// Fabric smart contract classes
const { Contract, Context } = require("fabric-contract-api");

// EmissionsRecord specifc classes
const EmissionsRecord = require("./emissions.js");
const EmissionsList = require("./emissionslist.js");
const EmissionsCalc = require("./emissions-calc.js");

/**
 * A custom context provides easy access to list of all emissions records
 */
class EmissionsRecordContext extends Context {
  constructor() {
    super();
    // All emissions records are held in a list
    this.emissionsList = new EmissionsList(this);
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
  async recordEmissions(ctx, uuid, utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom, url) {
    // TODO: use a constants file
    var emissionsUom = "MtCO2e";
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

    // create an instance of the emissions record
    let emissionsRecord = EmissionsRecord.createInstance(
      utilityId,
      partyId,
      fromDate,
      thruDate,
      emissionsAmount,
      emissionsUom,
      renewable_energy_use_amount,
      nonrenewable_energy_use_amount,
      energyUseUom,
      factor_source,
      url
    );

    // Add the emissions record to the list of all similar emissions records in the ledger world state
    await ctx.emissionsList.addEmissionsRecord(emissionsRecord, uuid);

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
}

module.exports = EmissionsRecordContract;
