import { importUtilityIdentifiers, loadEmissionsFactors } from "@blockchain-carbon-accounting/data-common/spreadsheetImport"
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

