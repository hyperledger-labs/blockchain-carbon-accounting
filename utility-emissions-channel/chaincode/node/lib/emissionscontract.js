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
const Egrid = require("./egrid-data.js");

const XLSX = require("xlsx");

// Utility function for importing XLSX spreadsheets
function parse_worksheet(file_name, opts, cb) {
  opts.verbose && console.log("Reading file ...  ", file_name);
  var workbook = XLSX.readFile(file_name);

  var sheet_name_list = workbook.SheetNames;
  sheet_name_list.forEach(function(y) {
    opts.verbose && console.log("Worksheet: ", y);
    if (opts.sheet && y != opts.sheet) {
      opts.verbose && console.log("-- not a match");
      return;
    }

    var worksheet = workbook.Sheets[y];
    var headers = {};
    var data = [];
    var header_row = 1;
    if (opts.skip_rows && opts.skip_rows >= header_row) {
      header_row = opts.skip_rows + 1;
    }
    opts.verbose && console.log("-- opts.skip_rows = ", opts.skip_rows, " header_row = ", header_row);
    for (z in worksheet) {
      if (z[0] === "!") continue;
      //parse out the column, row, and value
      var tt = 0;
      for (var i = 0; i < z.length; i++) {
        if (!isNaN(z[i])) {
          tt = i;
          break;
        }
      }
      var col = z.substring(0, tt).trim();
      var row = parseInt(z.substring(tt));
      var value = worksheet[z].v;
      if (opts.skip_rows && opts.skip_rows >= row) continue;
      //opts.verbose && console.log('--> ', row, col, value);

      //store header names
      if (row == header_row && value) {
        headers[col] = value;
        continue;
      }

      if (!data[row]) data[row] = {};
      data[row][headers[col]] = value;
    }
    return cb(data);
  });
}

/**
 * A custom context provides easy access to list of all emissions records, etc.
 */
