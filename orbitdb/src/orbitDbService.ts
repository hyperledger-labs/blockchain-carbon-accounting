import type DocumentStore from 'orbit-db-docstore';
import type { CO2EmissionFactorInterface } from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissions-calc";
import type {
  EmissionsFactor,
  EmissionsFactorInterface,
} from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissionsFactor";
import { EMISSIONS_FACTOR_CLASS_IDENTIFER } from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissionsFactor";
import type {
  UtilityLookupItem,
  UtilityLookupItemInterface,
} from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/utilityLookupItem";
import { UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER } from "../../emissions-data/chaincode/emissionscontract/typescript/src/lib/utilityLookupItem";
import {
  ErrInvalidFactorForActivity,
  ErrUnknownUOM,
} from "../../emissions-data/chaincode/emissionscontract/typescript/src/util/const";
import { parseCommonYargsOptions } from "./config";

export const EMISSIONS_FACTOR_TYPE = "EMISSIONS_ELECTRICITY";

const UOM_FACTORS: { [key: string]: number } = {
  wh: 1.0,
  kwh: 1000.0,
  mwh: 1000000.0,
  gwh: 1000000000.0,
  twh: 1000000000000.0,
  kg: 1.0,
  t: 1000.0,
  ton: 1000.0,
  tons: 1000.0,
  tonnes: 1000,
  g: 0.001,
  kt: 1000000.0,
  mt: 1000000000.0,
  pg: 1000000000.0,
  gt: 1000000000000.0,
  "Room per night": 1,
  "passenger.km": 1,
  "tonne.km": 1,
};

const getYearFromDate = (date: string): number => {
  const time = new Date(date);
  if (!time.getFullYear()) {
    throw new Error(`${date} date format not supported`);
  }
  return time.getFullYear();
};

const getUomFactor = (uom: string): number => {
  const factor = UOM_FACTORS[uom.toLowerCase()];
  if (!factor) {
    throw new Error(`${ErrUnknownUOM} : ${uom} is not a valid uom`);
  }
  return factor;
};

export interface ActivityInterface {
  scope: string;
  level_1: string;
  level_2: string;
  level_3: string;
  activity_uom: string;
  activity: number;
  passengers?: number;
  tonnesShipped?: number;
}

type StoreRecord = UtilityLookupItemInterface | EmissionsFactorInterface;

export class OrbitDBService {
  private static _db: DocumentStore<StoreRecord>;

  public static init = async (argv): Promise<void> => {
    const opts = parseCommonYargsOptions(argv);
    // Create IPFS instance
    if (opts.useHttpClient) {
      console.log(`=== Connecting to IPFS ${opts.ipfsApiUrl}`);
    } else {
      if (opts.ipfsBootstrap)
        console.log(
          "=== IPFS Bootstrap setting: ",
          opts.ipfsOptions.config.Bootstrap
        );
      console.log("=== Starting NodeJS IPFS");
    }
    const ipfs = await opts.createIpfsInstance();
    // Create OrbitDB
    console.log(
      "=== Starting OrbitDB using directory: ",
      opts.orbitDbDirectory
    );
    const orbitdb = await opts.createOrbitDbInstance(ipfs);
    const dbOptions = {
      // Give write access to the creator of the database
      accessController: {
        type: "orbitdb", //OrbitDBAccessController
        write: [orbitdb.id],
      },
      indexBy: "uuid",
    };
    const dbPath = opts.orbitCreate ? opts.orbitDbName : opts.orbitDbFullPath;
    if (opts.orbitCreate) {
      console.log("=== Creating new OrbitDB: ", dbPath);
    } else {
      console.log("=== Using OrbitDB: ", dbPath);
    }

    const db = await orbitdb.docstore(dbPath, dbOptions);
    if (opts.orbitDebug) {
      db.events.on(
        "load.progress",
        async (_address, _hash, _entry, progress, have) => {
          console.log("Loading DB...", have, progress);
        }
      );
      db.events.on("ready", async () => {
        console.log("OrbitDB ready");
        const loadedRes = db.get("");
        console.log(`Current number of records: ${loadedRes.length}`);
      });
      db.events.on("load", async (dbname) => {
        console.log("Loading OrbitDB: ", dbname);
      });
      db.events.on(
        "replicate.progress",
        (_address, _hash, _entry, progress, have) => {
          console.log("Replicating...", have, progress);
        }
      );
      db.events.on("replicated", async () => {
        const loadedRes = db.get("");
        console.log(`Replicated number of records: ${loadedRes.length}`);
      });
    }
    await db.load();
    console.log(`=== OrbitDB address: ${db.address.toString()}`);

    OrbitDBService._db = db as DocumentStore<StoreRecord>;
  };

