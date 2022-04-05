import { Presets, SingleBar } from "cli-progress";
import { readFile } from "xlsx";
import { v4 as uuidv4 } from 'uuid';
import { DbInterface } from "./db";
import { EMISSIONS_FACTOR_TYPE } from "./utils";
import { COUNTRY_MAPPINGS, STATE_NAME_MAPPING } from "./abbrevToName";
import { EmissionsFactorInterface, EMISSIONS_FACTOR_CLASS_IDENTIFER } from "emissions_data_chaincode/src/lib/emissionsFactor";
import { UtilityLookupItemInterface, UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER } from "emissions_data_chaincode/src/lib/utilityLookupItem";


export type ParseWorksheetOpts = {
  verbose?: boolean, 
  file: string, 
  sheet: string, 
  skip_rows?: number
};

export const parseWorksheet = (opts: ParseWorksheetOpts) => {
  const bar = new SingleBar(
    {
      format:
        "Parsing worksheet |" +
        "{bar}" +
        "| {percentage}% || {value}/{total} rows",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    Presets.shades_classic
  );
  const file_name = opts.file;

  opts.verbose && console.log("Reading file ...  ", file_name);
  const workbook = readFile(file_name);

  const sheet_name_list = workbook.SheetNames;

  let data = [];
  for (const sheet of sheet_name_list) {
    opts.verbose && console.log("Worksheet: ", sheet);
    if (opts.sheet && sheet != opts.sheet) {
      opts.verbose && console.log("-- not a match");
      continue;
    }

    const worksheet = workbook.Sheets[sheet];
    const headers = {};
    let header_row = 1;
    if (opts.skip_rows && opts.skip_rows >= header_row) {
      header_row = opts.skip_rows + 1;
    }
    opts.verbose &&
      console.log(
        "-- opts.skip_rows = ",
        opts.skip_rows,
        " header_row = ",
        header_row
      );
    bar.start(Object.keys(worksheet).length, 0);

    for (const z in worksheet) {
      if (z[0] === "!") continue;
      //parse out the column, row, and value
      let tt = 0;
      for (let i = 0; i < z.length; i++) {
        if (!isNaN(parseInt(z[i]))) {
          tt = i;
          break;
        }
      }

      const col = z.substring(0, tt).trim();
      const row = parseInt(z.substring(tt));
      const value = worksheet[z].v;
      bar.increment();
      if (opts.skip_rows && opts.skip_rows >= row) continue;

      //store header names
      if (row == header_row && value) {
        headers[col] = value;
        continue;
      }

      if (!data[row]) data[row] = {};
      data[row][headers[col]] = value;
    }

    data = data.filter(function () {
      return true;
    });
    bar.increment();
    bar.stop();
    break;
  }
  return data;
};

export const loadEmissionsFactors = async (opts: ParseWorksheetOpts, progressBar: SingleBar, db: DbInterface) => {
  const supportedFiles = [
    { file: "eGRID2018_Data_v2.xlsx", sheet: "NRL18" },
    { file: "eGRID2018_Data_v2.xlsx", sheet: "ST18" },
    { file: "eGRID2018_Data_v2.xlsx", sheet: "US18" },
    { file: "egrid2019_data.xlsx", sheet: "NRL19" },
    { file: "egrid2019_data.xlsx", sheet: "ST19" },
    { file: "egrid2019_data.xlsx", sheet: "US19" },
    { file: "2019-RES_proxies_EEA.csv", sheet: "Sheet1" },
    { file: "co2-emission-intensity-6.csv", sheet: "Sheet1" },
    {
      file: "conversion-factors-2021-flat-file-automatic-processing.xls",
      sheet: "Factors by Category",
      skip_rows: 4,
    },
  ];

  if (
    opts.file == "all" ||
    (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "NRL18")
  ) {
    const data = parseWorksheet(supportedFiles[0]);
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
    // async.eachSeries(data, function iterator(row, callback) {
    // console.log(`Received data of length ${data.length}`);
    progressBar.start(data.length, 0);
    for (const row of data) {
      // skip empty rows
      if (!row || !row["Data Year"]) continue;
      // skip header rows
      if (row["Data Year"] == "YEAR") continue;
      // generate a unique for the row
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: "USA",
        level_3: `NERC_REGION: ${row["NERC region acronym"]}`,
        scope: "SCOPE 2",
        uuid: uuidv4(),
        year: row["Data Year"].toString(),
        country: "USA",
        division_type: "NERC_REGION",
        division_id: row["NERC region acronym"],
        division_name: (row["NERC region name "] || "").replace(/ /g, "_"),
        net_generation:
          row["NERC region annual net generation (MWh)"].toString(),
        net_generation_uom: "MWH",
        co2_equivalent_emissions:
          row["NERC region annual CO2 equivalent emissions (tons)"].toString(),
        co2_equivalent_emissions_uom: "tons",
        source:
          "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip",
        non_renewables:
          row[
            "NERC region annual total nonrenewables net generation (MWh)"
          ].toString(),
        renewables:
          row[
            "NERC region annual total renewables net generation (MWh)"
          ].toString(),
        percent_of_renewables: "",
      };
      await db.putEmissionFactor(d);
      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }

  if (
    opts.file == "all" ||
    (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "ST18")
  ) {
    const data = parseWorksheet(supportedFiles[1]);
    progressBar.start(data.length, 0);

    for (const row of data) {
      // skip empty rows
      if (!row || !row["Data Year"]) continue;
      // skip header rows
      if (row["Data Year"] == "YEAR") continue;
      opts.verbose && console.log("-- Prepare to insert from ", row);
      // generate a unique for the row
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        uuid: uuidv4(),
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: "USA",
        level_3: `STATE: ${row["State abbreviation"]}`,
        scope: "SCOPE 2",
        year: row["Data Year"].toString(),
        country: "USA",
        division_type: "STATE",
        division_id: row["State abbreviation"],
        division_name: STATE_NAME_MAPPING[row["State abbreviation"]].toString(),
        net_generation: row["State annual net generation (MWh)"],
        net_generation_uom: "MWH",
        co2_equivalent_emissions:
          row["State annual CO2 equivalent emissions (tons)"].toString(),
        co2_equivalent_emissions_uom: "tons",
        source:
          "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip",
        non_renewables:
          row[
            "State annual total nonrenewables net generation (MWh)"
          ].toString(),
        renewables:
          row["State annual total renewables net generation (MWh)"].toString(),
        percent_of_renewables: "",
      };
      await db.putEmissionFactor(d);
      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }
  if (
    opts.file == "all" ||
    (opts.file == "eGRID2018_Data_v2.xlsx" && opts.sheet == "US18")
  ) {
    const data = parseWorksheet(supportedFiles[2]);
    progressBar.start(data.length, 0);

    for (const row of data) {
      // skip empty rows
      if (!row || !row["Data Year"]) continue;
      // skip header rows
      if (row["Data Year"] == "YEAR") continue;
      opts.verbose && console.log("-- Prepare to insert from ", row);
      // generate a unique for the row
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: "USA",
        level_3: "COUNTRY: USA",
        scope: "SCOPE 2",
        uuid: uuidv4(),
        year: "" + row["Data Year"],
        country: "USA",
        division_type: "COUNTRY",
        division_id: "USA",
        division_name: "United States of America",
        net_generation: "" + row["U.S. annual net generation (MWh)"],
        net_generation_uom: "MWH",
        co2_equivalent_emissions:
          "" + row["U.S. annual CO2 equivalent emissions (tons)"],
        co2_equivalent_emissions_uom: "tons",
        source:
          "https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip",
        non_renewables:
          row[
            "U.S. annual total nonrenewables net generation (MWh)"
          ].toString(),
        renewables:
          row["U.S. annual total renewables net generation (MWh)"].toString(),
        percent_of_renewables: "",
      };
      await db.putEmissionFactor(d);
      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }

  // eGRID Data for year 2019 ..

  if (
    opts.file == "all" ||
    (opts.file == "egrid2019_data.xlsx" && opts.sheet == "US19")
  ) {
    const data = parseWorksheet(supportedFiles[5]);
    progressBar.start(data.length, 0);

    for (const row of data) {
      // skip empty rows
      if (!row || !row["Data Year"]) continue;
      // skip header rows
      if (row["Data Year"] == "YEAR") continue;

      opts.verbose && console.log("-- Prepare to insert from ", row);
      // generate a unique for the row

      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: "USA",
        level_3: "COUNTRY: USA",
        scope: "SCOPE 2",
        uuid: uuidv4(),
        year: "" + row["Data Year"],
        country: "USA",
        division_type: "COUNTRY",
        division_id: "USA",
        division_name: "United States of America",
        net_generation: "" + row["U.S. annual net generation (MWh)"],
        net_generation_uom: "MWH",
        co2_equivalent_emissions:
          "" + row["U.S. annual CO2 equivalent emissions (tons)"],
        co2_equivalent_emissions_uom: "tons",
        source:
          "https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx",
        non_renewables:
          row[
            "U.S. annual total nonrenewables net generation (MWh)"
          ].toString(),
        renewables:
          row["U.S. annual total renewables net generation (MWh)"].toString(),
        percent_of_renewables: "",
      };
      await db.putEmissionFactor(d);
      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }

  if (
    opts.file == "all" ||
    (opts.file == "egrid2019_data.xlsx" && opts.sheet == "ST19")
  ) {
    const data = parseWorksheet(supportedFiles[4]);
    progressBar.start(data.length, 0);

    for (const row of data) {
      // skip empty rows
      if (!row || !row["Data Year"]) continue;
      // skip header rows
      if (row["Data Year"] == "YEAR") continue;
      opts.verbose && console.log("-- Prepare to insert from ", row);
      // generate a unique for the row
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: "USA",
        level_3: `STATE: ${row["State abbreviation"]}`,
        scope: "SCOPE 2",
        uuid: uuidv4(),
        year: "" + row["Data Year"],
        country: "USA",
        division_type: "STATE",
        division_id: row["State abbreviation"],
        division_name: STATE_NAME_MAPPING[row["State abbreviation"]],
        net_generation: "" + row["State annual net generation (MWh)"],
        net_generation_uom: "MWH",
        co2_equivalent_emissions:
          "" + row["State annual CO2 equivalent emissions (tons)"],
        co2_equivalent_emissions_uom: "tons",
        source:
          "https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx",
        non_renewables:
          row[
            "State annual total nonrenewables net generation (MWh)"
          ].toString(),
        renewables:
          row["State annual total renewables net generation (MWh)"].toString(),
        percent_of_renewables: "",
      };
      await db.putEmissionFactor(d);
      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }

  if (
    opts.file == "all" ||
    (opts.file == "egrid2019_data.xlsx" && opts.sheet == "NRL19")
  ) {
    const data = parseWorksheet(supportedFiles[3]);
    progressBar.start(data.length, 0);

    for (const row of data) {
      // skip empty rows
      if (!row || !row["Data Year"]) continue;
      // skip header rows
      if (row["Data Year"] == "YEAR") continue;
      opts.verbose && console.log("-- Prepare to insert from ", row);

      // generate a unique for the row
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: "USA",
        level_3: `NERC_REGION: ${row["NERC region acronym"]}`,
        scope: "SCOPE 2",
        uuid: uuidv4(),
        year: "" + row["Data Year"],
        country: "USA",
        division_type: "NERC_REGION",
        division_id: row["NERC region acronym"],
        division_name: row["NERC region name "] || "",
        net_generation: "" + row["NERC region annual net generation (MWh)"],
        net_generation_uom: "MWH",
        co2_equivalent_emissions:
          "" + row["NERC region annual CO2 equivalent emissions (tons)"],
        co2_equivalent_emissions_uom: "tons",
        source:
          "https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx",
        non_renewables:
          row[
            "NERC region annual total nonrenewables net generation (MWh)"
          ].toString(),
        renewables:
          row[
            "NERC region annual total renewables net generation (MWh)"
          ].toString(),
        percent_of_renewables: "",
      };

      await db.putEmissionFactor(d);

      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }

  if (
    opts.file == "all" ||
    (opts.file == "2019-RES_proxies_EEA.csv" && opts.sheet == "Sheet1")
  ) {
    const data = parseWorksheet(supportedFiles[6]);
    progressBar.start(data.length, 0);

    for (const row of data) {
      // skip empty rows
      if (!row || row["CountryShort"].slice(0, 2) == "EU") continue;

      // skip rows unrelated to electricity
      if (row["Market_Sector"] !== "Electricity") continue;

      const countryName = COUNTRY_MAPPINGS[row["CountryShort"]];
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        uuid: uuidv4(),
        type: EMISSIONS_FACTOR_TYPE,
        level_1: "Emissions Factor",
        level_2: countryName,
        level_3: `COUNTRY: ${countryName}`,
        scope: "SCOPE 2",
        year: "" + row["Year"],
        country: countryName,
        division_type: "Country",
        division_id: countryName,
        division_name: countryName,
        net_generation: "",
        net_generation_uom: "",
        co2_equivalent_emissions: "",
        co2_equivalent_emissions_uom: "",
        source:
          "https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-3/eea-2017-res-share-proxies/2016-res_proxies_eea_csv/at_download/file",
        non_renewables: "",
        renewables: "",
        percent_of_renewables: (Number(row[" ValueNumeric"]) * 100).toString(),
      };
      await db.putEmissionFactor(d);
      progressBar.increment();
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }
  if (
    opts.file == "all" ||
    (opts.file == "co2-emission-intensity-6.csv" && opts.sheet == "Sheet1")
  ) {
    console.log(
      "Assuming 2019-RES_proxies_EEA.csv has already been imported..."
    );
    const data = parseWorksheet(supportedFiles[7]);
    progressBar.start(data.length, 0);
    for (const row of data) {
      // skip empty rows
      if (!row || !row["Date:year"]) continue;
      // skip rows that aren't latest year
      if (row["Date:year"] !== 2019) continue;
      // skip total EU
      if (row["Member State:text"].startsWith("European Union")) continue;

      // get country long name and abbreviation from long name
      const countryLong = row["Member State:text"].replace(" ", "_");
      const countryShort = Object.keys(COUNTRY_MAPPINGS).find(
        (key) => COUNTRY_MAPPINGS[key] === countryLong
      );

      // skip if country name not found
      if (!countryShort) continue;

      const document_id = uuidv4();
      const d = {
        uuid: document_id,
        type: EMISSIONS_FACTOR_TYPE,
        co2_equivalent_emissions: row["index:number"],
        co2_equivalent_emissions_uom: "g/KWH",
        source: `https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-6`,
      };

      // find previous record to update
      const factor = await db.getEmissionFactor(document_id);
      if (factor) {
        factor.co2_equivalent_emissions = d.co2_equivalent_emissions;
        factor.co2_equivalent_emissions_uom = d.co2_equivalent_emissions_uom;
        factor.source = d.source;

        await db.putEmissionFactor(factor);
        progressBar.increment();
      } else {
        console.log("Could not find imported factor");
      }
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }

  if (
    opts.file == "all" ||
    opts.file == "conversion-factors-2021-flat-file-automatic-processing.xls"
  ) {
    const data = parseWorksheet(supportedFiles[8]);
    progressBar.start(data.length, 0);

    let i = 0;
    for (const row of data) {
      i++;
      // skip empty rows
      if (!row) continue;

      //skip non CO2e factors
      if (row.GHG !== "kg CO2e") continue;

      //skip rows with missing factors
      if (!row["GHG Conversion Factor 2021"]) continue;

      opts.verbose && console.log("-- Prepare to insert from ", row);

      // generate a unique for the rows
      const document_id = uuidv4();
      const d: EmissionsFactorInterface = {
        class: EMISSIONS_FACTOR_CLASS_IDENTIFER,
        type: `${row.Scope.replace(/ /g, "_").toUpperCase()}_EMISSIONS`,
        level_1: row["Level 1"].toUpperCase(),
        level_2: row["Level 2"].toUpperCase(),
        level_3: row["Level 3"].toUpperCase(),
        level_4: row["Level 4"] ? row["Level 4"].toUpperCase() : '',
        text: row["Column Text"] ?? "",
        scope: row.Scope,
        uuid: document_id,
        year: "2021",
        activity_uom: row.UOM,
        co2_equivalent_emissions: "" + row["GHG Conversion Factor 2021"],
        co2_equivalent_emissions_uom: "kg",
        source:
          "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021",
      };

      await db.putEmissionFactor(d);
      progressBar.update(i);
    }
    progressBar.stop();
    if (opts.file !== "all") return;
  }
  if (opts.file !== "all") {
    console.log(`Given file [${opts.file}] is not supported at the moment.`);
  } else {
    console.log("All supported files imported.");
  }
}

export const importUtilityIdentifiers = async (opts: ParseWorksheetOpts, progressBar: SingleBar, db: DbInterface) => {
  opts.skip_rows = 1;

  if (opts.file == "Utility_Data_2019.xlsx") {
    const data = parseWorksheet(opts);
    progressBar.start(data.length, 0);

    // import data for each valid row, eg:
    // Utility_Number = value from 'Utility Number'
    // Utility_Name = value from 'Utility Name'
    // State_Province = value from 'State'
    // Country = USA
    // Divisions = an array of objects
    // -- Division_type = NERC_REGION
    // -- Division_id = value from 'NERC Region'
    for (const row of data) {
      if (!row || !row["Data Year"]) continue;
      opts.verbose && console.log("-- Prepare to insert from ", row);
      const d: UtilityLookupItemInterface = {
        class: UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER,
        uuid: "USA_EIA_" + row["Utility Number"],
        year: row["Data Year"],
        utility_number: row["Utility Number"],
        utility_name: row["Utility Name"].replace(/'/g, "`").replace(/ /g, "_"),
        country: "USA",
        state_province: row["State"],
        divisions: {
          division_type: "NERC_REGION",
          division_id: row["NERC Region"].replace(/ /g, "_"),
        },
      };

      await db.putUtilityLookupItem(d);
      progressBar.increment();
    }
    progressBar.stop();
  } else {
    console.log("This sheet or PDF is not currently supported.");
  }
}
