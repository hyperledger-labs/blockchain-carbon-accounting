// configuration required before running the tests
import { FabricSigningCredential } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import axios from 'axios';
// import { execSync } from 'child_process';
import { config } from 'dotenv';
import BCGatewayConfig from '../src/blockchain-gateway-lib/config';
config();

import type {
    EmissionsFactorInterface,
    UtilityLookupItemInterface,
} from '@blockchain-carbon-accounting/emissions_data_lib';
import {
    PostgresDBService,
    parseCommonYargsOptions,
} from '@blockchain-carbon-accounting/data-postgres';

import { v4 as uuidv4 } from 'uuid';

import { mockUtilityID, mockUtilityID2 } from './constants';

const bcConfig = new BCGatewayConfig();

// insert mock utility identifier and factors
async function mockEmissionsRecord() {
    console.log('mockEmissionsRecord...');
    const signer: FabricSigningCredential = {
        keychainId: 'inMemoryKeychain',
        keychainRef: 'admin',
    };
    const org = bcConfig.fabricConnector();
    const hlfConnector = org.connector;

    // enroll admin
    console.log('Enroll admin ...');
    await hlfConnector.enroll(signer, {
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw',
        caId: org.caID,
        mspId: org.orgMSP,
    });
}

async function setupVault() {
    const endpoint = process.env.VAULT_ENDPOINT;
    const adminToken = 'tokenId';
    const transitPath = '/transit';
    const kvPath = '/secret';
    await axios.post(
        endpoint + '/v1/sys/mounts' + transitPath,
        {
            type: 'transit',
        },
        {
            headers: {
                'X-Vault-Token': adminToken,
            },
        },
    );
    await axios.post(
        endpoint + '/v1' + transitPath + '/keys/admin',
        {
            type: 'ecdsa-p256',
        },
        {
            headers: {
                'X-Vault-Token': adminToken,
            },
        },
    );
    await axios.post(
        endpoint + '/v1' + kvPath + '/data/eth-admin',
        {
            data: {
                value: {
                    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
                    private: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                },
            },
        },
        {
            headers: {
                'X-Vault-Token': adminToken,
            },
        },
    );
}

async function addTestEmissionsFactor(efl: EmissionsFactorInterface, db: PostgresDBService) {
    await db.getEmissionsFactorRepo().putEmissionFactor({ ...efl });
}

async function addUtilityLookupItem(uli: UtilityLookupItemInterface, db: PostgresDBService) {
    await db.getUtilityLookupItemRepo().putUtilityLookupItem(uli);
}

async function setupTestPg() {
    // import utility identifier
    console.log(
        'Import UtilityIdentifiers and EmissionsFactors into postgres DB blockchain-carbon-accounting-test...',
    );
    const db = await PostgresDBService.getInstance(
        parseCommonYargsOptions({
            dbname: 'blockchain-carbon-accounting-test',
            dbuser: process.env.POSTGRES_USER || '',
            dbpassword: process.env.POSTGRES_PASSWORD || '',
            dbport: process.env.POSTGRES_PORT,
        }),
    );
    await addUtilityLookupItem(
        {
            uuid: mockUtilityID,
            class: 'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist',
            year: '2019',
            utility_number: '11208',
            utility_name: 'Los Angeles Department of Water & Power',
            country: 'USA',
            state_province: 'CA',
            divisions: { division_type: 'NERC_REGION', division_id: 'WECC' },
        },
        db,
    );

    await addUtilityLookupItem(
        {
            uuid: mockUtilityID2,
            class: 'org.hyperledger.blockchain-carbon-accounting.utilitylookuplist',
            year: '2019',
            utility_number: '1',
            utility_name: 'RWE AG',
            country: 'DE',
            state_province: '',
            divisions: { division_type: 'Country', division_id: 'Germany' },
        },
        db,
    );

    await addTestEmissionsFactor(
        {
            uuid: uuidv4(),
            class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
            type: 'EMISSIONS_ELECTRICITY',
            scope: 'SCOPE 2',
            level_1: 'eGRID EMISSIONS FACTORS',
            level_2: 'USA',
            level_3: 'STATE: CA',
            year: '2019',
            country: 'USA',
            division_type: 'STATE',
            division_id: 'CA',
            division_name: 'California',
            activity_uom: 'MWH',
            net_generation: '201747828.474',
            net_generation_uom: 'MWH',
            co2_equivalent_emissions: '0.19359146878269065',
            co2_equivalent_emissions_uom: 'tons',
        },
        db,
    );
    await addTestEmissionsFactor(
        {
            uuid: uuidv4(),
            class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
            type: 'EMISSIONS_ELECTRICITY',
            scope: 'SCOPE 2',
            level_1: 'eGRID EMISSIONS FACTORS',
            level_2: 'USA',
            level_3: 'STATE: CA',
            year: '2018',
            country: 'USA',
            division_type: 'STATE',
            division_id: 'CA',
            division_name: 'California',
            activity_uom: 'MWH',
            net_generation: '195212859.582',
            net_generation_uom: 'MWH',
            co2_equivalent_emissions: '0.21101443649872265',
            co2_equivalent_emissions_uom: 'tons',
        },
        db,
    );
    await addTestEmissionsFactor(
        {
            uuid: uuidv4(),
            class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
            type: 'EMISSIONS_ELECTRICITY',
            scope: 'SCOPE 2',
            level_1: 'eGRID EMISSIONS FACTORS',
            level_2: 'USA',
            level_3: 'STATE: CA',
            year: '2020',
            country: 'USA',
            division_type: 'STATE',
            division_id: 'CA',
            division_name: 'California',
            activity_uom: 'MWH',
            net_generation: '192954153.405',
            net_generation_uom: 'MWH',
            co2_equivalent_emissions: '0.2265591892870195',
            co2_equivalent_emissions_uom: 'tons',
        },
        db,
    );
    await addTestEmissionsFactor(
        {
            uuid: uuidv4(),
            class: 'org.hyperledger.blockchain-carbon-accounting.emissionsfactoritem',
            type: 'EMISSIONS_ELECTRICITY',
            scope: 'SCOPE 2',
            level_1: 'eGRID EMISSIONS FACTORS',
            level_2: 'Germany',
            level_3: 'Country: DE',
            year: '2019',
            country: 'Germany',
            division_type: 'Country',
            division_id: 'Germany',
            division_name: 'Germany',
            activity_uom: 'MWH',
            net_generation: '1',
            net_generation_uom: 'MWH',
            co2_equivalent_emissions: '338',
            co2_equivalent_emissions_uom: 'g',
        },
        db,
    );
}

(async () => {
    try {
        // TODO use promise.all
        await Promise.all([mockEmissionsRecord(), setupVault(), setupTestPg()]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