  public get = (query: string) => {
    return OrbitDBService._db.get(query);
  };

  public put = (doc: StoreRecord) => {
    return OrbitDBService._db.put(doc);
  };

  public getUtilityLookupItem = (uuid: string): UtilityLookupItemInterface => {
    return OrbitDBService._db.get(uuid)[0];
  };

  public getAllUtilityLookupItems = (): UtilityLookupItemInterface[] => {
    return OrbitDBService._db.query(
      (doc: UtilityLookupItemInterface) =>
        doc.class == UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER
    ) as UtilityLookupItemInterface[];
  };

  public updateUtilityLookupItem = async (
    item: UtilityLookupItem
  ): Promise<void> => {
    await OrbitDBService._db.put(item.item);
  };

  public getEmissionsFactor = (uuid: string): EmissionsFactorInterface => {
    return OrbitDBService._db.get(uuid)[0] as EmissionsFactorInterface;
  };

  public getAllFactors = (): EmissionsFactorInterface[] => {
    return OrbitDBService._db.get("") as EmissionsFactorInterface[];
  };

  public updateEmissionsFactor = async (
    factor: EmissionsFactor
  ): Promise<void> => {
    await OrbitDBService._db.put(factor.factor);
  };

  public getEmissionsFactorsByDivision = (
    divisionID: string,
    divisionType: string,
    year?: number
  ): EmissionsFactorInterface[] => {
    const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
    let retryCount = 0;
    let results: EmissionsFactorInterface[] = [];
    while (results.length === 0 && retryCount <= maxYearLookup) {
      if (year !== undefined) {
        results = OrbitDBService._db.query((doc: EmissionsFactorInterface) => {
          const isEmissionsFactor =
            doc.class === EMISSIONS_FACTOR_CLASS_IDENTIFER;
          const isUtilityFactor = doc.type === EMISSIONS_FACTOR_TYPE;
          const hasDivisionId = doc.division_id === divisionID;
          const hasDivisionType = doc.division_type === divisionType;
          const isOfQueriedYear =
            doc.year === (year + retryCount * -1).toString();
          return (
            isEmissionsFactor &&
            isUtilityFactor &&
            hasDivisionId &&
            hasDivisionType &&
            isOfQueriedYear
          );
        }) as EmissionsFactorInterface[];
      } else {
        results = OrbitDBService._db.query((doc: EmissionsFactorInterface) => {
          const isEmissionsFactor =
            doc.class === EMISSIONS_FACTOR_CLASS_IDENTIFER;
          const isUtilityFactor = doc.type === EMISSIONS_FACTOR_TYPE;
          const hasDivisionId = doc.division_id === divisionID;
          const hasDivisionType = doc.division_type === divisionType;
          return (
            isEmissionsFactor &&
            isUtilityFactor &&
            hasDivisionId &&
            hasDivisionType
          );
        }) as EmissionsFactorInterface[];
      }
      retryCount++;
    }
    if (results.length === 0) {
      throw new Error("failed to get Utility Emissions Factors By division");
    }
    return results;
  };

