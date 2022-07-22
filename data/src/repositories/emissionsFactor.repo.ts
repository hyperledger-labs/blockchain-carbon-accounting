import { EmissionFactorDbInterface } from "@blockchain-carbon-accounting/data-common/db"
import { ActivityInterface, getYearFromDate } from "@blockchain-carbon-accounting/data-common/utils"
import { CO2EmissionFactorInterface, getUomFactor } from "@blockchain-carbon-accounting/emissions_data_lib/src/emissions-calc"
import { EMISSIONS_FACTOR_CLASS_IDENTIFER } from "@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor"
import type { EmissionsFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor"
import type { UtilityLookupItemInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/utilityLookupItem"
import { ErrInvalidFactorForActivity } from "@blockchain-carbon-accounting/emissions_data_lib/src/const"
import { Between, DataSource, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, SelectQueryBuilder } from "typeorm"
import { EmissionsFactor } from "../models/emissionsFactor"
import { UtilityLookupItem } from "../models/utilityLookupItem"

export class EmissionsFactorRepo implements EmissionFactorDbInterface {

  private _db: DataSource

  constructor(dbConnection: DataSource) {
    this._db = dbConnection
  }

  private makeEmissionFactorMatchWhereCondition = (doc: Partial<EmissionsFactorInterface>) => {
    const cond = this.makeEmissionFactorMatchCondition(doc)
    return cond
  }

  private makeEmissionFactorMatchCondition = (doc: Partial<EmissionsFactorInterface>) => {
    // creates an array of case insensitive queries
    const conditions: FindOptionsWhere<EmissionsFactor> = {}
    if (doc.scope) conditions.scope = ILike(doc.scope)
    if (doc.level_1) conditions.level_1 = ILike(doc.level_1)
    if (doc.level_2) conditions.level_2 = ILike(doc.level_2)
    if (doc.level_3) conditions.level_3 = ILike(doc.level_3)
    if (doc.level_4) conditions.level_4 = ILike(doc.level_4)
    if (doc.text) conditions.text = ILike(doc.text)
    if (doc.activity_uom) conditions.activity_uom = ILike(doc.activity_uom)
    if (doc.year) {
      conditions.year = ILike(doc.year)
    } else {
      if (doc.from_year && doc.thru_year) {
        conditions.year = Between(doc.from_year, doc.thru_year)
      } else if (doc.from_year) {
        conditions.year = MoreThanOrEqual(doc.from_year)
      } else if (doc.thru_year) {
        conditions.year = LessThanOrEqual(doc.thru_year)
      }
    }
    if (doc.division_id) conditions.division_id = ILike(doc.division_id)
    if (doc.division_type) conditions.division_type = ILike(doc.division_type)
    return conditions
  }


  private addYearConditionsToQueryBuilder = (
      {from_year, thru_year}:{from_year?: string, thru_year?: string},
      queryBuilder: SelectQueryBuilder<EmissionsFactor> | SelectQueryBuilder<UtilityLookupItem>
  ) => {
    if (from_year && thru_year) {
      queryBuilder.andWhere("year BETWEEN :from_year AND :thru_year", {from_year, thru_year})
    } else if (from_year) {
      queryBuilder.andWhere("year >= :from_year", {from_year})
    } else if (thru_year) {
      queryBuilder.andWhere("year <= :thru_year", {thru_year})
    }
    return queryBuilder
  }

  public checkActivityAndFactorMatches = (
    activity: Partial<ActivityInterface>,
    doc: EmissionsFactorInterface
  ): boolean => {
    if (doc.class !== EMISSIONS_FACTOR_CLASS_IDENTIFER) return false
    if (activity.scope && doc.scope?.toUpperCase() !== activity.scope.toUpperCase()) return false
    if (activity.level_1 && doc.level_1?.toUpperCase() !== activity.level_1.toUpperCase()) return false
    if (activity.level_2 && doc.level_2?.toUpperCase() !== activity.level_2.toUpperCase()) return false
    if (activity.level_3 && doc.level_3?.toUpperCase() !== activity.level_3.toUpperCase()) return false
    if (activity.level_4 && doc.level_4?.toUpperCase() !== activity.level_4.toUpperCase()) return false
    if (activity.text && doc.text?.toUpperCase() !== activity.text.toUpperCase()) return false
    if (activity.activity_uom && doc.activity_uom?.toUpperCase() !== activity.activity_uom.toUpperCase()) return false
    return true
  }

  public putEmissionFactor = async (doc: EmissionsFactorInterface) => {
    // cleanup any existing record matching the scope/l1/../l4/text/activity_uom and year
    const repo = this._db.getRepository(EmissionsFactor)
    await repo.delete(this.makeEmissionFactorMatchCondition(doc))
    await repo.save(doc)
  }

  public getEmissionFactor = async (uuid: string): Promise<EmissionsFactorInterface | null> => {
    return await this._db.getRepository(EmissionsFactor).findOneBy({uuid})
  }


  public getAllFactors = async (): Promise<EmissionsFactorInterface[]> => {
    return await this._db.getRepository(EmissionsFactor).find()
  }

  public countAllFactors = async (): Promise<number> => {
    return await this._db.getRepository(EmissionsFactor).count()
  }

  public getEmissionsFactorsByDivision = async (
    divisionID: string,
    divisionType: string,
    year?: number
  ): Promise<EmissionsFactorInterface[]> => {
    const maxYearLookup = 5 // if current year not found, try each preceding year up to this many times
    let retryCount = 0
    let results: EmissionsFactorInterface[] = []
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
      retryCount++
    }
    if (results.length === 0) {
      throw new Error(`failed to get Utility Emissions Factors By division ${divisionID}, division type ${divisionType}`)
    }
    return results
  }


  // used by recordEmissions
  public getEmissionsFactorByLookupItem = async (
    lookup: UtilityLookupItemInterface,
    thruDate: string
  ): Promise<EmissionsFactorInterface> => {
    const hasStateData = lookup.state_province !== ""
    const isNercRegion = lookup.divisions?.division_type.toLowerCase() === "nerc_region"
    const isNonUSCountry = lookup.divisions?.division_type.toLowerCase() === "country" && lookup.divisions?.division_id.toLowerCase() !== "usa"
    let divisionID: string
    let divisionType: string
    let year: number | undefined
    if (hasStateData && lookup.state_province) {
      divisionID = lookup.state_province
      divisionType = "STATE"
    } else if (isNercRegion && lookup.divisions?.division_id) {
      divisionID = lookup.divisions?.division_id
      divisionType = lookup.divisions?.division_type
    } else if (isNonUSCountry && lookup.divisions?.division_id) {
      divisionID = lookup.divisions?.division_id
      divisionType = "Country"
    } else {
      divisionID = "USA"
      divisionType = "Country"
    }

    try {
      year = getYearFromDate(thruDate)
    } catch (error) {
      console.error("could not fetch year")
      console.error(error)
      year = undefined
    }

    console.log("fetching utilityFactors")
    const utilityFactors = await this.getEmissionsFactorsByDivision(
      divisionID,
      divisionType,
      year
    )

    if (utilityFactors.length === 0) {
      throw new Error("No utility emissions factor found for given query")
    }
    return utilityFactors[0]
  }

  public getEmissionsFactorsLevel1s = async (query: Pick<EmissionsFactorInterface, 'scope'>): Promise<string[]> => {
    const res = await this._db.getRepository(EmissionsFactor)
      .createQueryBuilder()
      .select('EmissionsFactor.level_1')
      .where(query)
      .distinct(true)
      .orderBy({ level_1: 'ASC' })
      .getRawMany()
    // comes from the Raw query, note: must use raw to not have uuid per record (distinct level_1)
    return res.map(e=>e.EmissionsFactor_level_1)
  }
  public getEmissionsFactorsLevel2s = async (query: Pick<EmissionsFactorInterface, 'scope' | 'level_1'>): Promise<string[]> => {
    const res = await this._db.getRepository(EmissionsFactor)
      .createQueryBuilder()
      .select('EmissionsFactor.level_2')
      .where(query)
      .distinct(true)
      .orderBy({ level_2: 'ASC' })
      .getRawMany()
    // comes from the Raw query, note: must use raw to not have uuid per record (distinct level_1)
    return res.map(e=>e.EmissionsFactor_level_2)
  }
  public getEmissionsFactorsLevel3s = async (query: Pick<EmissionsFactorInterface, 'scope' | 'level_1' | 'level_2'>): Promise<string[]> => {
    const res = await this._db.getRepository(EmissionsFactor)
      .createQueryBuilder()
      .select('EmissionsFactor.level_3')
      .where(query)
      .distinct(true)
      .orderBy({ level_3: 'ASC' })
      .getRawMany()
    // comes from the Raw query, note: must use raw to not have uuid per record (distinct level_1)
    return res.map(e=>e.EmissionsFactor_level_3)
  }
  public getEmissionsFactorsLevel4s = async (query: Pick<EmissionsFactorInterface, 'scope' | 'level_1' | 'level_2' | 'level_3'>): Promise<string[]> => {
    const res = await this._db.getRepository(EmissionsFactor)
      .createQueryBuilder()
      .select('EmissionsFactor.level_4')
      .where(query)
      .distinct(true)
      .orderBy({ level_4: 'ASC' })
      .getRawMany()
    // comes from the Raw query, note: must use raw to not have uuid per record (distinct level_1)
    return res.map(e=>e.EmissionsFactor_level_4)
  }
  public getElectricityCountries = async (query: Pick<EmissionsFactorInterface, 'scope' | 'from_year' | 'thru_year'>): Promise<string[]> => {
    // we do not want to use WTT, instead will use UNITED STATES and the country from
    // level_1="EEA EMISSIONS FACTORS" -> level 2
    const qb = this._db.getRepository(EmissionsFactor)
      .createQueryBuilder()
      .select('EmissionsFactor.level_2')
      .where(query)
      .andWhere({level_1: 'EEA EMISSIONS FACTORS'})
      .distinct(true)
      .orderBy({ level_2: 'ASC' })
    const res = await this.addYearConditionsToQueryBuilder(query, qb).getRawMany()
    // comes from the Raw query, note: must use raw to not have uuid per record (distinct values)
    return res.map(e=>e.EmissionsFactor_level_2).concat(['UNITED STATES'])
  }
  public getElectricityUSAStates = async (): Promise<string[]> => {
    const res = await this._db.getRepository(UtilityLookupItem)
      .createQueryBuilder()
      .select('UtilityLookupItem.state_province')
      .where({country: 'USA'})
      .distinct(true)
      .orderBy({ state_province: 'ASC' })
      .getRawMany()
    // comes from the Raw query, note: must use raw to not have uuid per record (distinct level_1)
    return res.map(e=>e.UtilityLookupItem_state_province)
  }
  public getElectricityUSAUtilities = async (query: Pick<UtilityLookupItem, 'state_province'> & {from_year?: string, thru_year?: string}): Promise<UtilityLookupItem[]> => {
    // handle from_year / thru_year
    // query all the utilities for the state
    // group entries by utility name
    // then filter based on the year
    //   if utility has multiple results, return latest matching entry
    //   if utility has no matching result, return the latest entry
    const utilities = await this._db.getRepository(UtilityLookupItem)
      .createQueryBuilder()
      .where({country: 'USA'})
      .andWhere({state_province: query.state_province})
      .orderBy({ utility_name: 'ASC', year: 'DESC' })
      .getMany()

    // group utilities by utility name
    const groupedUtilities = utilities.reduce((acc: Record<string, UtilityLookupItem[]>, utility) => {
      if (!utility.utility_name) return acc;
      if (!acc[utility.utility_name]) {
        acc[utility.utility_name] = []
      }
      acc[utility.utility_name].push(utility)
      return acc
    }, {});

    // for each group get the utility that matches from_year and thru_year
    // or if no matches, get the last utility
    const filteredUtilities = Object.keys(groupedUtilities).map(utilityName => {
      const utilities = groupedUtilities[utilityName]
      const filteredUtility = utilities.filter(utility => {
        if (!utility.year) return true;
        const fromYear = query.from_year ? parseInt(query.from_year) : 0;
        const thruYear = query.thru_year ? parseInt(query.thru_year) : 0;
        const utilityYear = parseInt(utility.year);
        if (fromYear && thruYear) {
          return utilityYear >= fromYear && utilityYear <= thruYear
        } else if (fromYear) {
          return utilityYear >= fromYear
        } else if (thruYear) {
          return utilityYear <= thruYear
        }
        return true
      })
      // return utility for the most recent year
      if (filteredUtility.length > 0) {
        return filteredUtility[0]
      } else {
        return utilities[utilities.length - 1]
      }
    })

    return filteredUtilities;
  }

  /** Does a simple query matching all the give fields. */
  public getEmissionsFactorsSimple = async (query: Partial<EmissionsFactorInterface>): Promise<EmissionsFactorInterface[]> => {

    return await this._db.getRepository(EmissionsFactor)
      .find({order: { year: "DESC" }, where: this.makeEmissionFactorMatchWhereCondition(query)})
  }

  /** Like getEmissionsFactorsSimple but falls back to the last year of data. */
  public getEmissionsFactors = async (query: Partial<EmissionsFactorInterface>, fallback?: Partial<EmissionsFactorInterface>): Promise<EmissionsFactorInterface[]> => {

    let factors = await this._db.getRepository(EmissionsFactor)
      .find({order: { year: "DESC" }, where: this.makeEmissionFactorMatchWhereCondition(query)})

    if (factors.length === 0 ) {
      if (query.year || query.from_year || query.thru_year) {
        // get factors for last year
        let lastYear;
        if (query.level_1) {
          lastYear = await this.getEmissionsFactorLastYear(query.level_1)
        }

        if (lastYear) {
          query.year = lastYear
          query.from_year = undefined
          query.thru_year = undefined

          factors = await this._db.getRepository(EmissionsFactor)
            .find({order: { year: "DESC" }, where: this.makeEmissionFactorMatchWhereCondition(query)})
        }
      }
    }
    // if still no results, use the fallback query if given
    if (factors.length === 0 && fallback) {
      return await this.getEmissionsFactors(fallback)
    }
    return factors
  }

  public getEmissionsFactorByScope = async (scope: string): Promise<EmissionsFactorInterface[]> => {
    return this.getEmissionsFactors({scope})
  }

  public getCO2EmissionFactor = (
    factor: EmissionsFactorInterface,
    usage: number,
    usageUOM: string
  ): CO2EmissionFactorInterface => {
    // Note: EmissionsFactore defines the emissions as [co2_equivalent_emissions, co2_equivalent_emissions_uom] per [1 activity_uom]
    // so emissionsValue = usage * factor.co2_equivalent_emissions * (usageUOM in factor.activity_uom)
    // and emissionsUOM = factor.co2_equivalent_emissions_uom
    if (!factor.co2_equivalent_emissions || !factor.co2_equivalent_emissions_uom) {
      throw new Error(`EmissionsFactor ${factor.uuid} has no CO2 equivalent emissions`)
    }

    // initialize return variables
    const emissionsUOM: string = factor.co2_equivalent_emissions_uom
    let renewable_energy_use_amount = 0
    let nonrenewable_energy_use_amount = usage

    const usageFactor = getUomFactor(usageUOM)
    const emissionsFactor = getUomFactor(emissionsUOM)
    const usageUOMConversion = usageFactor / emissionsFactor
    const emissionsValue = usage * usageUOMConversion

    // calculate emissions using percent_of_renewables if found
    if (factor.percent_of_renewables && factor.percent_of_renewables.length !== 0) {
      const percentOfRenewables = Number(factor.percent_of_renewables) / 100
      renewable_energy_use_amount = usage * percentOfRenewables
      nonrenewable_energy_use_amount = usage * (1 - percentOfRenewables)
    }

    return {
      emission: {
        value: emissionsValue,
        uom: emissionsUOM,
      },
      division_type: factor.division_type,
      division_id: factor.division_id,
      renewable_energy_use_amount,
      nonrenewable_energy_use_amount,
      year: Number(factor.year),
    }
  }

  public getCO2EmissionByActivity = async (
    activity: ActivityInterface
  ): Promise<CO2EmissionFactorInterface> => {
    const factors = await this.getEmissionsFactors(activity)
    if (!factors || !factors.length) {
      throw new Error(
        `${ErrInvalidFactorForActivity} No emission factor matches the given activity`
      )
    }
    if (factors.length > 1) {
      // throw an error if there are multiple factors that have different scope/l1/l2/l3/l4/text/activity_uom
      const keys = factors.reduce((p: Record<string,number>,c)=>{
        const k = `${c.scope}/${c.level_1}/${c.level_2}/${c.level_3}/${c.level_4}/${c.text}/${c.activity_uom}`
        p[k] ? p[k]++ : p[k] = 1
        return p
      }, {})
      if (keys.length > 1) {
        throw new Error(
          `${ErrInvalidFactorForActivity} More than one factor matched the given activity: ` + JSON.stringify(factors)
        )
      }
      // else return the most recent one by year
      const f = factors.reduce((p,c)=>{
        if (c.year && p.year && parseInt(c.year) > parseInt(p.year)) return c
        return p
      }, factors[0])
      return this.getCO2EmissionFactorByActivity(f, activity)

    }
    return this.getCO2EmissionFactorByActivity(factors[0], activity)
  }

  public getCO2EmissionFactorByActivity = async (
    factor: EmissionsFactorInterface,
    activity: ActivityInterface
  ): Promise<CO2EmissionFactorInterface> => {
    // initialize return variables
    let emissionsValue: number
    const emissionsUOM = "kg"

    const activityMatches = this.checkActivityAndFactorMatches(activity, factor)

    const isTonneKmUsed = factor.activity_uom == "tonne.km" && activity.tonnesShipped !== undefined
    const isPassengerKmUsed = factor.activity_uom == "passenger.km" && activity.passengers !== undefined

    // Check if activity matches the emissions factor
    if (activityMatches) {
      if (!factor.co2_equivalent_emissions) {
        throw new Error('This emissions factor does not have a co2_equivalent_emissions')
      }
      if (
        factor.activity_uom !== "tonne.km" &&
        activity.activity_uom !== "passenger.km"
      ) {
        emissionsValue = activity.activity * parseFloat(factor.co2_equivalent_emissions)
      } else if (isTonneKmUsed && activity.tonnesShipped) {
        emissionsValue =
          activity.activity *
          activity.tonnesShipped *
          parseFloat(factor.co2_equivalent_emissions)
      } else if (isPassengerKmUsed && activity.passengers) {
        emissionsValue =
          activity.activity *
          activity.passengers *
          parseFloat(factor.co2_equivalent_emissions)
      } else {
        throw new Error(
          `${ErrInvalidFactorForActivity} This emissions factor does not match the given activity`
        )
      }
      return {
        emission: {
          value: emissionsValue,
          uom: emissionsUOM,
        },
        year: Number(factor.year),
      }
    } else {
      throw new Error(
        `${ErrInvalidFactorForActivity} This emissions factor does not match the given activity`
      )
    }
  }

  public getEmissionsFactorLastYear = async (factorType: string): Promise<string | undefined> => {
    const res = await this._db.getRepository(EmissionsFactor)
      .createQueryBuilder()
      .select('EmissionsFactor.level_1, EmissionsFactor.year')
      .where('EmissionsFactor.level_1 = :factorType', {factorType})
      .groupBy('EmissionsFactor.level_1')
      .addGroupBy('EmissionsFactor.year')
      .orderBy({ level_1: 'ASC', year: 'DESC' })
      .getRawMany()

    if (res && res.length) {
      return res[0].year
    }
  }
}
