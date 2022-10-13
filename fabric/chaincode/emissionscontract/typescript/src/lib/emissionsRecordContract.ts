import { MD5, SHA256 } from 'crypto-js';
import { ChaincodeStub } from 'fabric-shim';
import { EmissionRecordState, EmissionsRecord, EmissionsRecordInterface } from './emissions';
//import { CO2EmissionFactorInterface } from '@blockchain-carbon-accounting/emissions_data_lib';
import { CO2EmissionFactorInterface } from './emissions_data/src/emissions-calc';

import fetch from 'node-fetch';
// EmissionsRecordContract : core bushiness logic of emissions record chaincode
export class EmissionsRecordContract {
    protected emissionsState: EmissionRecordState;
    constructor(stub: ChaincodeStub) {
        this.emissionsState = new EmissionRecordState(stub);
    }
    /**
     *
     * Store the emissions record
     * @param endpoint of the emission database
     * @param query name passed to the database
     * @param queryParams
     * @param partyId for the party (company) which buys power from utility
     * @param fromDate date of the time period
     * @param thruDate date of the time period
     */
    /** TO-DO this method used to use utilityID energyUseAmount energyUseUom to get emission record from internal state DB emissiond data
     * It now requests emissinos recrod from external db through oracle service
     * The original params  are now passed as queryParams for use by external db
     * utilityID = uuid
     * energyUseAmount =  usage
     * energyUseAmount = usageUom
     * The EmissionsRecordInterface will need to be updated to handle
     * more general emission record responses retruned by the oracle
     * using the data structure of CO2EmissionFactorInterface
     * i.e., not just utility recrods !!!
     */
    async recordEmissions(
        endpoint: string,
        query: string,
        queryParams: string,
        //utilityId: string,
        partyId: string,
        fromDate: string,
        thruDate: string,
        //energyUseAmount: string,
        //energyUseUom: string,
        url: string,
        md5: string,
    ): Promise<Uint8Array> {
        const emissionApiRequest = JSON.stringify({
            query, //: 'getEmissionsByUtilityLookUpItem'
            queryParams,
        });
        const params = JSON.parse(queryParams);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: emissionApiRequest,
        };

        async function getCO2EmissionFactor(): Promise<CO2EmissionFactorInterface> {
            // TO-DO set oracle proxy url as environment variable
            return fetch(endpoint, options)
                .then((response) => response.json())
                .then((response) => {
                    return response as CO2EmissionFactorInterface;
                });
        }
        const co2Emission = await getCO2EmissionFactor();

        // create an instance of the emissions record
        const uuid = MD5(emissionApiRequest + partyId).toString();
        const partyIdsha256 = SHA256(partyId).toString();

        const emissionI: EmissionsRecordInterface = {
            uuid,
            partyId: partyIdsha256,
            fromDate,
            thruDate,
            emissionsAmount: co2Emission?.emission?.value,
            renewableEnergyUseAmount: co2Emission?.renewable_energy_use_amount,
            nonrenewableEnergyUseAmount: co2Emission?.nonrenewable_energy_use_amount,
            utilityId: params?.uuid,
            energyUseUom: params?.usageUOM,
            factorSource: emissionApiRequest,
            url,
            md5,
            tokenId: null,
        };
        const emission = new EmissionsRecord(emissionI);
        await this.emissionsState.addEmissionsRecord(emission, uuid);
        return emission.toBuffer();
    }

    async updateEmissionsRecord(recordI: EmissionsRecordInterface): Promise<Uint8Array> {
        if (recordI.partyId) {
            recordI.partyId = SHA256(recordI.partyId).toString();
        }
        const record = new EmissionsRecord(recordI);
        await this.emissionsState.updateEmissionsRecord(record, recordI.uuid || '');
        return record.toBuffer();
    }
    async updateEmissionsMintedToken(
        tokenId: string,
        partyId: string,
        uuids: string[],
    ): Promise<Uint8Array> {
        for (const uuid of uuids) {
            const record = await this.emissionsState.getEmissionsRecord(uuid);
            record.record.tokenId = tokenId;
            record.record.partyId = SHA256(partyId).toString();
            await this.emissionsState.updateEmissionsRecord(record, uuid);
        }
        const out = {
            keys: uuids,
        };
        return Buffer.from(JSON.stringify(out));
    }
    async getEmissionsData(uuid: string): Promise<Uint8Array> {
        const record = await this.emissionsState.getEmissionsRecord(uuid);
        return record.toBuffer();
    }
    async getValidEmissions(uuids: string[]): Promise<Uint8Array> {
        const validEmissions: EmissionsRecordInterface[] = [];
        const validUUIDS: string[] = [];
        for (const uuid of uuids) {
            const emission = await this.emissionsState.getEmissionsRecord(uuid);
            if (emission.record.tokenId !== null) {
                continue;
            }
            validEmissions.push(emission.record);
            validUUIDS.push(emission.record.uuid || '');
        }
        const output = {
            keys: validUUIDS,
            output_to_client: Buffer.from(JSON.stringify(validEmissions)).toString('base64'),
            output_to_store: {
                validUUIDs: Buffer.from(JSON.stringify(validUUIDS)).toString('base64'),
            },
        };
        return Buffer.from(JSON.stringify(output));
    }

    async getAllEmissionsData(utilityId: string, partyId: string): Promise<Uint8Array> {
        const partyIdsha256 = SHA256(partyId).toString();
        const records = await this.emissionsState.getAllEmissionRecords(utilityId, partyIdsha256);
        return Buffer.from(JSON.stringify(records));
    }
    async getAllEmissionsDataByDateRange(fromDate: string, thruDate: string): Promise<Uint8Array> {
        const records = await this.emissionsState.getAllEmissionsDataByDateRange(
            fromDate,
            thruDate,
        );
        return Buffer.from(JSON.stringify(records));
    }
    async getAllEmissionsDataByDateRangeAndParty(
        fromDate: string,
        thruDate: string,
        partyId: string,
    ): Promise<Uint8Array> {
        const partyIdsha256 = SHA256(partyId).toString();
        const records = await this.emissionsState.getAllEmissionsDataByDateRangeAndParty(
            fromDate,
            thruDate,
            partyIdsha256,
        );
        return Buffer.from(JSON.stringify(records));
    }
}
