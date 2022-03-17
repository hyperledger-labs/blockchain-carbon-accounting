import { Presets, SingleBar } from "cli-progress";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { addCommonYargsOptions } from "./config";
import { OrbitDBService } from "./orbitDbService";
import { importUtilityIdentifiers, loadEmissionsFactors } from "../../common/spreadsheetImport";

let db: OrbitDBService;

const progressBar = new SingleBar(
  {
    format:
      "Loading into OrbitDB |" +
      "{bar}" +
      "| {percentage}% | ETA: {eta}s | {value}/{total} records",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  },
  Presets.shades_classic
);


(async () => {
  const init = async (argv) => {
    await OrbitDBService.init(argv);
    db = new OrbitDBService();
  };

  addCommonYargsOptions(yargs(hideBin(process.argv)))
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
        await init(argv);
        console.log("=== Starting load_emissions_factors ...");
        await loadEmissionsFactors(argv, progressBar, db);
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
          });
      },
      async (argv) => {
        await init(argv);
        console.log("=== Starting import_utility_identifiers ...");
        await importUtilityIdentifiers(argv, progressBar, db);
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
    .showHelpOnFail(true).argv;
})();
