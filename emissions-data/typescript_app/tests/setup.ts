// configuration required before running the tests
import BCGatewayConfig from '../src/blockchain-gateway/config';
import {
    FabricContractInvocationType,
    FabricSigningCredential,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
// import { execSync } from 'child_process';
import { config } from 'dotenv';
import axios from 'axios';
config();

const bcConfig = new BCGatewayConfig();

// insert mock utility identifier and factors
async function mockEmissionsRecord() {
    const signer: FabricSigningCredential = {
        keychainId: 'inMemoryKeychain',
        keychainRef: 'admin',
    };
    const org = bcConfig.fabricConnector();
    const hlfConnector = org.connector;

    // enroll admin
    await hlfConnector.enroll(signer, {
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw',
        caId: org.caID,
        mspId: org.orgMSP,
    });

    const channelName = 'utilityemissionchannel';
    const ccName = 'utilityemissions';
    // import utility identifier
    const mockUtilityID = 'USA_EIA_11208';

    const p1 = hlfConnector.transact({
        signingCredential: signer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityIdentifier',
        params: [
            mockUtilityID,
            '2019',
            '11208',
            'Los Angeles Department of Water & Power',
            'USA',
            '',
            JSON.stringify({
                division_type: 'NERC_REGION',
                division_id: 'WECC',
            }),
        ],
    });

    const p2 = hlfConnector.transact({
        signingCredential: signer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityIdentifier',
        params: [
            'RWE_AG',
            '2019',
            '1',
            'RWE AG',
            'DE',
            '',
            JSON.stringify({
                division_type: 'COUNTRY',
                division_id: 'Germany',
            }),
        ],
    });

    // import mock utility factor
    const p3 = hlfConnector.transact({
        signingCredential: signer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityFactor',
        params: [
            'USA_2018_NERC_REGION_WECC',
            '2018',
            'USA',
            'NERC_REGION',
            'WECC',
            'Western_Electricity_Coordinating_Council',
            '743291275',
            'MWH',
            '288021204',
            'tons',
            'https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip',
            '443147683',
            '300143593',
            '',
        ],
    });

    const p4 = hlfConnector.transact({
        signingCredential: signer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityFactor',
        params: [
            'USA_2019_NERC_REGION_WECC',
            '2019',
            'USA',
            'NERC_REGION',
            'WECC',
            'Western_Electricity_Coordinating_Council',
            '738835346',
            'MWH',
            '285747759',
            'tons',
            'https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx',
            '447805417',
            '291029929',
            '',
        ],
    });

    const p5 = hlfConnector.transact({
        signingCredential: signer,
        channelName: channelName,
        contractName: ccName,
        invocationType: FabricContractInvocationType.Send,
        methodName: 'importUtilityFactor',
        params: [
            'COUNTRY_DE_2019',
            '2019',
            'Germany',
            'Country',
            'Germany',
            'Germany',
            '',
            '',
            '338',
            'g/KWH',
            'https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2016-res_proxies_eea_csv/at_download/file;https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-9',
            '',
            '',
            '41.03',
        ],
    });

    await Promise.all([p1, p2, p3, p4, p5]);
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

(async () => {
    try {
        // TODO use promise.all
        await Promise.all([mockEmissionsRecord(), setupVault()]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