class EmissionsRecordContext extends Context {
  constructor() {
    super();
    // All emissions records are held in a list
    this.emissionsList = new EmissionsList(this);
    // Egrid data is stored here (formerly dynamodb)
    this.utilityEmissionsFactorList = new Egrid.UtilityEmissionsFactorList(this);
    this.utilityLookupList = new Egrid.UtilityLookupList(this);
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
    load_utility_emissions(ctx, "./eGRID2018_Data_v2.xlsx", { sheet: "NRL18" });
    load_utility_emissions(ctx, "./eGRID2018_Data_v2.xlsx", { sheet: "ST18" });
    load_utility_identifiers(ctx, "./Utility_Data_2019.xlsx");
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

  import_utility_emissions(ctx, file_name, opts) {
    let self = this;
    if (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "NRL18") {
      let data = parse_worksheet(file_name, opts, function(data) {
        // import data for each valid row, eg:
        // Year = 2018 from 'Data Year'
        // Country = USA
        // Division_type = NERC_REGION
        // Division_id = value from 'NERC region acronym'
        // Division_name = value from 'NERC region name'
        // Net_Generation = value from 'NERC region annual net generation (MWh)'
        // Net_Generation_UOM = MWH
        // CO2_Equivalent_Emissions = value from 'NERC region annual CO2 equivalent emissions (tons)'
        // CO2_Equivalent_Emissions_UOM = tons
        // Source = https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip
        for (row in data) {
          // skip empty rows
          if (!row || !row["Data Year"]) continue;
        // skip header rows
        if (row["Data Year"] == "YEAR") continue;
          //opts.verbose && console.log('-- Prepare to insert from ', row);

          // generate a unique for the row
          let document_id = "USA_" + row["Data Year"] + "_NERC_REGION_" + row["NERC region acronym"];
          let d = {
            uuid: { S: document_id },
            year: { N: "" + row["Data Year"] },
            country: { S: "USA" },
            division_type: { S: "NERC_REGION" },
            division_id: { S: row["NERC region acronym"] },
            division_name: { S: row["NERC region name "] || "" },
            net_generation: { N: "" + row["NERC region annual net generation (MWh)"] },
            net_generation_uom: { S: "MWH" },
            co2_equivalent_emissions: { N: "" + row["NERC region annual CO2 equivalent emissions (tons)"] },
            co2_equivalent_emissions_uom: { S: "tons" },
            source: { S: "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip" },
            non_renewables: { N: row["NERC region annual total nonrenewables net generation (MWh)"].toString() },
            renewables: { N: row["NERC region annual total renewables net generation (MWh)"].toString() },
          };
          let utilityEmissionsFactor = Egrid.UtilityEmissionsFactorItem.createInstance(
            d.uuid,
            d.year,
            d.country,
            d.division_type,
            d.division_id,
            d.division_name,
            d.net_generation,
            d.net_generation_uom,
            d.co2_equivalent_emissions,
            d.co2_equivalent_emissions_uom,
            d.source,
            d.non_renewables,
            d.renewables
          );
          await self.ctx.utilityEmissionsFactorList.addUtilityEmissionsFactor(utilityEmissionsFactor, d.uuid);
        });
      });
    } else if (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "ST18") {
      let data = parse_worksheet(file_name, opts, function(data) {
        for (row in data) {
          // skip empty rows
          if (!row || !row["Data Year"]) continue;
          // skip header rows
          if (row["Data Year"] == "YEAR") continue;
          //opts.verbose && console.log('-- Prepare to insert from ', row);
          // generate a unique for the row
          let document_id = "USA_ST_" + row["Data Year"] + "_NERC_REGION_" + row["State abbreviation"];
          let d = {
            uuid: { S: document_id },
            year: { N: "" + row["Data Year"] },
            country: { S: "USA" },
            division_type: { S: "STATE" },
            division_id: { S: row["State abbreviation"] },
            division_name: { S: NAME_MAPPINGS.STATE_NAME_MAPPING[row["State abbreviation"]] },
            net_generation: { N: "" + row["State annual net generation (MWh)"] },
            net_generation_uom: { S: "MWH" },
            co2_equivalent_emissions: { N: "" + row["State annual CO2 equivalent total output emission rate (lb/MWh)"] },
            co2_equivalent_emissions_uom: { S: "lb/MWH" },
            source: { S: "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip" },
            non_renewables: { N: row["State annual total nonrenewables net generation (MWh)"].toString() },
            renewables: { N: row["State annual total renewables net generation (MWh)"].toString() },
          };
          let utilityEmissionsFactor = Egrid.UtilityEmissionsFactorItem.createInstance(
            d.uuid,
            d.year,
            d.country,
            d.division_type,
            d.division_id,
            d.division_name,
            d.net_generation,
            d.net_generation_uom,
            d.co2_equivalent_emissions,
            d.co2_equivalent_emissions_uom,
            d.source,
            d.non_renewables,
            d.renewables
          );
          await self.ctx.utilityEmissionsFactorList.addUtilityEmissionsFactor(utilityEmissionsFactor, d.uuid);
        });
      });
    } else if (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "US18") {
      let data = parse_worksheet(file_name, opts, function(data) {
        for (row in data) {
          // skip empty rows
          if (!row || !row["Data Year"]) continue;
          // skip header rows
          if (row["Data Year"] == "YEAR") continue;
          //opts.verbose && console.log('-- Prepare to insert from ', row);
          // generate a unique for the row
          let document_id = "COUNTRY_USA_" + row["Data Year"];
          let d = {
            uuid: { S: document_id },
            year: { N: "" + row["Data Year"] },
            country: { S: "USA" },
            division_type: { S: "COUNTRY" },
            division_id: { S: "USA" },
            division_name: { S: "United States of America" },
            net_generation: { N: "" + row["U.S. annual net generation (MWh)"] },
            net_generation_uom: { S: "MWH" },
            co2_equivalent_emissions: { N: "" + row["U.S. annual CO2 equivalent emissions (tons)"] },
            co2_equivalent_emissions_uom: { S: "tons" },
            source: { S: "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip" },
            non_renewables: { N: row["U.S. annual total nonrenewables net generation (MWh)"].toString() },
            renewables: { N: row["U.S. annual total renewables net generation (MWh)"].toString() },
          };
          let utilityEmissionsFactor = Egrid.UtilityEmissionsFactorItem.createInstance(
            d.uuid,
            d.year,
            d.country,
            d.division_type,
            d.division_id,
            d.division_name,
            d.net_generation,
            d.net_generation_uom,
            d.co2_equivalent_emissions,
            d.co2_equivalent_emissions_uom,
            d.source,
            d.non_renewables,
            d.renewables
          );
          await self.ctx.utilityEmissionsFactorList.addUtilityEmissionsFactor(utilityEmissionsFactor, d.uuid);
        });
      });
    } else if (opts.file == "2019-RES_proxies_EEA.csv" && opts.sheet == "Sheet1") {
      let data = parse_worksheet(file_name, opts, function(data) {
        for (row in data) {
          // skip empty rows
          if (!row || row["Unit"] == "%" || row["CountryShort"].slice(0, 2) == "EU") continue;

          // skip header rows
          if (row["Data Year"] == "YEAR") continue;
          //opts.verbose && console.log('-- Prepare to insert from ', row);
          // generate a unique for the row
          // console.log(row);
          let countryName = NAME_MAPPINGS.COUNTRY_MAPPINGS[row["CountryShort"]];
          let document_id = `COUNTRY_${row["CountryShort"]}_` + row["Year"];
          let d = {
            uuid: { S: document_id },
            year: { N: "" + row["Year"] },
            country: { S: "USA" },
            division_type: { S: "COUNTRY" },
            division_id: { S: row["CountryShort"] },
            division_name: { S: countryName },
            net_generation: { N: "" },
            net_generation_uom: { S: "" },
            co2_equivalent_emissions: { N: "" },
            co2_equivalent_emissions_uom: { S: "" },
            source: {
              S:
                "https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-3/eea-2017-res-share-proxies/2016-res_proxies_eea_csv/at_download/file",
            },
            non_renewables: { N: "" },
            renewables: { N: row[" ValueNumeric"] },
          };
          let utilityEmissionsFactor = Egrid.UtilityEmissionsFactorItem.createInstance(
            d.uuid,
            d.year,
            d.country,
            d.division_type,
            d.division_id,
            d.division_name,
            d.net_generation,
            d.net_generation_uom,
            d.co2_equivalent_emissions,
            d.co2_equivalent_emissions_uom,
            d.source,
            d.non_renewables,
            d.renewables
          );
          await self.ctx.utilityEmissionsFactorList.addUtilityEmissionsFactor(utilityEmissionsFactor, d.uuid);
        });
      });
    } else {
      console.log("This sheet or PDF is not currently supported.");
    }
  }

  async import_utility_identifiers(ctx, file_name, opts) {
    opts.skip_rows = 1;
    let self = this;
    let data = parse_worksheet(file_name, opts, function(data) {
      // import data for each valid row, eg:
      // Utility_Number = value from 'Utility Number'
      // Utility_Name = value from 'Utility Name'
      // State_Province = value from 'State'
      // Country = USA
      // Divisions = an array of ojects
      // -- Division_type = NERC_REGION
      // -- Division_id = value from 'NERC Region'
      for (row in data) {
        if (!row || !row["Data Year"]) continue;
        let d = {
          uuid: { S: "" + row["Utility Number"] },
          year: { N: "" + row["Data Year"] },
          utility_number: { N: "" + row["Utility Number"] },
          utility_name: { S: row["Utility Name"] },
          country: { S: "USA" },
          state_province: { S: row["State"] },
          divisions: {
            m: {
              division_type: { S: "NERC_REGION" },
              division_id: { S: row["NERC Region"] },
            },
          },
        };
        let utilityLookupItem = Egrid.UtilityLookupItem.createInstance(
          d.uuid,
          d.year,
          d.utility_number,
          d.utility_name,
          d.country,
          d.state_province,
          d.divisions
        );
        await self.ctx.utilityLookupList.addUtilityLookupItem(utilityLookupItem, d.uuid);
      }
      return (data.length > 0);
    });
  }
}

module.exports = EmissionsRecordContract;
