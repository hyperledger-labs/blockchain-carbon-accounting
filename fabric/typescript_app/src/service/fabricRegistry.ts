import { Input } from './input';
import Joi from 'joi';
import ClientError from '../errors/clientError';
import { IFabricRegistryGateway, IWebSocketKey } from '../blockchain-gateway-lib/I-gateway';
import { appLogger, ledgerLogger } from '../utils/logger';

interface registerOutput {
    enrollmentID: string;
    enrollmentSecret: string;
}

export default class FabricRegistryService {
    private readonly className = 'FabricRegistryService';
    constructor(private readonly gateway: IFabricRegistryGateway) {}

    async register(input: Input): Promise<registerOutput> {
        this.__validateRegister(input);
        try {
            const cred = await this.gateway.register(
                {
                    userId: input.query.userId,
                    vaultToken: input.header.vault_token as string,
                    webSocketKey: input.header.web_socket_key as IWebSocketKey,
                },
                {
                    enrollmentID: input.body.enrollmentID,
                    affiliation: input.body.affiliation,
                },
            );
            return {
                enrollmentID: cred.enrollmentID,
                enrollmentSecret: cred.enrollmentSecret,
            };
        } catch (error) {
            ledgerLogger.debug(`${this.className}.register() : %o`, error);
            throw error;
        }
    }
    async enroll(input: Input): Promise<void> {
        this.__validateEnroll(input);
        try {
            await this.gateway.enroll(
                {
                    userId: input.body.enrollmentID,
                    vaultToken: input.header.vault_token as string,
                    webSocketKey: input.header.web_socket_key as IWebSocketKey,
                },
                input.body.enrollmentSecret,
            );
        } catch (error) {
            appLogger.info(`${this.className}.enroll() : %o`, error);
            throw error;
        }
    }

    private __validateEnroll(input: Input): void {
        const bodySchema = Joi.object({
            enrollmentID: Joi.string()
                .required()
                .error(new Error('require enrollmentID, but provided empty')),
            enrollmentSecret: Joi.string()
                .required()
                .error(new Error('require enrollmentSecret, but provided empty')),
        });
        const result = bodySchema.validate(input.body);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }
    private __validateRegister(input: Input): void {
        const bodySchema = Joi.object({
            enrollmentID: Joi.string()
                .required()
                .error(new Error('require userId, but provided empty')),
            affiliation: Joi.string()
                .required()
                .error(new Error('require affiliation, but provided empty')),
        });
        const querySchema = Joi.object({
            userId: Joi.string().required().error(new Error('require userId, but provided empty')),
        });

        const bodyResult = bodySchema.validate(input.body);
        if (bodyResult.error) {
            throw new ClientError(bodyResult.error.message);
        }
        const queryResult = querySchema.validate(input.query);
        if (queryResult.error) {
            throw new ClientError(queryResult.error.message);
        }
    }
}
