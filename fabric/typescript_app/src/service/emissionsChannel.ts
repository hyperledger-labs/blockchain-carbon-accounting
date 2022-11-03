import { createHash } from 'crypto';
import Joi from 'joi';
import {
    IDataChaincodeInput,
    IDataLockGateway,
    IEmissionsDataEmission,
    IEmissionsDataEmissionMetadata,
    IEmissionsDataGateway,
    IEthNetEmissionsTokenGateway,
    IEthNetEmissionsTokenIssueOutput,
    IEthTxCaller,
    IFabricTxCaller,
    ITxDetails,
    IWebSocketKey,
} from '../blockchain-gateway-lib/I-gateway';
import { IGetEmissionsByLookUp } from '../blockchain-gateway-lib/I-query-params';

import AWSS3 from '../datasource/awsS3';
import ClientError from '../errors/clientError';
import { checkDateConflict, toTimestamp } from '../utils/dateUtils';
import { appLogger } from '../utils/logger';
import { Input } from './input';

interface EmissionsChannelServiceOptions {
    EmissionsGateway: IEmissionsDataGateway;
    netEmissionsContractGateway: IEthNetEmissionsTokenGateway;
    datalockGateway: IDataLockGateway;
    s3: AWSS3;
    ethContractAddress: string;
    orgName: string;
}

interface IRecordAuditedEmissionsTokenResponse {
    tokenId: string;
    quantity: bigint;
    fromDate: number;
    thruDate: number;
    metadata: string;
    manifest: string;
    description: string;
}

interface TokenMetadata {
    metadata: IEmissionsDataEmissionMetadata;
    manifest: string;
    quantity: bigint;
    fromDate: number;
    thruDate: number;
}

export default class EmissionsChannelService {
    private readonly className = 'EmissionsChannelService';
    constructor(private readonly opts: EmissionsChannelServiceOptions) {}
    async recordEmission(input: Input): Promise<IEmissionsDataEmission> {
        const fnTag = `${this.className}.recordEmission()`;
        this.__validateUserID(input);
        this.__validateRecordEmissionsInput(input);

        const userId = input.query.userId;

        const endpoint: string = input.query.endpoint;
        const query: string = input.query.endpoint;

        const utilityId: string = input.body.utilityId;
        const partyId: string = input.body.partyId;
        const fromDate: string = input.body.fromDate;
        const thruDate: string = input.body.thruDate;
        const energyUseAmount: number = parseInt(input.body.energyUseAmount);
        const energyUseUom: string = input.body.energyUseUom;

        const queryParams: IGetEmissionsByLookUp = {
            uuid: utilityId,
            usage: energyUseAmount,
            usageUOM: energyUseUom,
            thruDate: thruDate,
        };

        const fabricCaller: IFabricTxCaller = {
            userId: userId,
            vaultToken: input.header.vault_token as string,
            webSocketKey: input.header.web_socket_key as IWebSocketKey,
        };

        try {
            appLogger.debug(
                `${fnTag} fetching emissions records, utilityId = ${utilityId}, partyID = ${partyId}`,
            );
            const emissionRecords = await this.opts.EmissionsGateway.getEmissionsRecords(
                fabricCaller,
                {
                    utilityId: utilityId,
                    partyId: partyId,
                },
            );
            appLogger.debug(`${fnTag} overlap check of data between ${fromDate} to ${thruDate}`);
            for (const emission of emissionRecords) {
                // md5 checksum of document
                await this.emissionsRecordChecksum(emission);
                const overlap: boolean = checkDateConflict(
                    fromDate,
                    thruDate,
                    emission.fromDate,
                    emission.thruDate,
                );
                if (overlap) {
                    throw new ClientError(
                        `Supplied dates ${fromDate} to ${thruDate} overlap with an existing dates ${emission.fromDate} to ${emission.thruDate}.`,
                        409,
                    );
                }
            }
            let url = '';
            let md5 = '';
            if (input.file) {
                const filename = `${userId}-${this.opts.orgName}-${utilityId}-${partyId}-${fromDate}-${thruDate}.pdf`;
                appLogger.debug(`${fnTag} upload ${filename} to s3`);
                try {
                    const uploadResp = await this.opts.s3.upload(input.file, filename);
                    url = uploadResp.Location;
                    const md5sum = createHash('md5');
                    md5sum.update(input.file);
                    md5 = md5sum.digest('hex');
                } catch (error) {
                    const m = error instanceof Error ? error.message : String(error);
                    throw new ClientError(m, 409);
                }
            }

            return await this.opts.EmissionsGateway.recordEmissions(fabricCaller, {
                endpoint,
                query,
                queryParams,
                //utilityId: utilityId,
                partyId: partyId,
                fromDate: fromDate,
                thruDate: thruDate,
                //energyUseAmount: energyUseAmount,
                //energyUseUom: energyUseUom,
                url: url,
                md5: md5,
            });
        } catch (error) {
            appLogger.debug(`${fnTag} failed to record emissions : %o`, error);
            throw error;
        }
    }

