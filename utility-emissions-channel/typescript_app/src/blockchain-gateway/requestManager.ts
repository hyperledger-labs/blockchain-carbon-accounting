import {
  Logger,
  LoggerProvider,
  LogLevelDesc,
} from '@hyperledger/cactus-common';
import {
  FabricContractInvocationType,
  PluginLedgerConnectorFabric,
} from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import {
  IRecordAuditedEmissionsInput,
  IRequest,
  IStageUpdateInput,
  IStageUpdateOutput,
  requestCallerType,
} from './I-requestManager';
import { IEmissionRecord } from './I-utilityEmissionsChannel';
import { NetEmissionsTokenNetworkContract } from './netEmissionsTokenNetwork';
import { UtilityEmissionsChannel } from './utilityEmissionsChannel';
import { toTimestamp } from './utils/dateUtils';

export enum businessLogicNames {
  recordAuditedEmissionToken = 'recordAuditedEmissionToken',
}
interface IRequestManagerOptions {
  logLevel: LogLevelDesc;
  fabricClient: PluginLedgerConnectorFabric;
  utilityEmissionChannel: UtilityEmissionsChannel;
  netEmissionsTokenContract: NetEmissionsTokenNetworkContract;
  keychainId: string;
}

enum recordAuditedEmissionsStage {
  GET_VALID_EMISSIONS = 'GET_VALID_EMISSIONS',
  STORE_MINTED_TOKEN_ID = 'STORE_MINTED_TOKEN_ID',
  UPDATED_EMISSIONS_RECORDS = 'UPDATED_EMISSIONS_RECORDS',
}

export class RequestManager {
  private readonly log: Logger;
  private readonly channelName = 'utilityemissionchannel';
  private readonly reqCCName = 'requestmanager';
  private readonly dataChaincode = 'utilityemissions';
  private readonly processingState: Map<string, undefined>;
  constructor(private readonly opts: IRequestManagerOptions) {
    this.log = LoggerProvider.getOrCreate({
      level: opts.logLevel,
      label: 'RequestManager',
    });
    this.processingState = new Map<string, undefined>();
  }

  private async getValidEmissions(
    reqId: string,
    userId: string,
    orgName: string,
    uuids: string[]
  ): Promise<IEmissionRecord[]> {
    const fnTag = 'getValidEmissions';
    const caller = this._caller(userId, orgName);
    this.log.debug(`${fnTag} caller = ${caller} uuids = ${uuids}`);
    const reqInput: IStageUpdateInput = {
      requestId: reqId,
      name: recordAuditedEmissionsStage.GET_VALID_EMISSIONS,
      stageState: 'FINISHED',
      callerType: requestCallerType.CLIENT,
      fabricDataLocks: {},
      isLast: false,
    };
    reqInput.fabricDataLocks[this.dataChaincode] = {
      methodName: 'getValidEmissions',
      input: {
        keys: uuids,
      },
    };
    const result = await this.opts.fabricClient.transact({
      signingCredential: {
        keychainId: this.opts.keychainId,
        keychainRef: caller,
      },
      channelName: this.channelName,
      contractName: this.reqCCName,
      invocationType: FabricContractInvocationType.Send,
      methodName: 'stageUpdate',
      params: [JSON.stringify(reqInput)],
    });
    const output: IStageUpdateOutput = JSON.parse(result.functionOutput);
    const emissionsString = Buffer.from(
      output.fabricDataLocks[this.dataChaincode],
      'base64'
    ).toString('utf-8');
    const third: IEmissionRecord[] = JSON.parse(emissionsString);
    return third;
  }

