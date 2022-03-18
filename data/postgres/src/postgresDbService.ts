import type { CO2EmissionFactorInterface } from "../../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissions-calc";
import type { EmissionsFactorInterface } from "../../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissionsFactor";
import { EMISSIONS_FACTOR_CLASS_IDENTIFER } from "../../../emissions-data/chaincode/emissionscontract/typescript/src/lib/emissionsFactor";
import type { UtilityLookupItemInterface } from "../../../emissions-data/chaincode/emissionscontract/typescript/src/lib/utilityLookupItem";
import { ErrInvalidFactorForActivity } from "../../../emissions-data/chaincode/emissionscontract/typescript/src/util/const";
import { DbOpts, parseCommonYargsOptions } from "./config";
import { getUomFactor } from "../../common/uom";
import { ActivityInterface, getYearFromDate } from "../../common/utils";
import { DbInterface } from "../../common/db";
import { initModels, EmissionsFactorModel, UtilityLookupItemModel } from './models'
import { Op, Sequelize } from "sequelize";


export class PostgresDBService implements DbInterface {

  private _db: Sequelize;
  private static _instance: PostgresDBService;

  public static getInstance = async (opts?: DbOpts): Promise<PostgresDBService> => {
    if (PostgresDBService._instance) return PostgresDBService._instance
    // get default options
    if (!opts) opts = parseCommonYargsOptions({})
    
    try {
      const db = new Sequelize(opts.dbName, opts.dbUser, opts.dbPassword, {
        host: opts.dbHost,
        dialect: opts.dbDialect,
        logging: opts.dbVerbose
      })

      await initModels(db, opts)
      const i = new PostgresDBService(db)
      PostgresDBService._instance = i
      return i
    } catch (error) {
      throw new Error('Error initializing the DB:' + error)
    }
  }

  constructor(dbConnection: Sequelize) {
    this._db = dbConnection
  }

  public async close() {
    await this._db.close()
    PostgresDBService._instance = null
  }

  private makeEmissionFactorMatchWhereCondition = (doc: Partial<EmissionsFactorInterface>) => {
    const cond = this.makeEmissionFactorMatchCondition(doc);
    return { where: { [Op.and]: cond }, raw: true}
  }

