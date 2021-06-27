// carbonAccounting.ts : exposes routers which uses more then one kind
// ledger integration
// example :
// recording_audited_emission_token : makes two calls to fabric and one to ethereum
import {
  Logger,
  LoggerProvider,
  LogLevelDesc,
} from '@hyperledger/cactus-common';
import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  businessLogicNames,
  RequestManager,
} from '../blockchain-gateway/requestManager';
import { IRecordAuditedEmissionsInput } from '../blockchain-gateway/I-requestManager';
import { randomBytes } from 'crypto';

export interface ICarbonAccountingRouter {
  logLevel: LogLevelDesc;
  requestManager: RequestManager;
}

export class CarbonAccountingRouterV2 {
  private static readonly CLASS_NAME = 'CarbonAccountingRouterV2';
  private readonly log: Logger;

  public readonly router: Router;

  get className(): string {
    return CarbonAccountingRouterV2.CLASS_NAME;
  }

  constructor(private readonly opt: ICarbonAccountingRouter) {
    this.log = LoggerProvider.getOrCreate({
      label: this.className,
      level: opt.logLevel,
    });
    this.router = Router();
    this.registerHandlers();
  }

  private registerHandlers() {
    this.router.get(
      '/request/:userId/:orgName/:requestId',
      [
        param('userId').isString(),
        param('orgName').isString(),
        param('requestId').isString(),
      ],
      this.getRequest.bind(this)
    );

    this.router.get(
      '/request/state/:requestId',
      [param('requestId').isString()],
      this.requestProcessingState.bind(this)
    );
    this.router.get('/request/newId', this.createNewRequestId.bind(this));
    this.router.post(
      '/recordAuditedEmissionsToken',
      [
        body('userId').isString(),
        body('orgName').isString(),
        body('partyId').isString(),
        body('addressToIssue').isString(),
        body('emissionsRecordsToAudit').isString(),
        body('requestId').isString(),
      ],
      this.recordAuditedEmissionToken.bind(this)
    );
  }
  private createNewRequestId(_: Request, res: Response) {
    const requestId = randomBytes(16).toString('hex');
    res.status(200).json({ requestId });
  }
  private async getRequest(req: Request, res: Response) {
    const fnTag = `${req.method.toUpperCase()} ${req.baseUrl}${req.url}`;
    this.log.debug(fnTag);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      this.log.debug(`${fnTag} invalid Request : %o`, errors.array());
      return res.status(412).json({
        errors: errors.array(),
      });
    }
    const userId = req.params.userId;
    const orgName = req.params.orgName;
    const requestId = req.params.requestId;
    try {
      const request = await this.opt.requestManager.getRequest(
        userId,
        orgName,
        requestId
      );
      res.status(200).json(request);
    } catch (error) {
      this.log.error(`${fnTag} %o`,error);
      res.status(409).json({
        error: (error as Error).message,
      });
    }
  }

  private async recordAuditedEmissionToken(req: Request, res: Response) {
    const fnTag = `${req.method.toUpperCase()} ${req.url}`;
    this.log.debug(fnTag);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      this.log.debug(`${fnTag} BadJSON Request : %o`, errors.array());
      return res.status(412).json({
        errors: errors.array(),
      });
    }
    const userId = req.body.userId;
    const orgName = req.body.orgName;
    const partyId = req.body.partyId;
    const requestId = req.body.requestId;
    const addressToIssue = req.body.addressToIssue;
    let automaticRetireDate = req.params.automaticRetireDate;
    const re = new RegExp(
      /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
    );
    if (!re.test(automaticRetireDate)) {
      automaticRetireDate = new Date().toISOString();
    }
    const emissionsRecordsToAudit: string[] = req.body.emissionsRecordsToAudit
      .toString()
      .split(',');
    const input: IRecordAuditedEmissionsInput = {
      partyId: partyId,
      addressToIssue: addressToIssue,
      emissionsRecordsToAudit: emissionsRecordsToAudit,
      automaticRetireDate: automaticRetireDate,
    };
    this.opt.requestManager.executeBusinessLogic(
      businessLogicNames.recordAuditedEmissionToken,
      requestId,
      userId,
      orgName,
      input
    );
    res.send();
  }

  private async requestProcessingState(req: Request, res: Response) {
    const fnTag = `${req.method.toUpperCase()} ${req.baseUrl}${req.url}`;
    this.log.debug(fnTag);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      this.log.debug(`${fnTag} invalid Request : %o`, errors.array());
      return res.status(412).json({
        errors: errors.array(),
      });
    }
    const reqId = req.params.requestId;
    try {
      const isActive = this.opt.requestManager.requestIsProcessing(reqId);
      res.status(200).json({
        state: isActive === true ? 'ACTIVE' : 'IDLE',
      });
    } catch (error) {
      this.log.error(`${fnTag} error = %o`, error);
      res.status(500).json({
        error,
      });
    }
  }
}
