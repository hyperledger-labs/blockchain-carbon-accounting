// SPDX-License-Identifier: Apache-2.0
/**
 * This is to seed the Fabric data and test the method get_co2_emissions from the command line.
 *
 * Download the eGRID2 data, for example in a data/ directory
 * - eGRID2018_Data_v2.xlsx
 * - Utility_Data_2019_Data_Early_Release.xlsx
 *
 * - Run "node index.js load_utility_emissions data/eGRID2018_Data_v2.xlsx NRL18" to load the utility emissions data
 * - Run "node index.js load_utility_identifiers data/Utility_Data_2019_Data_Early_Release.xlsx" to load the utility lookup data
 * - Run "node index.js get_co2_emissions 11208 2018-05-21 3000" to test
 */

const XLSX = require("xlsx");
const async = require("async");
const yargs = require("yargs");
const NAME_MAPPINGS = require("./abrevToName.js");

const { execSync } = require("child_process");
const util = require('util');
const exec = util.promisify(require('child_process').exec)

yargs
  .command(
    "load_utility_emissions <file> [sheet]",
    "load data from XLSX file",
    (yargs) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
        })
        .positional("sheet", {
          describe: "name of the worksheet to load from",
          demandOption: false,
          default: "Sheet1"
        });
    },
    (argv) => {
      import_utility_emissions(argv.file, argv);
    }
  )
  .command(
    "load_utility_emissions_eu <file> <sheet>",
    "load data from XLSX file",
    (yargs) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
        })
        .positional("sheet", {
          describe: "name of the worksheet to load from",
        });
    },
    (argv) => {
      import_utility_emissions_eu(argv.file, argv);
    }
  )
  .command(
    "load_utility_identifiers <file> [sheet]",
    "load data from XLSX file",
    (yargs) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
        })
        .positional("sheet", {
          describe: "name of the worksheet to load from",
        });
    },
    (argv) => {
      import_utility_identifiers(argv.file, argv);
    }
  )
  .command(
    "get_emissions_factor <utility> <thru_date>",
    "get Utility Emissions Factors",
    (yargs) => {
      yargs
        .positional("utility", {
          describe: "the Utility Number",
        })
        .positional("thru_date", {
          describe: "thru date in YYYY-mm-dd, dd-mm-YYYY, YYYY/mm/dd or dd/mm/YYYY",
        });
    },
    (argv) => {
      get_emissions_factor(argv.utility, argv.thru_date, argv);
    }
  )
  .command(
    "get_co2_emissions <utility> <thru_date> <usage> <usage_uom> [emssions_uom]",
    "get Utility CO2 Emissions",
    (yargs) => {
      yargs
        .positional("utility", {
          describe: "the Utility Number",
        })
        .positional("thru_date", {
          describe: "thru date in YYYY-mm-dd, dd-mm-YYYY, YYYY/mm/dd or dd/mm/YYYY",
        })
        .positional("usage", {
          describe: "the Utility usage energy",
        })
        .positional("usage_uom", {
          describe: "the usage unit of measure",
        })
        .positional("emssions_uom", {
          describe: "the emissions unit of measure",
          default: "tons",
        });
    },
    (argv) => {
      get_co2_emissions(argv.utility, argv.thru_date, argv.usage, argv.usage_uom, argv);
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .demandCommand()
  .recommendCommands()
  .showHelpOnFail(true)
  .strict().argv;

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
      // console.log(`value: ${value}`);
      if (opts.skip_rows && opts.skip_rows >= row) continue;
      //opts.verbose && console.log('--> ', row, col, value);

      // console.log(`col: ${col}`);
      // console.log(`row: ${row}`);
      //store header names
      if (row == header_row && value) {
        headers[col] = value;
        continue;
      }

      if (!data[row]) data[row] = {};
      data[row][headers[col]] = value;
    }
    
    data = data.filter(function () { return true });
    // console.log(`data: ${JSON.stringify(data)}`);
    return cb(data);
  });
}