  // used by recordEmissions
  public getEmissionsFactorByLookupItem = (
    lookup: UtilityLookupItemInterface,
    thruDate: string
  ): EmissionsFactorInterface => {
    const hasStateData = lookup.state_province !== "";
    const isNercRegion =
      lookup.divisions?.division_type.toLowerCase() === "nerc_region";
    const isNonUSCountry =
      lookup.divisions?.division_type.toLowerCase() === "country" &&
      lookup.divisions?.division_id.toLowerCase() !== "usa";
    let divisionID: string;
    let divisionType: string;
    let year: number;
    if (hasStateData) {
      divisionID = lookup.state_province;
      divisionType = "STATE";
    } else if (isNercRegion) {
      divisionID = lookup.divisions?.division_id;
      divisionType = lookup.divisions?.division_type;
    } else if (isNonUSCountry) {
      divisionID = lookup.divisions?.division_id;
      divisionType = "Country";
    } else {
      divisionID = "USA";
      divisionType = "Country";
    }

    try {
      year = getYearFromDate(thruDate);
    } catch (error) {
      console.error("could not fetch year");
      console.error(error);
    }

    console.log("fetching utilityFactors");
    const utilityFactors = this.getEmissionsFactorsByDivision(
      divisionID,
      divisionType,
      year
    );

    if (utilityFactors.length === 0) {
      throw new Error("No utility emissions factor found for given query");
    }
    return utilityFactors[0];
  };

  public getEmissionsFactors = (
    activity: Partial<ActivityInterface>
  ): EmissionsFactorInterface[] => {
    return OrbitDBService._db.query((doc: EmissionsFactorInterface) => {
      if (doc.class !== EMISSIONS_FACTOR_CLASS_IDENTIFER) return false;
      if (activity.scope && doc.scope?.toUpperCase() !== activity.scope.toUpperCase()) return false;
      if (activity.level_1 && doc.level_1?.toUpperCase() !== activity.level_1.toUpperCase()) return false;
      if (activity.level_2 && doc.level_2?.toUpperCase() !== activity.level_2.toUpperCase()) return false;
      if (activity.level_3 && doc.level_3?.toUpperCase() !== activity.level_3.toUpperCase()) return false;
      if (activity.activity_uom && doc.activity_uom?.toUpperCase() !== activity.activity_uom.toUpperCase()) return false;
      return true;
    }) as EmissionsFactorInterface[];
  };

  public getEmissionsFactorByScope = (
    scope: string
  ): EmissionsFactorInterface[] => {
    return OrbitDBService._db.query((doc: EmissionsFactorInterface) => {
      const isEmissionsFactor = doc.class === EMISSIONS_FACTOR_CLASS_IDENTIFER;
      const isOfQueriedScope = doc.scope?.toUpperCase() === scope.toUpperCase();
      return isEmissionsFactor && isOfQueriedScope;
    }) as EmissionsFactorInterface[];
  };

  public getEmissionsFactorByActivity = (
    activity: ActivityInterface
  ): EmissionsFactorInterface[] => {
    return OrbitDBService._db.query((doc: EmissionsFactorInterface) => {
      const isEmissionsFactor = doc.class === EMISSIONS_FACTOR_CLASS_IDENTIFER;
      const isOfQueriedScope =
        doc.scope?.toUpperCase() === activity.scope.toUpperCase();
      const matchesLevel1 = doc.level_1?.toUpperCase() === activity.level_1.toUpperCase();
      const matchesLevel2 = doc.level_2?.toUpperCase() === activity.level_2.toUpperCase();
      const matchesLevel3 = doc.level_3?.toUpperCase() === activity.level_3.toUpperCase();
      const matchesActivityUOM =
        doc.activity_uom?.toUpperCase() === activity.activity_uom.toUpperCase();
      return (
        isEmissionsFactor &&
        isOfQueriedScope &&
        matchesLevel1 &&
        matchesLevel2 &&
        matchesLevel3 &&
        matchesActivityUOM
      );
    }) as EmissionsFactorInterface[];
  };

