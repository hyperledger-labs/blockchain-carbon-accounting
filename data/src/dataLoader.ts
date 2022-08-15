import { importUtilityIdentifiers, loadEmissionsFactors } from "@blockchain-carbon-accounting/data-common/spreadsheetImport"
import { importOilAndGasAssets, importFlareData } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/import"
import { Presets, SingleBar } from "cli-progress"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import type { DbOpts } from "./config"
import { addCommonYargsOptions, parseCommonYargsOptions } from "./config"
import { PostgresDBService } from "./postgresDbService"
import { config } from 'dotenv';
import findConfig from "find-config";
config({ path: findConfig(".env") || '.' });

const progressBar = new SingleBar(
  {
    format:
    "Loading into PostgresDB |" +
      "{bar}" +
      "| {percentage}% | ETA: {eta}s | {value}/{total} records",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  },
  Presets.shades_classic
);

(async () => {
  const init = async (dbopts: DbOpts) => {
    return await PostgresDBService.getInstance(dbopts)
  }

  addCommonYargsOptions(yargs(hideBin(process.argv)))
  .parserConfiguration({
    "dot-notation": false, // Note: this is required or yargs gets confused in ts-node with file names having a dot
  })
  .command(
    "init",
    "DB init and table sync",
    // eslint-disable-next-line
    async (argv: any) => {
      console.log("=== Init ...")
      const db = await init(parseCommonYargsOptions(argv))
      await db.close()
      console.log("=== Done")
    }
  )
  .command(
    "load_emissions_factors <file> [sheet]",
    "load data from XLSX file",
    // eslint-disable-next-line
    (yargs: any) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
        })
        .positional("sheet", {
          describe: "Name of the worksheet to load from",
          default: "Sheet1",
        })
       .option('format', {
          type: 'string',
          description: 'Data format, which could be egrid_data | eea_res_proxies | eea_intensity | conversion-factors-uk',
          demandOption: true,
        })
        .option('source', {
          type: 'string',
          description: 'Data file source',
        })
        .option('year', {
          type: 'string',
          description: 'Source data year, required for conversion-factors-uk, skipped for other formats',
        });
    },
    // eslint-disable-next-line
    async (argv: any) => {
      console.log("=== Starting load_emissions_factors ...")
      if (argv.format === 'conversion-factors-uk' && !argv.year) {
        console.log("'--year' parameter is required for conversion-factors-uk format")
        return
      }
      const db = await init(parseCommonYargsOptions(argv))
      await loadEmissionsFactors(argv, progressBar, db.getEmissionsFactorRepo())
      const count = await db.getEmissionsFactorRepo().countAllFactors()
      console.log(`=== Done, we now have ${count} EmissionFactors in the DB`)
      await db.close()
    }
  )
  .command(
    "load_utility_identifiers <file> [sheet]",
    "load data from XLSX file",
    // eslint-disable-next-line
    (yargs: any) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
          demandOption: true,
        })
        .positional("sheet", {
          describe: "Name of the worksheet to load from",
        })
    },
    // eslint-disable-next-line
    async (argv: any) => {
      const db = await init(parseCommonYargsOptions(argv))
      console.log("=== Starting import_utility_identifiers ...")
      await importUtilityIdentifiers(argv, progressBar, db.getUtilityLookupItemRepo())
      const count = await db.getUtilityLookupItemRepo().countAllUtilityLookupItems()
      console.log(`=== Done, we now have ${count} UtilityLookupItems in the DB`)
      await db.close()
    }
  )
  .command(
    "load_og_assets <file>",
    "load data from geojson file",
    // eslint-disable-next-line
    (yargs: any) => {
      yargs
        .positional("file", {
          describe: "CSV file to load from",
        })
        .option('format', {
          type: 'string',
          description: 'Data format to load',
        })
        .option('source', {
          type: 'string',
          description: 'Data format to load',
        })
    },
    // eslint-disable-next-line
    async (argv: any) => {
      console.log("=== Starting load_og_assets ...")
      const db = await init(parseCommonYargsOptions(argv))
      await importOilAndGasAssets(argv, progressBar, db)
    }
  )
  .command(
    "load_product_data <file> [sheet]",
    "load data from xls, xlsx, or csv file",
    // eslint-disable-next-line
    (yargs: any) => {
      yargs
        .positional("file", {
          describe: "XLS file to load from",
        })
        .positional("sheet", {
          describe: "Name of the worksheet to load from",
          default: "Data 1",
        })
        .option('format', {
          type: 'string',
          description: 'Data format to load',
        })
        .option('year', {
          type: 'string',
          description: 'Year of data to load',
        })
        .option('source', {
          type: 'string',
          description: 'Source of product data',
        })
        .option('name', {
          type: 'string',
          description: 'Product name',
        })
        .option('type', {
          type: 'string',
          description: 'Product type',
        })
        .option('unit', {
          type: 'string',
          description: 'unit of data being loaded',
        })
        .option('skip_rows', {
          type: 'string',
          description: 'Number of rows to skip for header',
        })
        .option('cellDates', {
          type: 'boolean',
          description: 'Identify cell dates',
        })        
        .option('raw', {
          type: 'boolean',
          description: 'Use raw spreadsheet data',
        });
    },
    // eslint-disable-next-line
    async (argv: any) => {
      console.log("=== Starting load_product_data ...")
      const db = await init(parseCommonYargsOptions(argv))
      await importFlareData(argv, progressBar, db.getProductRepo())
      const count = await db.getProductRepo().countAllProducts();
      console.log(`=== Done, we now have ${count} product entries in the DB`)
      await db.close()
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .demandCommand(1)
  .recommendCommands()
  .strict()
  .showHelpOnFail(true).argv
})()