function invokeChaincode(funct, args, callback) {
  let command = `sudo bash ./scripts/invokeChaincode.sh '{"function":"'${funct}'","Args":${args}}' 1 2`;
  console.log(`Calling ${command}\n`);
  execSync(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  return callback();
}

async function getChaincode(funct, args) {
  let command = `sudo bash ./scripts/invokeChaincode.sh '{"function":"'${funct}'","Args":${args}}' 1 2`;
  let output = await exec(command);
  return output;
}

function import_utility_emissions(file_name, opts) {

  let supportedFiles = [
    { file: "eGRID2018_Data_v2.xlsx", sheet: "NRL18" },
    { file: "eGRID2018_Data_v2.xlsx", sheet: "ST18" },
    { file: "eGRID2018_Data_v2.xlsx", sheet: "US18" },
    { file: "2019-RES_proxies_EEA.csv", sheet: "Sheet1" },
    { file: "co2-emission-intensity-6.csv", sheet: "Sheet1" },
  ]

  if (opts.file == "all" || (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "NRL18")) {
    let data = parse_worksheet(supportedFiles[0].file, supportedFiles[0], function(data) {
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
      async.eachSeries(data, function iterator(row, callback) {
        // skip empty rows
        if (!row || !row["Data Year"]) return callback();
        // skip header rows
        if (row["Data Year"] == "YEAR") return callback();
        //opts.verbose && console.log('-- Prepare to insert from ', row);

        // generate a unique for the row
        let document_id = "USA_" + row["Data Year"] + "_NERC_REGION_" + row["NERC region acronym"];
        let d = {
          uuid: document_id,
          year: "" + row["Data Year"],
          country: "USA",
          division_type: "NERC_REGION",
          division_id: row["NERC region acronym"],
          division_name: row["NERC region name "] || "",
          net_generation: "" + row["NERC region annual net generation (MWh)"],
          net_generation_uom: "MWH",
          co2_equivalent_emissions: "" + row["NERC region annual CO2 equivalent emissions (tons)"],
          co2_equivalent_emissions_uom: "tons",
          source: "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip",
          non_renewables: row["NERC region annual total nonrenewables net generation (MWh)"].toString(),
          renewables: row["NERC region annual total renewables net generation (MWh)"].toString(),
          percent_of_renewables: ""
        };

        // format chaincode call
        let division_name_formatted = JSON.stringify(d.division_name).replace(/ /g, '_'); // replace space with _
        let args = `[${JSON.stringify(d.uuid)},${JSON.stringify(d.year)},${JSON.stringify(d.country)},"${d.division_type}",${JSON.stringify(d.division_id)},${division_name_formatted},"${d.net_generation}","${d.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${d.source}","${d.non_renewables}","${d.renewables}","${d.percent_of_renewables}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityFactor", args, callback);
      });
    });
    if (opts.file !== "all") return;
  }
  if (opts.file == "all" || (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "ST18")) {
    let data = parse_worksheet(supportedFiles[1].file, supportedFiles[1], function(data) {
      async.eachSeries(data, function iterator(row, callback) {
        // skip empty rows
        if (!row || !row["Data Year"]) return callback();
        // skip header rows
        if (row["Data Year"] == "YEAR") return callback();
        //opts.verbose && console.log('-- Prepare to insert from ', row);
        // generate a unique for the row
        let document_id = "USA_" + row["Data Year"] + "_STATE_" + row["State abbreviation"];
        let d = {
          uuid: document_id,
          year: "" + row["Data Year"],
          country: "USA",
          division_type: "STATE",
          division_id: row["State abbreviation"],
          division_name: NAME_MAPPINGS.STATE_NAME_MAPPING[row["State abbreviation"]],
          net_generation: "" + row["State annual net generation (MWh)"],
          net_generation_uom: "MWH",
          co2_equivalent_emissions: "" + row["State annual CO2 equivalent emissions (tons)"],
          co2_equivalent_emissions_uom: "tons",
          source: "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip",
          non_renewables: row["State annual total nonrenewables net generation (MWh)"].toString(),
          renewables: row["State annual total renewables net generation (MWh)"].toString(),
          percent_of_renewables: ""
        };
        
        // format chaincode call
        let args = `[${JSON.stringify(d.uuid)},${JSON.stringify(d.year)},${JSON.stringify(d.country)},"${d.division_type}",${JSON.stringify(d.division_id)},${JSON.stringify(d.division_name)},"${d.net_generation}","${d.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${d.source}","${d.non_renewables}","${d.renewables}","${d.percent_of_renewables}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityFactor", args, callback);
      });
    });
    if (opts.file !== "all") return;
  }
  if (opts.file == "all" || (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "US18")) {
    let data = parse_worksheet(supportedFiles[2].file, supportedFiles[2], function(data) {
      async.eachSeries(data, function iterator(row, callback) {
        // skip empty rows
        if (!row || !row["Data Year"]) return callback();
        // skip header rows
        if (row["Data Year"] == "YEAR") return callback();
        //opts.verbose && console.log('-- Prepare to insert from ', row);
        // generate a unique for the row
        let document_id = "COUNTRY_USA_" + row["Data Year"];
        let d = {
          uuid: document_id,
          year: "" + row["Data Year"],
          country: "USA",
          division_type: "COUNTRY",
          division_id: "USA",
          division_name: "United States of America",
          net_generation: "" + row["U.S. annual net generation (MWh)"],
          net_generation_uom: "MWH",
          co2_equivalent_emissions: "" + row["U.S. annual CO2 equivalent emissions (tons)"],
          co2_equivalent_emissions_uom: "tons",
          source: "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip",
          non_renewables: row["U.S. annual total nonrenewables net generation (MWh)"].toString(),
          renewables: row["U.S. annual total renewables net generation (MWh)"].toString(),
          percent_of_renewables: ""
        };
        
        // format chaincode call
        let args = `[${JSON.stringify(d.uuid)},${JSON.stringify(d.year)},${JSON.stringify(d.country)},"${d.division_type}",${JSON.stringify(d.division_id)},${JSON.stringify(d.division_name)},"${d.net_generation}","${d.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${d.source}","${d.non_renewables}","${d.renewables}","${d.percent_of_renewables}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityFactor", args, callback);
      });
    });
    if (opts.file !== "all") return;
  }
  if (opts.file == "all" || (opts.file == "2019-RES_proxies_EEA.csv" && opts.sheet == "Sheet1")) {
    let data = parse_worksheet(supportedFiles[3].file, supportedFiles[3], function(data) {
      async.eachSeries(data, function iterator(row, callback) {
        // skip empty rows
        if (!row || row["CountryShort"].slice(0, 2) == "EU") return callback();

        // skip rows unrelated to electricity
        if (row["Market_Sector"] !== "Electricity") return callback();

        let countryName = NAME_MAPPINGS.COUNTRY_MAPPINGS[row["CountryShort"]];
        let document_id = `COUNTRY_${row["CountryShort"]}_` + row["Year"];
        let d = {
          uuid: document_id,
          year: "" + row["Year"],
          country: countryName,
          division_type: "Country",
          division_id: countryName,
          division_name: countryName,
          net_generation: "",
          net_generation_uom: "",
          co2_equivalent_emissions: "",
          co2_equivalent_emissions_uom: "",
          source: "https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-3/eea-2017-res-share-proxies/2016-res_proxies_eea_csv/at_download/file",
          non_renewables: "",
          renewables: "",
          percent_of_renewables: (Number(row[" ValueNumeric"]) * 100)
        };
        
        // format chaincode call
        let args = `[${JSON.stringify(d.uuid)},${JSON.stringify(d.year)},${JSON.stringify(d.country)},"${d.division_type}",${JSON.stringify(d.division_id)},${JSON.stringify(d.division_name)},"${d.net_generation}","${d.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${d.source}","${d.non_renewables}","${d.renewables}","${d.percent_of_renewables}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityFactor", args, callback);
      });
    });
    if (opts.file !== "all") return;
  }
  if (opts.file == "all" || (opts.file == "co2-emission-intensity-6.csv" && opts.sheet == "Sheet1")) {
    console.log("Assuming 2019-RES_proxies_EEA.csv has already been imported...");
    let data = parse_worksheet(supportedFiles[4].file, supportedFiles[4], function(data) {
      async.eachSeries(data, function iterator(row, callback) {
        // skip empty rows
        if (!row || !row["Date:year"]) return callback();
        // console.log(JSON.stringify(row));
        // skip rows that aren't latest year
        if (row["Date:year"] !== 2019) return callback();
        // skip total EU
        if (row["Member State:text"].startsWith("European Union")) return callback();

        // get country long name and abbreviation from long name
        let countryLong = row["Member State:text"].replace(" ", "_");
        let countryShort = Object.keys(NAME_MAPPINGS.COUNTRY_MAPPINGS).find(key => NAME_MAPPINGS.COUNTRY_MAPPINGS[key] === countryLong);

        // skip if country name not found
        if (!countryShort) return callback();

        let document_id = `COUNTRY_` + countryShort + `_` + row["Date:year"];
        let d = {
          uuid: document_id,
          co2_equivalent_emissions: row["index:number"],
          co2_equivalent_emissions_uom: "g/KWH",
          source: `https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-6`,
        };
        
        // find previous record to update
        let utilityFactorCall = getChaincode("getUtilityFactor", `["${document_id}"]`).then((result) => {

          // get all details of existing utilityFactor
          let expr = /payload:"{([^\s]+)/;
          // let utilityFactorRaw = JSON.stringify(result).match(expr)[0];
          let utilityFactorRaw;
          try {
            let stderrSearch = result.stderr.match(expr)[0];
            let stdoutSearch = result.stdout.match(expr);

            if (stderrSearch) {
              utilityFactorRaw = stderrSearch;
            } else if (stdoutSearch) {
              utilityFactorRaw = stdoutSearch;
            }
          } catch (error) {
            console.error("Cannot get standard output for getUtilityFactor chaincode command");
          }
          let utilityFactor = JSON.parse(JSON.parse(utilityFactorRaw.substring(8)));

          // format chaincode call (only update items in d)
          let args = `["${utilityFactor.uuid}","${utilityFactor.year}","${utilityFactor.country}","${utilityFactor.division_type}","${utilityFactor.division_id}","${utilityFactor.division_name}","${utilityFactor.net_generation}","${utilityFactor.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${utilityFactor.source};${d.source}","${utilityFactor.non_renewables}","${utilityFactor.renewables}","${utilityFactor.percent_of_renewables}"]`;

          // insert into chaincode
          invokeChaincode("updateUtilityFactor", args, callback);

        });
      });
    });
    if (opts.file !== "all") return;
  }
  console.log("This sheet or PDF is not currently supported.");
}

function import_utility_identifiers(file_name, opts) {
  opts.skip_rows = 1;
  if (opts.file == "Utility_Data_2019.xlsx") {
    let data = parse_worksheet(file_name, opts, function(data) {
      // import data for each valid row, eg:
      // Utility_Number = value from 'Utility Number'
      // Utility_Name = value from 'Utility Name'
      // State_Province = value from 'State'
      // Country = USA
      // Divisions = an array of ojects
      // -- Division_type = NERC_REGION
      // -- Division_id = value from 'NERC Region'
      async.eachSeries(data, function iterator(row, callback) {
        if (!row || !row["Data Year"]) return callback();
        opts.verbose && console.log('-- Prepare to insert from ', row);
        let d = {
          uuid: "USA_EIA_" + row["Utility Number"],
          year: row["Data Year"],
          utility_number: row["Utility Number"],
          utility_name: row["Utility Name"].replace(/\'/g,"`"),
          country: "USA",
          state_province: row["State"],
          divisions: {
            division_type: "NERC_REGION",
            division_id: row["NERC Region"].replace(/ /g,"_"),
          },
        };

        // format chaincode call
        let divisions_formatted = JSON.stringify(d.divisions).replace(/"/g, '\\"'); // replace " with \"
        let utility_name_formatted = JSON.stringify(d.utility_name).replace(/ /g, '_'); // replace space with _
        let args = `[${JSON.stringify(d.uuid)},"${JSON.stringify(d.year)}","${JSON.stringify(d.utility_number)}",${utility_name_formatted},${JSON.stringify(d.country)},${JSON.stringify(d.state_province)},"${divisions_formatted}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityIdentifier", args, callback);
      });
    });
  } else {
    console.log("This sheet or PDF is not currently supported.");
  }
}

function get_co2_emissions(utility, thru_date, usage, usage_uom, opts) {
  let args = `["${utility}","${thru_date}","${usage}","${usage_uom}"]`;
  invokeChaincode("getCo2Emissions", args, ()=>{});
}

function get_emissions_factor(utility, thru_date, opts) {
  let args = `["${utility}","${thru_date}"]`;
  invokeChaincode("getEmissionsFactor", args, ()=>{});
}