  private async mintEmissionsToken(
    reqId: string,
    userId: string,
    orgName: string,
    addressToIssue: string,
    automaticRetireDate: string,
    validEmissions: IEmissionRecord[]
  ): Promise<string> {
    const fnTag = 'mintEmissionsToken';
    const validUUIds: string[] = validEmissions.map(
      (emission) => emission.uuid
    );
    this.log.debug(`${fnTag} valid UUIDs = ${validUUIds}`);
    const metadata: any = {
      requestId: reqId,
    };
    metadata.org = orgName;
    metadata.type = 'Utility Emissions';
    metadata.partyId = [];
    metadata.renewableEnergyUseAmount = 0;
    metadata.nonrenewableEnergyUseAmount = 0;
    metadata.utilityIds = [];
    metadata.factorSources = [];
    metadata.urls = [];
    metadata.md5s = [];
    metadata.fromDates = [];
    metadata.thruDates = [];

    let quantity: number = 0;
    const manifestIds = []; // stores uuids

    let fromDate = Number.MAX_SAFE_INTEGER;
    let thruDate = 0;
    for (const emission of validEmissions) {
      // check  timestamps to find overall rang of dates later
      const fetchedFromDate = toTimestamp(emission.fromDate);
      if (fetchedFromDate < fromDate) {
        fromDate = fetchedFromDate;
      }
      const fetchedThruDate = toTimestamp(emission.thruDate);
      if (fetchedThruDate > thruDate) {
        thruDate = fetchedThruDate;
      }

      if (emission.fromDate !== '' && emission.thruDate !== '') {
        metadata.fromDates.push(emission.fromDate);
        metadata.thruDates.push(emission.thruDate);
      }
      if (!metadata.utilityIds.includes(emission.utilityId)) {
        metadata.utilityIds.push(emission.utilityId);
      }
      if (!metadata.partyId.includes(emission.partyId)) {
        metadata.partyId.push(emission.partyId);
      }
      if (!metadata.factorSources.includes(emission.factorSource)) {
        metadata.factorSources.push(emission.factorSource);
      }
      if (emission.md5 !== '') {
        metadata.md5s.push(emission.md5);
      }
      if (emission.url !== '') {
        metadata.urls.push(emission.url);
      }
      metadata.renewableEnergyUseAmount += emission.renewableEnergyUseAmount;
      metadata.nonrenewableEnergyUseAmount +=
        emission.nonrenewableEnergyUseAmount;

      const qnt: number = +emission.emissionsAmount.toFixed(3);
      quantity += qnt * 1000;
      manifestIds.push(emission.uuid);
    }
    this.log.debug(`${fnTag} %o`, metadata);
    if (metadata.utilityIds.length === 0) {
      this.log.info(`${fnTag} no emissions records found; nothing to audit`);
      throw new Error(`no valid emissions records found`);
    }
    const manifest =
      'URL: https://utilityemissions.opentaps.net/api/v1/utilityemissionchannel, UUID: ' +
      manifestIds.join(', ');
    this.log.debug(`${fnTag} quantity ${quantity}`);
    this.log.debug(`${fnTag} minting emission token`);
    const description = 'Audited Utility Emissions';
    const { tokenId } = await this.opts.netEmissionsTokenContract.issue({
      addressToIssue,
      quantity,
      fromDate,
      thruDate,
      automaticRetireDate: toTimestamp(automaticRetireDate),
      metadata: JSON.stringify(metadata),
      manifest,
      description,
    });
    this.log.debug(`${fnTag} minted token ${tokenId}`);
    const value = tokenId.split(':');
    ///
    const reqInput: IStageUpdateInput = {
      requestId: reqId,
      name: recordAuditedEmissionsStage.STORE_MINTED_TOKEN_ID,
      stageState: 'FINISHED',
      isLast: false,
      blockchainData: [
        {
          network: 'Ethereum',
          contractAddress: value[0],
          keysCreated: {
            tokenId: value[1],
          },
        },
      ],
    };
    const caller = this._caller(userId, orgName);
    await this.opts.fabricClient.transact({
      signingCredential: {
        keychainId: this.opts.keychainId,
        keychainRef: caller,
      },
      channelName: this.channelName,
      contractName: this.reqCCName,
      invocationType: FabricContractInvocationType.Send,
      methodName: 'stageUpdate',
      params: [JSON.stringify(reqInput)],
    });
    this.log.debug(`${fnTag} stage updated!!`);
    return tokenId;
  }