    async recordAuditedEmissionsToken(
        input: Input,
    ): Promise<IRecordAuditedEmissionsTokenResponse | undefined> {
        const fnTag = `${this.className}.recordAuditedEmissionsToken()`;
        this.__validateUserID(input);
        this.__validateRecordAuditedEmissionsToken(input);
        const fabricCaller: IFabricTxCaller = {
            userId: input.query.userId,
            vaultToken: input.header.vault_token as string,
            webSocketKey: input.header.web_socket_key as IWebSocketKey,
        };
        const ethCaller: IEthTxCaller = {
            address: input.header.eth_address as string,
            private: input.header.eth_private as string,
            keyName: input.query.userId,
        };
        const partyId = input.body.partyId;
        const issuedTo = input.body.issuedTo;
        const issuedFrom = input.body.issuedFrom;
        const toAuditString = input.body.emissionsRecordsToAudit as string;
        const txID = input.body.txID;
        const emissionsRecordsToAudit = toAuditString.toString().split(',');
        appLogger.debug(`${fnTag} start processing for txID = ${txID}`);
        let tx: ITxDetails;
        try {
            tx = await this.opts.datalockGateway.startTransitionProcess(fabricCaller, txID);
        } catch (error) {
            appLogger.debug(`${fnTag} failed to start processing for txID = ${txID} : %o`, error);
            throw error;
        }
        let err: ClientError | undefined = undefined;
        const emissionCCName = 'emissions';
        let token: IEthNetEmissionsTokenIssueOutput | undefined = undefined;
        let metadata: TokenMetadata | undefined = undefined;

        try {
            appLogger.debug(`${fnTag} current stage name = ${tx.current_stage}`);
            let records: IEmissionsDataEmission[] | undefined = undefined;
            let validUUIDs: string[] = [];
            if (tx.current_stage === '') {
                appLogger.debug(`${fnTag} executing first stage::LOCK_UUIDS`);
                // first stage
                const dataLock: { [key: string]: IDataChaincodeInput } = {};
                dataLock[emissionCCName] = {
                    keys: emissionsRecordsToAudit,
                    params: ['getValidEmissions', ...emissionsRecordsToAudit],
                };
                const resp = await this.opts.datalockGateway.stageUpdate(fabricCaller, {
                    tx_id: txID,
                    name: 'GetValidEmissions',
                    data_locks: dataLock,
                });
                records = JSON.parse(
                    Buffer.from(resp.data_locks[emissionCCName], 'base64').toString(),
                );
                validUUIDs = [];
                if (records) {
                    for (const record of records) {
                        validUUIDs.push(record.uuid);
                    }
                }
            }

            let tokenId = '';
            if (tx.current_stage === '' || tx.current_stage === 'GetValidEmissions') {
                appLogger.debug(`${fnTag} executing second stage::MINT_TOKEN`);
                if (records === undefined) {
                    records = [];
                    validUUIDs = JSON.parse(
                        Buffer.from(
                            tx.stage_data['GetValidEmissions'].output[emissionCCName]['validUUIDs'],
                            'base64',
                        ).toString(),
                    );
                    for (const uuid of validUUIDs) {
                        records.push(
                            await this.opts.EmissionsGateway.getEmissionData(fabricCaller, uuid),
                        );
                    }
                }
                metadata = await this.tokenMetadata(records);
                const description = 'Audited Utility Emissions';

                token = await this.opts.netEmissionsContractGateway.issue(ethCaller, {
                    issuedFrom: issuedFrom,
                    issuedTo: issuedTo,
                    quantity: metadata.quantity,
                    fromDate: metadata.fromDate,
                    thruDate: metadata.thruDate,
                    metadata: JSON.stringify(metadata.metadata),
                    manifest: metadata.manifest,
                    description: description,
                });
                tokenId = `${this.opts.ethContractAddress}:${token.tokenId}`;
                await this.opts.datalockGateway.stageUpdate(fabricCaller, {
                    tx_id: txID,
                    name: 'StoreMintedToken',
                    storage: {
                        tokenId: tokenId,
                    },
                });
            }
            if (
                tx.current_stage === '' ||
                tx.current_stage === 'GetValidEmissions' ||
                tx.current_stage === 'StoreMintedToken'
            ) {
                appLogger.debug(`${fnTag} executing third stage::UPDATE_TOKEN_ID`);
                if (tokenId === '') {
                    validUUIDs = JSON.parse(
                        Buffer.from(
                            tx.stage_data['GetValidEmissions'].output[emissionCCName]['validUUIDs'],
                            'base64',
                        ).toString(),
                    );
                    tokenId = tx.stage_data['StoreMintedToken'].storage['tokenId'];
                }
                const dataFree: { [key: string]: IDataChaincodeInput } = {};
                dataFree[emissionCCName] = {
                    keys: validUUIDs,
                    params: ['updateEmissionsMintedToken', tokenId, partyId, ...validUUIDs],
                };
                await this.opts.datalockGateway.stageUpdate(fabricCaller, {
                    tx_id: txID,
                    name: 'MintedTokenUpdate',
                    data_free: dataFree,
                    is_last: true,
                });
            }
        } catch (error) {
            if (error instanceof ClientError) {
                err = error;
            } else {
                const m = error instanceof Error ? error.message : String(error);
                err = new ClientError(m, 409);
            }
        }

        appLogger.debug(`${fnTag} end processing for txID = ${txID}`);
        try {
            await this.opts.datalockGateway.endTransitionProcess(fabricCaller, txID);
        } catch (error) {
            appLogger.debug(`${fnTag} failed to end processing for txID = ${txID} : %o`, error);
            throw error;
        }

        if (err !== null) {
            appLogger.debug(`${fnTag} failed with error : %o`, err);
            throw err;
        }
        if (token && metadata) {
            return {
                tokenId: token.tokenId,
                quantity: metadata.quantity,
                fromDate: metadata.fromDate,
                thruDate: metadata.thruDate,
                metadata: token.metadata,
                manifest: token.manifest,
                description: token.description,
            };
        }
    }

