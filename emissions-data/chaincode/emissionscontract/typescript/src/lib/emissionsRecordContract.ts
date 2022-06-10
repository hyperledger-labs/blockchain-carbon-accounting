import { MD5, SHA256 } from 'crypto-js';
import { ChaincodeStub } from 'fabric-shim';
import { EmissionRecordState, EmissionsRecord, EmissionsRecordInterface } from './emissions';
import { getCO2EmissionFactor } from './emissions-calc';
import { EmissionsFactor, EmissionsFactorInterface, EmissionsFactorState } from './emissionsFactor';
import {
    UtilityLookupItem,
    UtilityLookupItemInterface,
    UtilityLookupItemState,
} from './utilityLookupItem';

// EmissionsRecordContract : core bushiness logic of emissions record chaincode
export class EmissionsRecordContract {
    protected emissionsState: EmissionRecordState;
    protected EmissionsFactorState: EmissionsFactorState;
    protected utilityLookupState: UtilityLookupItemState;
    constructor(stub: ChaincodeStub) {
        this.emissionsState = new EmissionRecordState(stub);
        this.EmissionsFactorState = new EmissionsFactorState(stub);
        this.utilityLookupState = new UtilityLookupItemState(stub);
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
        // get emissions factors from eGRID database; convert energy use to emissions factor UOM; calculate energy use
        const lookup = await this.utilityLookupState.getUtilityLookupItem(utilityId);
        const factor = await this.EmissionsFactorState.getEmissionsFactorByLookupItem(
            lookup.item,
            thruDate,
        );
        const co2Emission = getCO2EmissionFactor(
            factor.factor,
            Number(energyUseAmount),
            energyUseUom,
        );

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
    async importUtilityFactor(factorI: EmissionsFactorInterface): Promise<Uint8Array> {
        const factor = new EmissionsFactor(factorI);
        await this.EmissionsFactorState.addEmissionsFactor(factor, factorI.uuid);
        return factor.toBuffer();
    }
    async updateUtilityFactor(factorI: EmissionsFactorInterface): Promise<Uint8Array> {
        const factor = new EmissionsFactor(factorI);
        await this.EmissionsFactorState.updateEmissionsFactor(factor, factorI.uuid);
        return factor.toBuffer();
    }
    async getUtilityFactor(uuid: string): Promise<Uint8Array> {
        return (await this.EmissionsFactorState.getEmissionsFactor(uuid)).toBuffer();
    }
    async importUtilityIdentifier(
        lookupInterface: UtilityLookupItemInterface,
    ): Promise<Uint8Array> {
        const lookup = new UtilityLookupItem(lookupInterface);
        await this.utilityLookupState.addUtilityLookupItem(lookup, lookupInterface.uuid);
        return lookup.toBuffer();
    }
    async updateUtilityIdentifier(
        lookupInterface: UtilityLookupItemInterface,
    ): Promise<Uint8Array> {
        const lookup = new UtilityLookupItem(lookupInterface);
        await this.utilityLookupState.updateUtilityLookupItem(lookup, lookupInterface.uuid);
        return lookup.toBuffer();
    }
    async getUtilityIdentifier(uuid: string): Promise<Uint8Array> {
        return (await this.utilityLookupState.getUtilityLookupItem(uuid)).toBuffer();
    }
    async getAllUtilityIdentifiers(): Promise<Uint8Array> {
        const result = await this.utilityLookupState.getAllUtilityLookupItems();
        return Buffer.from(JSON.stringify(result));
    }
}
