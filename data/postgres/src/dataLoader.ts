import { Presets, SingleBar } from "cli-progress"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { PostgresDBService } from "./postgresDbService"
import { importUtilityIdentifiers, loadEmissionsFactors } from "blockchain-carbon-accounting-data-common/spreadsheetImport"
import { addCommonYargsOptions, parseCommonYargsOptions } from "./config"
import type { DbOpts } from "./config"

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

  const a = addCommonYargsOptions(yargs(hideBin(process.argv)))
  .parserConfiguration({
    "dot-notation": false, // Note: this is required or yargs gets confused in ts-node with file names having a dot
  })
  .command(
    "init",
    "DB init and table sync",
    async (argv) => {
      console.log("=== Init ...")
      const db = await init(parseCommonYargsOptions(argv))
      await db.close()
      console.log("=== Done")
    }
  )
  .command(
    "load_emissions_factors <file> [sheet]",
    "load data from XLSX file",
    (yargs) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
        })
        .positional("sheet", {
          describe: "name of the worksheet to load from",
          default: "Sheet1",
        });
    },
    async (argv) => {
      const db = await init(parseCommonYargsOptions(argv))
      console.log("=== Starting load_emissions_factors ...")
      await loadEmissionsFactors(argv, progressBar, db)
      const count = await db.countAllFactors()
      console.log(`=== Done, we now have ${count} EmissionFactors in the DB`)
      await db.close()
    }
  )
  .command(
    "load_utility_identifiers <file> [sheet]",
    "load data from XLSX file",
    (yargs) => {
      yargs
        .positional("file", {
          describe: "XLSX file to load from",
          demandOption: true,
        })
        .positional("sheet", {
          describe: "name of the worksheet to load from",
        })
    },
    async (argv) => {
      const db = await init(parseCommonYargsOptions(argv))
      console.log("=== Starting import_utility_identifiers ...")
      await importUtilityIdentifiers(argv, progressBar, db)
      const count = await db.countAllUtilityLookupItems()
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

