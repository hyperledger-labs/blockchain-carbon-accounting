import yargs = require('yargs')
import { ActivityInterface } from "@blockchain-carbon-accounting/data-common";
import type { EmissionsFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib";
import { hideBin } from "yargs/helpers";
import type { DbOpts } from "./config";
import { addCommonYargsOptions, parseCommonYargsOptions } from "./config";
import { PostgresDBService } from "./postgresDbService";
import { config } from 'dotenv';
import findConfig from "find-config";
config({ path: findConfig(".env") || '.' });

(async () => {

  const init = async (dbopts: DbOpts) => {
    return await PostgresDBService.getInstance(dbopts)
  }
  addCommonYargsOptions(yargs(hideBin(process.argv)))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .command("test", "Run some test queries", {}, async (args: any) => {
    const db = await init(parseCommonYargsOptions(args))

    const activity: ActivityInterface = {
      scope: "scope 1",
      level_1: "REFRIGERANT & OTHER",
      level_2: "KYOTO PROTOCOL - STANDARD",
      level_3: "PERFLUOROBUTANE (PFC-3-1-10)",
      activity_uom: "kg",
      activity: 2,
    }
    const factor: EmissionsFactorInterface = {
      text: "",
      type: "UTILITY_EMISSIONS_SCOPE_1",
      uuid: "SCOPE_1 PERFLUOROBUTANE (PFC-3-1-10)",
      year: "2021",
      class: "org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem",
      scope: "Scope 1",
      source:
        "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021",
      level_1: "REFRIGERANT & OTHER",
      level_2: "KYOTO PROTOCOL - STANDARD",
      level_3: "PERFLUOROBUTANE (PFC-3-1-10)",
      activity_uom: "kg",
      co2_equivalent_emissions: "8860",
      co2_equivalent_emissions_uom: "kg",
    }

    try {
      const allLookup = await db.getEmissionsFactorRepo().getAllFactors()
      console.log("Test getAllFactors ...")
      console.log(" got count : ", allLookup ? allLookup.length : null)
      if (allLookup && allLookup.length) {
        console.log("Sample first factor ...")
        console.log(allLookup[0])
      }
    } catch (e) {
      console.log('Error', e)
    }

    try {
      const res = await db.getEmissionsFactorRepo().getCO2EmissionFactorByActivity(factor, activity)
      console.log("Test getCO2EmissionFactorByActivity ...")
      console.log(res)
    } catch (e) {
      console.log('Error', e)
    }

    try {
      const res = await db.getEmissionsFactorRepo().getCO2EmissionByActivity(activity)
      console.log("Test getCO2EmissionByActivity ...")
      console.log(res)
    } catch (e) {
      console.log('Error', e)
    }
    await db.close()
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .command("factors", "Query all factors from the DB", {}, async (args: any) => {
    const db = await init(parseCommonYargsOptions(args))
    try {
      const count = await db.getEmissionsFactorRepo().countAllFactors()
      const allLookup = await db.getEmissionsFactorRepo().getAllFactors()
      console.log("count : ", count)

      if (allLookup && allLookup.length) {
        for (const f of allLookup) {
          console.log(f)
        }
      }
    } catch (e) {
      console.log('Error', e)
    }
    await db.close()
  })
  .command(
    "factor <scope> [level1] [level2] [level3] [level4] [text] [uom]",
    "Lookup an emission factor",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (yargs: any) => {
      yargs
        .positional("scope", {
          describe: 'The activity scope, eg: "scope 1"',
          type: "string",
        })
        .positional("level1", {
          describe: "Activity level 1",
          type: "string",
        })
        .positional("level2", {
          describe: "Activity level 2",
          type: "string",
        })
        .positional("level3", {
          describe: "Activity level 3",
          type: "string",
        })
        .positional("level4", {
          describe: "Activity level 4",
          type: "string",
        })
        .positional("text", {
          describe: "Activity text, eg: With RF, or: Without RF",
          type: "string",
        })
        .positional("uom", {
          describe: 'Activity uom, eg: "kg"',
          type: "string",
        })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const db = await init(parseCommonYargsOptions(args))
      try {
        const f = {
            scope: args.scope,
            level_1: args.level1,
            level_2: args.level2,
            level_3: args.level3,
            level_4: args.level4,
            text: args.text,
            activity_uom: args.uom,
          }
        const res = await db.getEmissionsFactorRepo().getEmissionsFactors(f)
        console.log(res)
      } catch (e) {
        console.log('Error', e)
      }
      await db.close()
    }
  )
  .command(
    "activity-emissions <scope> <level1> <level2> <level3> <level4> <text> <amount> [uom]",
    "Calculate the emissions for an activity",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (yargs: any) => {
      yargs
        .positional("scope", {
          describe: 'The activity scope, eg: "scope 1"',
          type: "string",
        })
        .positional("level1", {
          describe: "Activity level 1",
          type: "string",
        })
        .positional("level2", {
          describe: "Activity level 2",
          type: "string",
        })
        .positional("level3", {
          describe: "Activity level 3",
          type: "string",
        })
        .positional("level4", {
          describe: "Activity level 4",
          type: "string",
        })
        .positional("text", {
          describe: "Activity text, eg: With RF, or: Without RF",
          type: "string",
        })
        .positional("amount", {
          describe: "Amount of the activity UOM",
          type: "number",
        })
        .positional("uom", {
          describe: 'Activity uom, eg: "kg"',
          type: "string",
          default: "kg",
        })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const db = await init(parseCommonYargsOptions(args))
      try {
        const res = await db.getEmissionsFactorRepo().getCO2EmissionByActivity({
            scope: args.scope,
            level_1: args.level1,
            level_2: args.level2,
            level_3: args.level3,
            level_4: args.level4,
            text: args.text,
            activity_uom: args.uom,
            activity: args.amount,
            tonnesShipped: args.uom?.startsWith('tonne') ? 1 : undefined,
            passengers: args.uom?.startsWith('passenger') ? 1 : undefined,
          })

        console.log(res)
      } catch (e) {
        console.log('Error', e)
      }
      await db.close()
    }
  )
  .demandCommand(1)
  .recommendCommands()
  .strict()
  .showHelpOnFail(true).argv
})()