  private makeEmissionFactorMatchCondition = (doc: Partial<EmissionsFactorInterface>) => {
    // creates an array of case insensitive queries
    const conditions = []
    if (doc.scope) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('scope')), doc.scope.toUpperCase())); 
    if (doc.level_1) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('level_1')), doc.level_1.toUpperCase())); 
    if (doc.level_2) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('level_2')), doc.level_2.toUpperCase())); 
    if (doc.level_3) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('level_3')), doc.level_3.toUpperCase())); 
    if (doc.level_4) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('level_4')), doc.level_4.toUpperCase())); 
    if (doc.text) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('text')), doc.text.toUpperCase())); 
    if (doc.activity_uom) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('activity_uom')), doc.activity_uom.toUpperCase())); 
    if (doc.year) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('year')), doc.year.toUpperCase())); 
    if (doc.division_id) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('division_id')), doc.division_id.toUpperCase())); 
    if (doc.division_type) conditions.push(Sequelize.where(Sequelize.fn('UPPER', Sequelize.col('division_type')), doc.division_type.toUpperCase())); 
    return conditions
  }

  public checkActivityAndFactorMatches = (
    activity: Partial<ActivityInterface>,
    doc: EmissionsFactorInterface
  ): boolean => {
    if (doc.class !== EMISSIONS_FACTOR_CLASS_IDENTIFER) return false;
    if (activity.scope && doc.scope?.toUpperCase() !== activity.scope.toUpperCase()) return false;
    if (activity.level_1 && doc.level_1?.toUpperCase() !== activity.level_1.toUpperCase()) return false;
    if (activity.level_2 && doc.level_2?.toUpperCase() !== activity.level_2.toUpperCase()) return false;
    if (activity.level_3 && doc.level_3?.toUpperCase() !== activity.level_3.toUpperCase()) return false;
    if (activity.level_4 && doc.level_4?.toUpperCase() !== activity.level_4.toUpperCase()) return false;
    if (activity.text && doc.text?.toUpperCase() !== activity.text.toUpperCase()) return false;
    if (activity.activity_uom && doc.activity_uom?.toUpperCase() !== activity.activity_uom.toUpperCase()) return false;
    return true;
  };


  public putEmissionFactor = async (doc: EmissionsFactorInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    await EmissionsFactorModel.destroy(this.makeEmissionFactorMatchWhereCondition(doc))
    await EmissionsFactorModel.create(doc as Partial<EmissionsFactorInterface>)
  };

  public getEmissionFactor = async (uuid: string): Promise<EmissionsFactorInterface> => {
    return await EmissionsFactorModel.findByPk(uuid, {raw: true});
  };

  public putUtilityLookupItem = async (doc: UtilityLookupItemInterface) => {
    await UtilityLookupItemModel.create(doc as Partial<UtilityLookupItemInterface>)
  };

  public getUtilityLookupItem = async (uuid: string): Promise<UtilityLookupItemInterface> => {
    return await UtilityLookupItemModel.findByPk(uuid, {raw: true});
  };

  public getAllUtilityLookupItems = async (): Promise<UtilityLookupItemInterface[]> => {
    return await UtilityLookupItemModel.findAll({raw: true});
  };

  public countAllUtilityLookupItems = async (): Promise<number> => {
    return await UtilityLookupItemModel.count();
  };

  public getAllFactors = async (): Promise<EmissionsFactorInterface[]> => {
    return await EmissionsFactorModel.findAll({raw: true});
  };

  public countAllFactors = async (): Promise<number> => {
    return await EmissionsFactorModel.count();
  };

  public getEmissionsFactorsByDivision = async (
    divisionID: string,
    divisionType: string,
    year?: number
  ): Promise<EmissionsFactorInterface[]> => {
    const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
    let retryCount = 0;
    let results: EmissionsFactorInterface[] = [];
    while (results.length === 0 && retryCount <= maxYearLookup) {
      if (year !== undefined) {
        results = await this.getEmissionsFactors({
          division_id: divisionID,
          division_type: divisionType,
          year: (year + retryCount * -1).toString()
        })
      } else {
        results = await this.getEmissionsFactors({
          division_id: divisionID,
          division_type: divisionType,
        })
        // nothing to retry here...
        break
      }
      retryCount++;
    }
    if (results.length === 0) {
      throw new Error("failed to get Utility Emissions Factors By division");
    }
    return results;
  }

  // used by recordEmissions
  public getEmissionsFactorByLookupItem = async (
    lookup: UtilityLookupItemInterface,
    thruDate: string
  ): Promise<EmissionsFactorInterface> => {
    const hasStateData = lookup.state_province !== "";
    const isNercRegion = lookup.divisions?.division_type.toLowerCase() === "nerc_region";
    const isNonUSCountry = lookup.divisions?.division_type.toLowerCase() === "country" && lookup.divisions?.division_id.toLowerCase() !== "usa";
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
    const utilityFactors = await this.getEmissionsFactorsByDivision(
      divisionID,
      divisionType,
      year
    );

    if (utilityFactors.length === 0) {
      throw new Error("No utility emissions factor found for given query");
    }
    return utilityFactors[0];
  };

  public getEmissionsFactors = async (query: Partial<EmissionsFactorInterface>): Promise<EmissionsFactorInterface[]> => {
    return await EmissionsFactorModel.findAll(this.makeEmissionFactorMatchWhereCondition(query));
  };

  public getEmissionsFactorByScope = async (scope: string): Promise<EmissionsFactorInterface[]> => {
    return this.getEmissionsFactors({scope})
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

  public getCO2EmissionByActivity = async (
    activity: ActivityInterface
  ): Promise<CO2EmissionFactorInterface> => {
    const factors = await this.getEmissionsFactors(activity);
    if (!factors || !factors.length) {
      throw new Error(
        `${ErrInvalidFactorForActivity} No emission factor matches the given activity`
      );
    }
    if (factors.length > 1) {
      // throw an error if there are multiple factors that have different scope/l1/l2/l3/l4/text/activity_uom
      const keys = factors.reduce((p: Record<string,number>,c)=>{
        const k = `${c.scope}/${c.level_1}/${c.level_2}/${c.level_3}/${c.level_4}/${c.text}/${c.activity_uom}`
        p[k] ? p[k]++ : p[k] = 1;
        return p;
      }, {})
      if (keys.length > 1) {
        throw new Error(
          `${ErrInvalidFactorForActivity} More than one factor matched the given activity: ` + JSON.stringify(factors)
        );
      }
      // else return the most recent one by year
      const f = factors.reduce((p,c)=>{
        if (c.year && p.year && parseInt(c.year) > parseInt(p.year)) return c;
        return p;
      }, factors[0])
      return this.getCO2EmissionFactorByActivity(f, activity);

    }
    return this.getCO2EmissionFactorByActivity(factors[0], activity);
  };

  public getCO2EmissionFactorByActivity = async (
    factor: EmissionsFactorInterface,
    activity: ActivityInterface
  ): Promise<CO2EmissionFactorInterface> => {
    // initialize return variables
    let emissionsValue: number;
    const emissionsUOM = "kg";

    const activityMatches = this.checkActivityAndFactorMatches(activity, factor);

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