    async getEmissionsData(input: Input): Promise<IEmissionsDataEmission> {
        const fnTag = `${this.className}.getEmissionsData()`;
        this.__validateUserID(input);
        this.__validateGetEmissionsDataInput(input);
        const fabricCaller: IFabricTxCaller = {
            userId: input.query.userId,
            vaultToken: input.header.vault_token as string,
            webSocketKey: input.header.web_socket_key as IWebSocketKey,
        };
        const uuid = input.params?.uuid;
        if (!uuid) {
            throw new Error(`${fnTag} error : no input params uuid`);
        }
        try {
            const record = await this.opts.EmissionsGateway.getEmissionData(fabricCaller, uuid);
            await this.emissionsRecordChecksum(record);
            return record;
        } catch (error) {
            appLogger.debug(`${fnTag} error : %o`, error);
            throw error;
        }
    }

    async getAllEmissionsData(input: Input): Promise<IEmissionsDataEmission[]> {
        const fnTag = `${this.className}.getAllEmissionsData()`;
        this.__validateUserID(input);
        this.__validateGetAllEmissionsDataInput(input);
        const fabricCaller: IFabricTxCaller = {
            userId: input.query.userId,
            vaultToken: input.header.vault_token as string,
            webSocketKey: input.header.web_socket_key as IWebSocketKey,
        };
        const utilityId = input.params?.utilityId;
        if (!utilityId) {
            throw new Error(`${fnTag} error : no input params utilityId`);
        }
        const partyId = input.params?.partyId;
        if (!partyId) {
            throw new Error(`${fnTag} error : no input params partyId`);
        }
        try {
            const records = await this.opts.EmissionsGateway.getEmissionsRecords(fabricCaller, {
                utilityId: utilityId,
                partyId: partyId,
            });
            for (const record of records) {
                await this.emissionsRecordChecksum(record);
            }
            return records;
        } catch (error) {
            appLogger.debug(`${fnTag} error : %o`, error);
            throw error;
        }
    }

