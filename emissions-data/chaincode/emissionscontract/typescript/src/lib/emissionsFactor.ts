/*
    SPDX-License-Identifier: Apache-2.0
*/
/**
 * The release of GHG into the atmosphere depends mainly on the activity and the product.
 * In order to estimate GHG emissions per unit of available activity,
 * we need to use a factor called emission factor (EF).
 */

/* tslint:disable:max-classes-per-file */
import { ChaincodeStub } from 'fabric-shim';
import { ErrStateNotFound } from '../util/const';
import { State } from '../util/state';
import { QueryResult, WorldState } from '../util/worldstate';
import { getYearFromDate } from './emissions-calc';
import { UtilityLookupItemInterface } from './utilityLookupItem';

export const EMISSIONS_FACTOR_CLASS_IDENTIFER =
    'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem';

export interface EmissionsFactorInterface {
    class: string;
    key?: string;
    uuid: string;
    type: string;
    scope?: string;
    level_1: string;
    level_2: string;
    level_3: string;
    level_4?: string;
    text?: string;
    year?: string;
    from_year?: string;
    thru_year?: string;
    country?: string;
    division_type?: string;
    division_id?: string;
    division_name?: string;
    activity_uom?: string;
    net_generation?: string;
    net_generation_uom?: string;
    co2_equivalent_emissions?: string;
    co2_equivalent_emissions_uom?: string;
    source?: string;
    non_renewables?: string;
    renewables?: string;
    percent_of_renewables?: string;
}

export class EmissionsFactor extends State {
    factor: EmissionsFactorInterface;
    constructor(_factor: EmissionsFactorInterface) {
        super([
            _factor.uuid,
            _factor.year || '',
            _factor.division_type || '',
            _factor.division_id || '',
        ]);
        this.factor = _factor;
        this.factor.class = EMISSIONS_FACTOR_CLASS_IDENTIFER;
        this.factor.key = this.getKey();
    }
    toBuffer(): Uint8Array {
        return State.serialize<EmissionsFactorInterface>(this.factor);
    }
    fromBuffer(buf: Uint8Array): EmissionsFactor {
        return new EmissionsFactor(State.deserialize<EmissionsFactorInterface>(buf));
    }
}

export class EmissionsFactorState extends WorldState<EmissionsFactorInterface> {
    constructor(stub: ChaincodeStub) {
        super(stub);
    }
    async addEmissionsFactor(factor: EmissionsFactor, uuid: string): Promise<void> {
        return await this.addState(uuid, factor.factor);
    }
    async getEmissionsFactor(uuid: string): Promise<EmissionsFactor> {
        return new EmissionsFactor(await this.getState(uuid));
    }
    async updateEmissionsFactor(factor: EmissionsFactor, uuid: string): Promise<void> {
        return await this.updateState(uuid, factor.factor);
    }
    async getEmissionsFactorsByDivision(
        divisionID: string,
        divisionType: string,
        year?: number,
    ): Promise<QueryResult<EmissionsFactorInterface>[]> {
        const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
        let retryCount = 0;
        let queryString = '';
        let results: QueryResult<EmissionsFactorInterface>[] = [];
        while (results.length === 0 && retryCount <= maxYearLookup) {
            if (year !== undefined) {
                queryString = `{
                "selector" : {
                  "class": {
                     "$eq": "${EMISSIONS_FACTOR_CLASS_IDENTIFER}"
                  },
                  "division_id" : {
                    "$eq": "${divisionID}"
                  },
                  "division_type": {
                    "$eq": "${divisionType}"
                  },
                  "year": {
                    "$eq": "${year + retryCount * -1}"
                }
                }
              }`;
            } else {
                queryString = `{
            "selector" : {
              "class": {
                 "$eq": "${EMISSIONS_FACTOR_CLASS_IDENTIFER}"
              },
              "division_id" : {
                "$eq": "${divisionID}"
              },
              "division_type": {
                "$eq": "${divisionType}"
              }
            }
          }`;
            }
            const iterator = await this.stub.getQueryResult(queryString);
            results = await this.getAssetFromIterator(iterator);
            retryCount++;
        }
        if (results.length === 0) {
            throw new Error(
                `${ErrStateNotFound} : failed to get Utility Emissions Factors By division`,
            );
        }
        return results;
    }

    // used by recordEmissions
    async getEmissionsFactorByLookupItem(
        lookup: UtilityLookupItemInterface,
        thruDate: string,
    ): Promise<EmissionsFactor> {
        const hasStateData = lookup.state_province !== '';
        const isNercRegion = lookup.divisions?.division_type.toLowerCase() === 'nerc_region';
        const isNonUSCountry =
            lookup.divisions?.division_type.toLowerCase() === 'country' &&
            lookup.divisions?.division_id.toLowerCase() !== 'usa';
        let divisionID: string;
        let divisionType: string;
        let year: number | undefined = undefined;
        if (hasStateData) {
            divisionID = lookup.state_province || '';
            divisionType = 'STATE';
        } else if (isNercRegion) {
            divisionID = lookup.divisions?.division_id || '';
            divisionType = lookup.divisions?.division_type || '';
        } else if (isNonUSCountry) {
            divisionID = lookup.divisions?.division_id || '';
            divisionType = 'Country';
        } else {
            divisionID = 'USA';
            divisionType = 'Country';
        }

        try {
            year = getYearFromDate(thruDate);
        } catch (error) {
            console.error('could not fetch year');
            console.error(error);
        }

        console.log('fetching utilityFactors');
        const utilityFactors = await this.getEmissionsFactorsByDivision(
            divisionID,
            divisionType,
            year,
        );
        console.log(utilityFactors);
        if (utilityFactors.length === 0) {
            throw new Error('No utility emissions factor found for given query');
        }
        return new EmissionsFactor(utilityFactors[0].Record);
    }
}
