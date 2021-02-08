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

const EmissionsCalc = require("../chaincode/node/lib/emissions-calc.js");

const { execSync } = require("child_process");

yargs
  .command(
    "load_utility_emissions <file> <sheet>",
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
      if (opts.skip_rows && opts.skip_rows >= row) continue;
      //opts.verbose && console.log('--> ', row, col, value);

      // console.log(`col: ${col}`);
      // console.log(`row: ${row}`);
      //store header names
      if (row == header_row && value) {
        headers[col] = value;
        continue;
      }
      console.log(`headers: ${JSON.stringify(headers)}`);

      if (!data[row]) data[row] = {};
      data[row][headers[col]] = value;
    }
    return cb(data);
  });
}

function invokeChaincode(funct, args, callback) {
  let command_formatted = `sudo bash ./scripts/invokeChaincode.sh '{"function":"'${funct}'","Args":${args}}' 1 2`;
  console.log(`Calling ${command_formatted}\n`);
  execSync(command_formatted, (error, stdout, stderr) => {
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

function import_utility_emissions(file_name, opts) {
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
  } else if (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "ST18") {
    let data = parse_worksheet(file_name, opts, function(data) {
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
  } else if (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "US18") {
    let data = parse_worksheet(file_name, opts, function(data) {
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
  } else if (opts.file == "2019-RES_proxies_EEA.csv" && opts.sheet == "Sheet1") {
    let data = parse_worksheet(file_name, opts, function(data) {
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
          division_type: "COUNTRY",
          division_id: row["CountryShort"],
          division_name: countryName,
          net_generation: "",
          net_generation_uom: "",
          co2_equivalent_emissions: "",
          co2_equivalent_emissions_uom: "",
          source: "https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-3/eea-2017-res-share-proxies/2016-res_proxies_eea_csv/at_download/file",
          non_renewables: "",
          renewables: "",
          percent_of_renewables: row[" ValueNumeric"]
        };
        
        // format chaincode call
        let args = `[${JSON.stringify(d.uuid)},${JSON.stringify(d.year)},${JSON.stringify(d.country)},"${d.division_type}",${JSON.stringify(d.division_id)},${JSON.stringify(d.division_name)},"${d.net_generation}","${d.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${d.source}","${d.non_renewables}","${d.renewables}","${d.percent_of_renewables}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityFactor", args, callback);
      });
    });
  } else if (opts.file == "co2-emission-intensity-5.csv" && opts.sheet == "Sheet1") {
    // opts.skip_rows = 1;
    let data = parse_worksheet(file_name, opts, function(data) {
      async.eachSeries(data, function iterator(row, callback) {

        console.log(row);

        // skip rows that aren't latest year
        if (row["Date:year"] !== "2016") return callback();
        // skip total EU
        if (row["Member State:text"] == "European Union (current composition)") return callback();

        // get country abbreviation from full name
        let countryShort = Object.keys(NAME_MAPPINGS.COUNTRY_MAPPINGS).find(key => NAME_MAPPINGS.COUNTRY_MAPPINGS[key] === row["Member State:text"]);

        let countryName = row["Member State:text"];
        let document_id = `COUNTRY_${countryShort}_` + row["Year"];
        let d = {
          uuid: document_id,
          year: "" + row["Year"],
          country: countryName,
          division_type: "COUNTRY",
          division_id: countryShort,
          division_name: countryName,
          net_generation: row["CO2 emission intensity:number"],
          net_generation_uom: "grams",
          co2_equivalent_emissions: "",
          co2_equivalent_emissions_uom: "",
          source: "https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-6",
          non_renewables: "",
          renewables: "",
          percent_of_renewables: ""
        };
        
        // format chaincode call
        let args = `[${JSON.stringify(d.uuid)},${JSON.stringify(d.year)},${JSON.stringify(d.country)},"${d.division_type}",${JSON.stringify(d.division_id)},${JSON.stringify(d.division_name)},"${d.net_generation}","${d.net_generation_uom}","${d.co2_equivalent_emissions}","${d.co2_equivalent_emissions_uom}","${d.source}","${d.non_renewables}","${d.renewables}","${d.percent_of_renewables}"]`;

        // insert into chaincode
        invokeChaincode("importUtilityFactor", args, callback);
      });
    });
  } else {
    console.log("This sheet or PDF is not currently supported.");
  }
}

function import_utility_identifiers(file_name, opts) {
  opts.skip_rows = 1;
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
        uuid: row["Utility Number"],
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
      let args = `["${JSON.stringify(d.uuid)}","${JSON.stringify(d.year)}","${JSON.stringify(d.utility_number)}",${utility_name_formatted},${JSON.stringify(d.country)},${JSON.stringify(d.state_province)},"${divisions_formatted}"]`;

      // insert into chaincode
      invokeChaincode("importUtilityIdentifier", args, callback);
    });
  });
}

function get_co2_emissions(utility, thru_date, usage, usage_uom, opts) {
  let args = `["${utility}","${thru_date}","${usage}","${usage_uom}"]`;
  invokeChaincode("getCo2Emissions", args, ()=>{});
}

function get_emissions_factor(utility, thru_date, opts) {
  let args = `["${utility}","${thru_date}"]`;
  invokeChaincode("getEmissionsFactor", args, ()=>{});
}