    async getAllEmissionsDataByDateRange(input: Input): Promise<IEmissionsDataEmission[]> {
        const fnTag = `${this.className}.getAllEmissionsDataByDateRange()`;
        this.__validateUserID(input);
        this.__validateGetAllEmissionsDataByDateRangeInput(input);
        const fabricCaller: IFabricTxCaller = {
            userId: input.query.userId,
            vaultToken: input.header.vault_token as string,
            webSocketKey: input.header.web_socket_key as IWebSocketKey,
        };
        const fromDate = input.params?.fromDate;
        if (!fromDate) {
            throw new Error(`${fnTag} error : no input params fromDate`);
        }
        const thruDate = input.params?.thruDate;
        if (!thruDate) {
            throw new Error(`${fnTag} error : no input params thruDate`);
        }
        try {
            const records = await this.opts.EmissionsGateway.getAllEmissionsDataByDateRange(
                fabricCaller,
                {
                    fromDate: fromDate,
                    thruDate: thruDate,
                },
            );
            for (const record of records) {
                await this.emissionsRecordChecksum(record);
            }
            return records;
        } catch (error) {
            appLogger.debug(`${fnTag} error : %o`, error);
            throw error;
        }
    }
    private async emissionsRecordChecksum(record: IEmissionsDataEmission) {
        const fnTag = `${this.className}.EmissionsRecordChecksum`;
        if (record.url && record.url.length > 0) {
            const url = record.url;
            appLogger.debug(`${fnTag} data at url = ${url}`);
            const filename = decodeURIComponent(url).split('/').slice(-1)[0];
            let data: Buffer;
            try {
                data = await this.opts.s3.download(filename);
            } catch (error) {
                appLogger.debug(`${fnTag} failed to fetch ${filename} from S3 : %o`, error);
                return;
            }

            appLogger.debug(`${fnTag} data hash from blockchain = ${record.md5}`);
            const md5Sum = createHash('md5');
            md5Sum.update(data);
            if (md5Sum.digest('hex') !== record.md5) {
                throw new ClientError(
                    `The retrieved document ${record.url} has a different MD5 hash than recorded on the ledger. This file may have been tampered with.`,
                    409,
                );
            }

            appLogger.debug(`${fnTag} Md5 CheckSum successful !!`);
        }
    }

