import { MD5, SHA256 } from 'crypto-js';
import { ChaincodeStub } from 'fabric-shim';
import { EmissionRecordState, EmissionsRecord, EmissionsRecordInterface } from './emissions';
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
     * @param utilityId for the utility
     * @param partyId for the party (company) which buys power from utility
     * @param fromDate date of the time period
     * @param thruDate date of the time period
     * @param energyUseAmount usage amount
     * @param energyUseUom UOM of energy usage amount -- ie kwh
     */
    async recordEmissions(
        utilityId: string,
        partyId: string,
        fromDate: string,
        thruDate: string,
        energyUseAmount: string,
        energyUseUom: string,
        url: string,
        md5: string,
    ): Promise<Uint8Array> {
        const emissionapirequest = {
            uuid: utilityId,
            thruDate,
            usage: energyUseAmount,
            usageUOM: energyUseUom,
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emissionapirequest),
        };

        async function getCO2EmissionFactor(): Promise<CO2EmissionFactorInterface> {
            return fetch('http://oracle:3002/postgres/uuid', options)
                .then((response) => response.json())
                .then((response) => {
                    return response as CO2EmissionFactorInterface;
                });
        }
        const co2Emission = await getCO2EmissionFactor();
        const factorSource = `eGrid ${co2Emission.year} ${co2Emission.division_type} ${co2Emission.division_id}`;

        // create an instance of the emissions record
        const uuid = MD5(utilityId + partyId + fromDate + thruDate).toString();
        const partyIdsha256 = SHA256(partyId).toString();

        const emissionI: EmissionsRecordInterface = {
            uuid,
            utilityId,
            partyId: partyIdsha256,
            fromDate,
            thruDate,
            emissionsAmount: co2Emission.emission.value,
            renewableEnergyUseAmount: co2Emission.renewable_energy_use_amount,
            nonrenewableEnergyUseAmount: co2Emission.nonrenewable_energy_use_amount,
            energyUseUom,
            factorSource,
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
