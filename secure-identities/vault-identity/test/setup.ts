import Vault from 'node-vault';
import { readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { join } from 'path';
import { config } from 'dotenv';

config();

const transitPath = process.env.VAULT_ENGINE_TRANSIT_PATH;
const userpassPath = process.env.VAULT_AUTH_USERPASS_PATH;
const clientPolicyName = process.env.VAULT_POLICY_CLIENT;
const managerPolicyName = process.env.VAULT_POLICY_MANAGER;
const secretPath = process.env.VAULT_SECRET_PATH;
const devToken = 'tokenId';
const devVaultEndpoint = process.env.VAULT_ENDPOINT;

// createPolicy
// enable userpass auth
// mount transit path
const backend = Vault({
    endpoint: devVaultEndpoint,
    apiVersion: 'v1',
    token: devToken,
});

async function createPolicy(file: string, name: string): Promise<void> {
    const policy = readFileSync(file).toString();
    await backend.write('sys/policy/' + name, { policy: policy });
}

async function mountSecret(path: string, type: 'transit' | 'kv-v2'): Promise<void> {
    await backend.write('sys/mounts/' + path, { type: type });
}

async function enableAuth(path: string, type: 'userpass') {
    await backend.write('sys/auth/' + path, { type: type });
}

async function updateEnv(): Promise<void> {
    let resp = await backend.read('sys/auth');
    while (!resp.data[userpassPath + '/']) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        resp = await backend.read('sys/auth');
    }
    const accessor = resp.data[userpassPath + '/'].accessor;
    const envPath = join(__dirname, '..', '.env');
    const envs = readFileSync(envPath, 'utf-8').split(EOL);
    const target = envs.indexOf(
        envs.find((line) => {
            return line.match(new RegExp('VAULT_AUTH_USERPASS_ACCESSOR'));
        }),
    );
    envs.splice(target, 1, `VAULT_AUTH_USERPASS_ACCESSOR='${accessor}'`);
    writeFileSync(envPath, envs.join(EOL));
}

(async () => {
    try {
        await Promise.all([
            createPolicy('./hcl-files/manager.hcl', managerPolicyName),
            createPolicy('./hcl-files/client.hcl', clientPolicyName),
            mountSecret(transitPath, 'transit'),
            mountSecret(secretPath, 'kv-v2'),
            enableAuth(userpassPath, 'userpass'),
            updateEnv(),
        ]);
    } catch (error) {
        console.log(error);
    }
})();
