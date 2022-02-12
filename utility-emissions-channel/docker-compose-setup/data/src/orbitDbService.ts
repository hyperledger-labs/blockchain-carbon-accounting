import { create } from 'ipfs-http-client';
const OrbitDB = require('orbit-db');
import type DocumentStore from 'orbit-db-docstore';

const DB_NAME = 'org.hyperledger.blockchain-carbon-accounting';
const UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER =
    'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist';
const UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER =
    '/orbitdb/zdpuAm6nPdDuL2wBZspcZgbdKPMCbN8pn3ez8Z3i5A9a1hXwb/org.hyperledger.blockchain-carbon-accounting';

interface DivisionsInterface {
    division_type: string;
    division_id: string;
}

export interface UtilityLookupItemInterface {
    class: string;
    key?: string;
    uuid: string;
    year?: string;
    utility_number?: string;
    utility_name?: string;
    country?: string;
    state_province?: string;
    divisions?: DivisionsInterface;
}

export interface UtilityEmissionsFactorInterface {
    class: string;
    key?: string;
    uuid: string;
    type: string;
    scope: string;
    level_1: string;
    level_2: string;
    level_3: string;
    text?: string;
    year?: string;
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

export const getYearFromDate = (date: string): number => {
    const time = new Date(date);
    if (!time.getFullYear()) {
        throw new Error(`${date} date format not supported`);
    }
    return time.getFullYear();
};

export class OrbitDBService {
    private static _db: DocumentStore<UtilityLookupItemInterface | UtilityEmissionsFactorInterface>;

    public static init = async (): Promise<void> => {
        const ipfs = create();

        const orbitdb = await OrbitDB.createInstance(ipfs as any);
        const dbOptions = {
            // Give write access to the creator of the database
            accessController: {
                type: 'orbitdb',
                write: [orbitdb.id],
            },
            indexBy: 'uuid',
        };

        const db = await orbitdb.docstore(DB_NAME, dbOptions);

        await db.load();

        OrbitDBService._db = db as DocumentStore<
            UtilityLookupItemInterface | UtilityEmissionsFactorInterface
        >;
        console.log(`OrbitDB address: ${db.address.toString()}`);
    };

    public getUtilityLookupItem = (uuid: string): UtilityLookupItemInterface => {
        return OrbitDBService._db.get(uuid)[0];
    };

    public getAllUtilityLookupItems = (): UtilityLookupItemInterface[] => {
        return OrbitDBService._db.query(
            (doc: UtilityLookupItemInterface) => doc.class == UTILITY_LOOKUP_ITEM_CLASS_IDENTIFIER,
        ) as UtilityLookupItemInterface[];
    };

    public updateUtilityLookupItem = (item: UtilityLookupItemInterface): Promise<string> => {
        return OrbitDBService._db.put(item);
    };

    public getUtilityEmissionsFactor = (uuid: string): UtilityEmissionsFactorInterface => {
        return OrbitDBService._db.get(uuid)[0] as UtilityEmissionsFactorInterface;
    };

    public getAllFactors = (): UtilityEmissionsFactorInterface[] => {
        return OrbitDBService._db.get('') as UtilityEmissionsFactorInterface[];
    };

    public updateUtilityEmissionsFactor = (
        factor: UtilityEmissionsFactorInterface,
    ): Promise<string> => {
        return OrbitDBService._db.put(factor);
    };

    public getUtilityEmissionsFactorsByDivision(
        divisionID: string,
        divisionType: string,
        year?: number,
    ): UtilityEmissionsFactorInterface[] {
        const maxYearLookup = 5; // if current year not found, try each preceding year up to this many times
        let retryCount = 0;
        let results: UtilityEmissionsFactorInterface[] = [];
        while (results.length === 0 && retryCount <= maxYearLookup) {
            if (year !== undefined) {
                results = OrbitDBService._db.query((doc: UtilityEmissionsFactorInterface) => {
                    const isEmissionsFactor = doc.class == UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER;
                    const hasDivisionId = doc.division_id == divisionID;
                    const hasDivisionType = doc.division_type == divisionType;
                    const isOfQueriedYear = doc.year == (year + retryCount * -1).toString();
                    return isEmissionsFactor && hasDivisionId && hasDivisionType && isOfQueriedYear;
                }) as UtilityEmissionsFactorInterface[];
            } else {
                results = OrbitDBService._db.query((doc: UtilityEmissionsFactorInterface) => {
                    const isEmissionsFactor = doc.class == UTILITY_EMISSIONS_FACTOR_CLASS_IDENTIFER;
                    const hasDivisionId = doc.division_id == divisionID;
                    const hasDivisionType = doc.division_type == divisionType;
                    return isEmissionsFactor && hasDivisionId && hasDivisionType;
                }) as UtilityEmissionsFactorInterface[];
            }
            retryCount++;
        }
        if (results.length === 0) {
            throw new Error('failed to get Utility Emissions Factors By division');
        }
        return results;
    }

    // used by recordEmissions
    getEmissionsFactorByLookupItem(
        lookup: UtilityLookupItemInterface,
        thruDate: string,
    ): UtilityEmissionsFactorInterface {
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
        const utilityFactors = this.getUtilityEmissionsFactorsByDivision(
            divisionID,
            divisionType,
            year,
        );
        if (utilityFactors.length === 0) {
            throw new Error('No utility emissions factor found for given query');
        }
        return utilityFactors[0];
    }
}
