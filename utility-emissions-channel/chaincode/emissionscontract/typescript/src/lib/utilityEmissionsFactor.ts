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
import { WorldState } from '../util/worldstate';
import { getYearFromDate } from './emissions-calc';
import { UtilityLookupItemInterface } from './utilityLookupItem';

const UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER =
    'org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactoritem';

export interface UtilityEmissionsFactorInterface {
    class?: string;
    key?: string;
    uuid: string;
    year?: string;
    country?: string;
    division_type?: string;
    division_id?: string;
    division_name?: string;
    net_generation?: string;
    net_generation_uom?: string;
    co2_equivalent_emissions?: string;
    co2_equivalent_emissions_uom?: string;
    source?: string;
    non_renewables?: string;
    renewables?: string;
    percent_of_renewables?: string;
}

export class UtilityEmissionsFactor extends State {
    factor: UtilityEmissionsFactorInterface;
    constructor(_factor: UtilityEmissionsFactorInterface) {
        super([_factor.uuid, _factor.year, _factor.division_type, _factor.division_id]);
        this.factor = _factor;
        this.factor.class = UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER;
        this.factor.key = this.getKey();
    }
    toBuffer(): Uint8Array {
        return State.serialize<UtilityEmissionsFactorInterface>(this.factor);
    }
    fromBuffer(buf: Uint8Array): UtilityEmissionsFactor {
        return new UtilityEmissionsFactor(State.deserialize<UtilityEmissionsFactorInterface>(buf));
    }
}

export class UtilityEmissionsFactorState extends WorldState<UtilityEmissionsFactorInterface> {
    private db;

    constructor(stub: ChaincodeStub, db) {
        super(stub);
        this.db = db;
    }
    async addUtilityEmissionsFactor(factor: UtilityEmissionsFactor, uuid: string): Promise<void> {
        return await this.addState(uuid, factor.factor);
    }
    async getUtilityEmissionsFactor(uuid: string): Promise<UtilityEmissionsFactor> {
        return new UtilityEmissionsFactor(await this.db.get(uuid));
    }
    async updateUtilityEmissionsFactor(
        factor: UtilityEmissionsFactor,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        uuid: string,
    ): Promise<void> {
        return this.db.put(factor.factor);
    }
    async getUtilityEmissionsFactorsByDivision(
        divisionID: string,
        divisionType: string,
        year?: number,
    ): Promise<UtilityEmissionsFactorInterface[]> {
        const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
        let retryCount = 0;
        let results: UtilityEmissionsFactorInterface[] = [];
        while (results.length === 0 && retryCount <= maxYearLookup) {
            if (year !== undefined) {
                results = this.db.query((doc: UtilityEmissionsFactorInterface) => {
                    const isEmissionsFactor = doc.class == UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER;
                    const hasDivisionId = doc.division_id == divisionID;
                    const hasDivisionType = doc.division_type == divisionType;
                    const isOfQueriedYear = doc.year == (year + retryCount * -1).toString();
                    return isEmissionsFactor && hasDivisionId && hasDivisionType && isOfQueriedYear;
                });
            } else {
                results = this.db.query((doc: UtilityEmissionsFactorInterface) => {
                    const isEmissionsFactor = doc.class == UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER;
                    const hasDivisionId = doc.division_id == divisionID;
                    const hasDivisionType = doc.division_type == divisionType;
                    return isEmissionsFactor && hasDivisionId && hasDivisionType;
                });
            }
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
    ): Promise<UtilityEmissionsFactor> {
        const hasStateData = lookup.state_province !== '';
        const isNercRegion = lookup.divisions.division_type.toLowerCase() === 'nerc_region';
        const isNonUSCountry =
            lookup.divisions.division_type.toLowerCase() === 'country' &&
            lookup.divisions.division_id.toLowerCase() !== 'usa';
        let divisionID: string;
        let divisionType: string;
        let year: number;
        if (hasStateData) {
            divisionID = lookup.state_province;
            divisionType = 'STATE';
        } else if (isNercRegion) {
            divisionID = lookup.divisions.division_id;
            divisionType = lookup.divisions.division_type;
        } else if (isNonUSCountry) {
            divisionID = lookup.divisions.division_id;
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
        const utilityFactors = await this.getUtilityEmissionsFactorsByDivision(
            divisionID,
            divisionType,
            year,
        );
        console.log(utilityFactors);
        if (utilityFactors.length === 0) {
            throw new Error('No utility emissions factor found for given query');
        }
        return new UtilityEmissionsFactor(utilityFactors[0]);
    }
}
