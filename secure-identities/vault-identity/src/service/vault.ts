import Vault, { client } from 'node-vault';
import { log } from '../utils/logger';
import { nonBlankString } from '../utils/utils';
export interface ITokenDetails {
    username: string;
    issue_time: string;
    expire_time: string;
}

export interface ITransitKeyDetails {
    version: number;
    ktyp: string;
    pub_key: string;
    creation_time: string;
}
export class VaultIdentityBackend {
    readonly className = 'VaultIdentityBackend';
    private cfg: {
        endpoint: string;
        transitPath: string;
        userpassPath: string;
        clientPolicy: string;
        managerPolicy: string;
        userpassAccessor: string;
        secretPath: string;
    };
    constructor() {
        this.__readEnvs();
        this.__initialize();
    }

    async createTransitKey(
        token: string,
        username: string,
        type: 'ecdsa-p256' | 'ecdsa-p384',
    ): Promise<void> {
        const backend = this.__client(token);
        await backend.write(`${this.cfg.transitPath}/keys/${username}`, { type: type });
    }

    async rotateTransitKey(token: string, username: string): Promise<void> {
        const backend = this.__client(token);
        await backend.write(`${this.cfg.transitPath}/keys/${username}/rotate`, {});
    }

    async readTransitKey(token: string, username: string): Promise<ITransitKeyDetails> {
        const backend = this.__client(token);
        const resp = await backend.read(`${this.cfg.transitPath}/keys/${username}`);
        const key = resp.data;
        const version = key.latest_version;
        const k = key.keys[version];
        return {
            version: version,
            ktyp: k.name,
            pub_key: k.public_key,
            creation_time: k.creation_time,
        };
    }

    async genToken(username: string, password: string): Promise<string> {
        const backend = this.__client();
        const resp = await backend.write(`auth/${this.cfg.userpassPath}/login/${username}`, {
            password: password,
        });
        return resp.auth.client_token;
    }

    async tokenDetails(token: string): Promise<ITokenDetails> {
        const fnTag = `${this.className}#tokenDetails`;
        const backend = this.__client(token);
        const resp = await backend.read(`auth/token/lookup-self`);
        if (resp?.data) {
            return {
                expire_time: resp.data.expire_time,
                issue_time: resp.data.issue_time,
                username: resp.data.meta.username,
            };
        }
        throw new Error(`${fnTag} invalid response from vault`);
    }

    async renewToken(token: string): Promise<void> {
        const backend = this.__client(token);
        await backend.write(`auth/token/renew-self`, {});
    }

    async revokeToken(token: string): Promise<void> {
        const backend = this.__client(token);
        await backend.write(`auth/token/revoke-self`, {});
    }

    async updateIdentityPassword(token: string, username: string, newPass: string): Promise<void> {
        const backend = this.__client(token);
        await backend.write(`auth/${this.cfg.userpassPath}/users/${username}/password`, {
            password: newPass,
        });
    }

    async createManagerIdentity(
        rootToken: string,
        username: string,
        password: string,
    ): Promise<void> {
        const fnTag = '#createManagerIdentity';
        await this.__createIdentity(fnTag, rootToken, username, password, this.cfg.managerPolicy);
        log.debug(`${fnTag} identity of manager successfully created with vault`);
    }
    async createClientIdentity(
        managerToken: string,
        username: string,
        password: string,
    ): Promise<void> {
        const fnTag = '#createClientIdentity';
        await this.__createIdentity(fnTag, managerToken, username, password, this.cfg.clientPolicy);
        log.debug(`${fnTag} identity of manager successfully created with vault`);
    }

    async putSecret(token: string, path: string, secrets: { [key: string]: any }): Promise<void> {
        const backend = this.__client(token);
        await backend.write(`${this.cfg.secretPath}/data/${path}`, {
            data: {
                value: secrets,
            },
        });
    }

    async getSecret(token: string, path: string): Promise<any> {
        const backend = this.__client(token);
        const resp = await backend.read(`${this.cfg.secretPath}/data/${path}`);
        return resp.data.data.value;
    }

    async deleteSecret(token: string, path: string): Promise<void> {
        const backend = this.__client(token);
        await backend.delete(`${this.cfg.secretPath}/data/${path}`);
    }

    private async __createIdentity(
        fnTag: string,
        token: string,
        username: string,
        password: string,
        policy,
    ): Promise<void> {
        log.debug(`${fnTag} create userpass for identity with username = ${username}`);
        const backend = this.__client(token);
        try {
            await backend.write(`auth/${this.cfg.userpassPath}/users/${username}`, {
                password: password,
            });
        } catch (error) {
            throw new Error(
                `${fnTag} failed to create userpass for ${username} : ${error.message}`,
            );
        }
        log.debug(`${fnTag} create entity for ${username}`);
        let entityId: string;
        try {
            const resp = await backend.write('identity/entity', {
                name: username,
                policies: [policy],
            });
            if (resp?.data?.id) {
                entityId = resp.data.id;
            } else {
                throw new Error(`${fnTag} invalid response from vault path : identity/entity`);
            }
        } catch (error) {
            throw new Error(`${fnTag} failed to create entity for ${username} : ${error.message}`);
        }
        log.debug(`${fnTag} create entity-alias for ${username}`);
        try {
            await backend.write('identity/entity-alias', {
                name: username,
                canonical_id: entityId,
                mount_accessor: this.cfg.userpassAccessor,
            });
        } catch (error) {
            throw new Error(
                `${fnTag} failed to create entity-alias for ${username} : ${error.message}`,
            );
        }
    }
    // read config envs and create vault identity backend
    private __readEnvs() {
        this.cfg = {
            endpoint: process.env.VAULT_ENDPOINT,
            transitPath: process.env.VAULT_ENGINE_TRANSIT_PATH,
            userpassPath: process.env.VAULT_AUTH_USERPASS_PATH,
            clientPolicy: process.env.VAULT_POLICY_CLIENT,
            managerPolicy: process.env.VAULT_POLICY_MANAGER,
            userpassAccessor: process.env.VAULT_AUTH_USERPASS_ACCESSOR,
            secretPath: process.env.VAULT_SECRET_PATH,
        };
        {
            nonBlankString(this.cfg.endpoint, 'VAULT_ENDPOINT');
            nonBlankString(this.cfg.transitPath, 'VAULT_ENGINE_TRANSIT_PATH');
            nonBlankString(this.cfg.userpassPath, 'VAULT_AUTH_USERPASS_PATH');
            nonBlankString(this.cfg.userpassAccessor, 'VAULT_AUTH_USERPASS_ACCESSOR');
            nonBlankString(this.cfg.clientPolicy, 'VAULT_POLICY_CLIENT');
            nonBlankString(this.cfg.managerPolicy, 'VAULT_POLICY_MANAGER');
            nonBlankString(this.cfg.secretPath, 'VAULT_SECRET_PATH');
        }
    }

    private async __initialize() {
        const resp = await this.__client().read('sys/health');
        log.child(resp).info('vault server health');
    }

    private __client(token?: string): client {
        return Vault({
            endpoint: this.cfg.endpoint,
            apiVersion: 'v1',
            token: token,
        });
    }
}