  private async updateEmissionsWithTokenId(
    reqId: string,
    userId: string,
    orgName: string,
    partyId: string,
    tokenId: string,
    validUUIds: string[]
  ) {
    const reqInput: IStageUpdateInput = {
      requestId: reqId,
      name: recordAuditedEmissionsStage.UPDATED_EMISSIONS_RECORDS,
      isLast: true,
      stageState: 'FINISHED',
      fabricDataFree: {},
    };
    reqInput.fabricDataFree[this.dataChaincode] = {
      methodName: 'updateEmissionsMintedToken',
      input: {
        keys: validUUIds,
        params: Buffer.from(
          JSON.stringify({
            tokenId: tokenId,
            partyId: partyId,
          })
        ).toString('base64'),
      },
    };
    const caller = this._caller(userId, orgName);
    await this.opts.fabricClient.transact({
      signingCredential: {
        keychainId: this.opts.keychainId,
        keychainRef: caller,
      },
      channelName: this.channelName,
      contractName: this.reqCCName,
      invocationType: FabricContractInvocationType.Send,
      methodName: 'stageUpdate',
      params: [JSON.stringify(reqInput)],
    });
  }

  async getRequest(
    userId: string,
    orgName: string,
    requestId
  ): Promise<IRequest> {
    const caller = this._caller(userId, orgName);
    const result = await this.opts.fabricClient.transact({
      signingCredential: {
        keychainId: this.opts.keychainId,
        keychainRef: caller,
      },

      channelName: this.channelName,
      contractName: this.reqCCName,
      invocationType: FabricContractInvocationType.Call,
      methodName: 'getRequest',
      params: [requestId],
    });
    return JSON.parse(result.functionOutput) as IRequest;
  }

  requestIsProcessing(reqId: string): boolean {
    return this.processingState.has(reqId);
  }

  /**
   * @description main entry point for processing a request
   * @param name of the business process
   * @param reqId of the request
   * @input business logic specifics input
   */
  executeBusinessLogic(
    name: businessLogicNames,
    reqId: string,
    userId: string,
    orgName: string,
    input: any
  ) {
    const fnTag = `executeBusinessLogic`;
    const caller = this._caller(userId, orgName);
    this.log.debug(
      `${fnTag} name = ${name} reqId = ${reqId} caller = ${caller}`
    );
    switch (name) {
      case businessLogicNames.recordAuditedEmissionToken:
        this.recordAuditedEmissionToken(userId, orgName, reqId, input);
        break;
      default:
        this.log.info(`${fnTag} name = ${name} not supported`);
        break;
    }
  }