    private async tokenMetadata(records: IEmissionsDataEmission[]): Promise<TokenMetadata> {
        const metadata: IEmissionsDataEmissionMetadata = {
            org: this.opts.orgName,
            type: 'Utility Emissions',
            partyId: [],
            renewableEnergyUseAmount: 0,
            nonrenewableEnergyUseAmount: 0,
            utilityIds: [],
            factorSources: [],
            urls: [],
            md5s: [],
            fromDates: [],
            thruDates: [],
        };
        let quantity = 0n;
        const manifestIds = []; // stores uuids
        let fromDate = Number.MAX_SAFE_INTEGER;
        let thruDate = 0;
        for (const record of records) {
            // check md5 checksum
            await this.emissionsRecordChecksum(record);

            // check timestamp to find overall range of dates
            const fetchedFromDate = toTimestamp(record.fromDate);
            if (fetchedFromDate < fromDate) {
                fromDate = fetchedFromDate;
            }
            const fetchedThruDate = toTimestamp(record.thruDate);
            if (fetchedThruDate > thruDate) {
                thruDate = fetchedThruDate;
            }

            if (record.fromDate !== '' && record.thruDate !== '') {
                metadata.fromDates.push(record.fromDate);
                metadata.thruDates.push(record.thruDate);
            }
            if (!metadata.utilityIds.includes(record.utilityId)) {
                metadata.utilityIds.push(record.utilityId);
            }
            if (!metadata.partyId.includes(record.partyId)) {
                metadata.partyId.push(record.partyId);
            }
            if (!metadata.factorSources.includes(record.factorSource)) {
                metadata.factorSources.push(record.factorSource);
            }
            if (record.md5 !== '') {
                metadata.md5s.push(record.md5);
            }
            if (record.url !== '') {
                metadata.urls.push(record.url);
            }
            metadata.renewableEnergyUseAmount += record.renewableEnergyUseAmount;
            metadata.nonrenewableEnergyUseAmount += record.nonrenewableEnergyUseAmount;

            const qnt: number = +record.emissionsAmount.toFixed(3);
            quantity += BigInt(qnt * 1000);
            manifestIds.push(record.uuid);
        }
        return {
            metadata,
            manifest:
                'URL: https://emissions.opentaps.net/api/v1/emissions-data, UUID: ' +
                manifestIds.join(', '),
            quantity,
            fromDate,
            thruDate,
        };
    }
    private __validateGetEmissionsDataInput(input: Input) {
        const schema = Joi.object({
            uuid: Joi.string().required().error(new Error('require uuid, but provided empty')),
        });
        const result = schema.validate(input.params);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }
    private __validateGetAllEmissionsDataInput(input: Input) {
        const schema = Joi.object({
            utilityId: Joi.string()
                .required()
                .error(new Error('require utilityId, but provided empty')),
            partyId: Joi.string()
                .required()
                .error(new Error('require partyId, but provided empty')),
        });
        const result = schema.validate(input.params);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }
    private __validateGetAllEmissionsDataByDateRangeInput(input: Input) {
        const schema = Joi.object({
            fromDate: Joi.string()
                .regex(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/,
                )
                .required(),
            thruDate: Joi.string()
                .regex(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/,
                )
                .required(),
        });
        const result = schema.validate(input.params);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }
    private __validateRecordEmissionsInput(input: Input) {
        const schema = Joi.object({
            utilityId: Joi.string()
                .required()
                .error(new Error('require utilityId, but not provided')),
            partyId: Joi.string().required().error(new Error('require partyId, but not provided')),
            fromDate: Joi.string()
                .regex(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/,
                )
                .required(),
            thruDate: Joi.string()
                .regex(
                    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/,
                )
                .required(),
            energyUseAmount: Joi.number().required(),
            energyUseUom: Joi.string()
                .required()
                .error(new Error('require energyUseUom, but not provided')),
            emissionsDoc: Joi.optional(),
        });
        const result = schema.validate(input.body);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }

    private __validateRecordAuditedEmissionsToken(input: Input) {
        const schema = Joi.object({
            partyId: Joi.string().required(),
            addressToIssue: Joi.string().required(),
            emissionsRecordsToAudit: Joi.string().required(),
            txID: Joi.string().required(),
        });
        const result = schema.validate(input.body);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }
    private __validateUserID(input: Input) {
        const schema = Joi.object({
            userId: Joi.string().required().error(new Error('require userId, but provided empty')),
        });
        const result = schema.validate(input.query);
        if (result.error) {
            throw new ClientError(result.error.message);
        }
    }
}
