import { config } from 'dotenv';
import axios from 'axios';
config();

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
        await setupVault();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