  async recordAuditedEmissionToken(
    userId: string,
    orgName: string,
    reqId: string,
    input: IRecordAuditedEmissionsInput
  ) {
    const fnTag = 'recordAuditedEmissionToken';
    this.log.debug(`${fnTag} input = %o`, input);
    if (this.processingState.has(reqId)) {
      this.log.info(
        `${fnTag} requestId = ${reqId} is being processed by some other thread`
      );
      return;
    }
    this.processingState.set(reqId, undefined);
    try {
      this.log.debug(`${fnTag} fetching request`);
      let request: IRequest;
      try {
        request = await this.getRequest(userId, orgName, reqId);
      } catch (error) {
        this.log.info(`${fnTag} error = %o`, error);
      }

      if (!request) {
        this.log.debug(
          `${fnTag} request not found, executing first stage = ${recordAuditedEmissionsStage.GET_VALID_EMISSIONS}`
        );
        const validEmissions = await this.getValidEmissions(
          reqId,
          userId,
          orgName,
          input.emissionsRecordsToAudit
        );

        this.log.debug(
          `${fnTag} stage = ${recordAuditedEmissionsStage.STORE_MINTED_TOKEN_ID} minting token for validEmissions = %o`,
          validEmissions
        );
        const tokenId = await this.mintEmissionsToken(
          reqId,
          userId,
          orgName,
          input.addressToIssue,
          input.automaticRetireDate,
          validEmissions
        );

        this.log.debug(
          `${fnTag} stage = ${recordAuditedEmissionsStage.UPDATED_EMISSIONS_RECORDS} updating emissions records with tokenId = ${tokenId}`
        );
        await this.updateEmissionsWithTokenId(
          reqId,
          userId,
          orgName,
          input.partyId,
          tokenId,
          validEmissions.map((emission) => emission.uuid)
        );
        this.log.info(`${fnTag} requestId = ${reqId} completed`);
      } else {
        this.log.info(`${fnTag} resuming request with requestId = ${reqId}`);
        if (
          request.currentStageName ===
          recordAuditedEmissionsStage.GET_VALID_EMISSIONS
        ) {
          // mint token for valid emissions
          const validUUIDsbase64 =
            request.stageData[recordAuditedEmissionsStage.GET_VALID_EMISSIONS]
              .outputs[this.dataChaincode]['validUUIDs'];
          const validUUIds: string[] = JSON.parse(
            Buffer.from(validUUIDsbase64, 'base64').toString()
          );
          this.log.debug(
            `${fnTag} fetching emissions with uuids = ${validUUIDsbase64}`
          );
          const emissions: IEmissionRecord[] = [];
          for (const uuid of validUUIds) {
            emissions.push(
              await this.opts.utilityEmissionChannel.getEmissionsData(
                userId,
                orgName,
                { uuid: uuid }
              )
            );
          }
          this.log.debug(
            `${fnTag} stage = ${recordAuditedEmissionsStage.STORE_MINTED_TOKEN_ID} minting token for validEmissions = %o`,
            emissions
          );
          const tokenId = await this.mintEmissionsToken(
            reqId,
            userId,
            orgName,
            input.addressToIssue,
            input.automaticRetireDate,
            emissions
          );

          this.log.debug(
            `${fnTag} stage = ${recordAuditedEmissionsStage.UPDATED_EMISSIONS_RECORDS} updating emissions records with tokenId = ${tokenId}`
          );
          await this.updateEmissionsWithTokenId(
            reqId,
            userId,
            orgName,
            input.partyId,
            tokenId,
            emissions.map((emission) => emission.uuid)
          );
          this.log.info(`${fnTag} requestId = ${reqId} completed`);
        } else if (
          request.currentStageName ===
          recordAuditedEmissionsStage.STORE_MINTED_TOKEN_ID
        ) {
          // update emissions records
          const validUUIDsbase64 =
            request.stageData[recordAuditedEmissionsStage.GET_VALID_EMISSIONS]
              .outputs[this.dataChaincode]['validUUIDs'];
          const validUUIds: string[] = JSON.parse(
            Buffer.from(validUUIDsbase64, 'base64').toString()
          );
          const token =
            request.stageData[recordAuditedEmissionsStage.STORE_MINTED_TOKEN_ID]
              .blockchainData[0];
          const tokenId: string = `${token.contractAddress}:${token.keysCreated['tokenId']}`;
          this.log.debug(
            `${fnTag} stage = ${recordAuditedEmissionsStage.UPDATED_EMISSIONS_RECORDS} updating emissions records with tokenId = ${tokenId}`
          );
          await this.updateEmissionsWithTokenId(
            reqId,
            userId,
            orgName,
            input.partyId,
            tokenId,
            validUUIds
          );
          this.log.info(`${fnTag} requestId = ${reqId} completed`);
        } else if (
          request.currentStageName ===
          recordAuditedEmissionsStage.UPDATED_EMISSIONS_RECORDS
        ) {
          this.log.info(`${fnTag} requestId = ${reqId} completed`);
        }
      }
    } catch (error) {
      this.log.info(`${fnTag} error = %o`, error);
    }
    this.processingState.delete(reqId);
  }
  private _caller(userId: string, orgName: string): string {
    return `${orgName}_${userId}`;
  }
}