  public getCO2EmissionFactor = (
    factor: EmissionsFactorInterface,
    usage: number,
    usageUOM: string
  ): CO2EmissionFactorInterface => {
    // initialize return variables
    let emissionsValue: number;
    let emissionsUOM: string;
    let renewableEnergyUseAmount: number;
    let nonrenewableEnergyUseAmount: number;

    // calculate emissions using percent_of_renewables if found
    if (factor.percent_of_renewables.length !== 0) {
      emissionsUOM = "g";
      const co2EquivalentEmissionsUOM =
        factor.co2_equivalent_emissions_uom.split("/");
      if (co2EquivalentEmissionsUOM.length === 0) {
        console.error("co2_equivalent_emissions_uom not found in factor");
      }
      emissionsValue =
        (Number(factor.co2_equivalent_emissions) *
          usage *
          getUomFactor(co2EquivalentEmissionsUOM[0])) /
        getUomFactor(co2EquivalentEmissionsUOM[1]);
      const percentOfRenewables = Number(factor.percent_of_renewables) / 100;
      renewableEnergyUseAmount = usage * percentOfRenewables;
      nonrenewableEnergyUseAmount = usage * (1 - percentOfRenewables);
    } else {
      emissionsUOM = "tons";

      const net_generation_uom = factor.net_generation_uom;
      const co2_equivalent_emissions_uom = factor.co2_equivalent_emissions_uom;

      const usageUOMConversion =
        getUomFactor(usageUOM) / getUomFactor(net_generation_uom);
      const emissionsUOMConversion =
        getUomFactor(co2_equivalent_emissions_uom) / getUomFactor(emissionsUOM);

      emissionsValue =
        (Number(factor.co2_equivalent_emissions) /
          Number(factor.net_generation)) *
        usage *
        usageUOMConversion *
        emissionsUOMConversion;

      const totalGeneration =
        Number(factor.non_renewables) + Number(factor.renewables);
      renewableEnergyUseAmount =
        usage * (Number(factor.renewables) / totalGeneration);
      nonrenewableEnergyUseAmount =
        usage * (Number(factor.non_renewables) / totalGeneration);
    }

    return {
      emission: {
        value: emissionsValue,
        uom: emissionsUOM,
      },
      division_type: factor.division_type,
      division_id: factor.division_id,
      renewable_energy_use_amount: renewableEnergyUseAmount,
      nonrenewable_energy_use_amount: nonrenewableEnergyUseAmount,
      year: Number(factor.year),
    };
  };

  public getCO2EmissionByActivity = (
    activity: ActivityInterface
  ): CO2EmissionFactorInterface => {
    const factors = this.getEmissionsFactorByActivity(activity);
    if (!factors || !factors.length) {
      throw new Error(
        `${ErrInvalidFactorForActivity} No emission factor matches the given activity`
      );
    }
    return this.getCO2EmissionFactorByActivity(factors[0], activity);
  };

  public getCO2EmissionFactorByActivity = (
    factor: EmissionsFactorInterface,
    activity: ActivityInterface
  ): CO2EmissionFactorInterface => {
    // initialize return variables
    let emissionsValue: number;
    const emissionsUOM = "kg";

    const activityMatches =
      activity.scope?.toUpperCase() === factor.scope?.toUpperCase() &&
      activity.level_1?.toUpperCase() === factor.level_1?.toUpperCase() &&
      activity.level_2?.toUpperCase() === factor.level_2?.toUpperCase() &&
      activity.level_3?.toUpperCase() === factor.level_3?.toUpperCase() &&
      activity.activity_uom?.toUpperCase() === factor.activity_uom?.toUpperCase();

    const isTonneKmUsed =
      factor.activity_uom == "tonne.km" && activity.tonnesShipped !== undefined;
    const isPassengerKmUsed =
      factor.activity_uom == "passenger.km" &&
      activity.passengers !== undefined;

    // Check if activity matches the emissions factor
    if (activityMatches) {
      if (
        factor.activity_uom !== "tonne.km" &&
        activity.activity_uom !== "passenger.km"
      ) {
        emissionsValue =
          activity.activity * parseFloat(factor.co2_equivalent_emissions);
      } else if (isTonneKmUsed) {
        emissionsValue =
          activity.activity *
          activity.tonnesShipped *
          parseFloat(factor.co2_equivalent_emissions);
      } else if (isPassengerKmUsed) {
        emissionsValue =
          activity.activity *
          activity.passengers *
          parseFloat(factor.co2_equivalent_emissions);
      } else {
        throw new Error(
          `${ErrInvalidFactorForActivity} This emissions factor does not match the given activity`
        );
      }
      return {
        emission: {
          value: emissionsValue,
          uom: emissionsUOM,
        },
        year: Number(factor.year),
      };
    } else {
      throw new Error(
        `${ErrInvalidFactorForActivity} This emissions factor does not match the given activity`
      );
    }
  };
}
