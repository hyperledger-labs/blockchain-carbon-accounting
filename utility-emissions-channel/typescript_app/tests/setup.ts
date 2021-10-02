// configuration required before running the tests
import BCGatewayConfig from '../src/blockchain-gateway/config';
import {
    FabricContractInvocationType,
    FabricSigningCredential,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import { config } from 'dotenv';
import axios from 'axios';
config();

const bcConfig = new BCGatewayConfig();

// insert mock utility identifier and factors
const mockUtilityID = 'USA_EIA_252522444142552441242521';
async function mockEmissionsRecord() {
    const singer: FabricSigningCredential = {
        keychainId: 'inMemoryKeychain',
        keychainRef: 'admin',
    };
    const org = bcConfig.fabricConnector();
    const hlfConnector = org.connector;

    // enroll admin
    await hlfConnector.enroll(singer, {
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw',
        caId: org.caID,
        mspId: org.orgMSP,
    });
    const channelName = 'utilityemissionchannel';
    const ccName = 'utilityemissions';
    // import utility identifier
    const p1 = hlfConnector.transact({
        signingCredential: singer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityIdentifier',
        params: [
            mockUtilityID,
            '2019',
            '252522444142552441242521',
            'test-utility-name',
            'USA',
            '',
            JSON.stringify({
                division_type: 'NERC_REGION',
                division_id: 'MRO',
            }),
        ],
    });

    // import mock utility factor
    const p2 = hlfConnector.transact({
        signingCredential: singer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityFactor',
        params: [
            'mock-utility-factor',
            '2019',
            'USA',
            'NERC_REGION',
            'MRO',
            'SERC_Reliability_Corporation',
            '46112136.165',
            'MWH',
            '47582155.875',
            'tons',
            'https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip',
            '41078452.268',
            '5033683.71',
            '',
        ],
    });

    await Promise.all([p1, p2]);
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
                value: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            },
        },
        {
            headers: {
                'X-Vault-Token': adminToken,
            },
        },
    );
}

(async () => {
    try {
        // TODO use promise.all
        await mockEmissionsRecord();
        await setupVault();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
