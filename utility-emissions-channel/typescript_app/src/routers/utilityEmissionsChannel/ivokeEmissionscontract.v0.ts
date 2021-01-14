import express from "express";
import { log } from "../../utils/log";
import { body, param, validationResult } from "express-validator";
import { EmissionsContractInvoke } from "../../blockchain-gateway/utilityEmissionsChannel/emissionsContractInvoke";
import { uploadToS3 } from "../../blockchain-gateway/utils/aws";
import { Md5 } from "ts-md5/dist/md5";
import { toTimestamp } from "../../blockchain-gateway/utils/dateUtils";
import {
  issue,
  registerAuditedEmissionDealer,
} from "../../blockchain-gateway/net-emissions-token-network/auditedEmissionsToken";

const APP_VERSION = "v1";
export const router = express.Router();

// http://localhost:9000/api/v1//utilityemissionchannel/emissionscontract/recordEmissions
export const RECORD_EMISSIONS = "/api/" + APP_VERSION + "/utilityemissionchannel/emissionscontract/recordEmissions";
router.post(
  RECORD_EMISSIONS,
  [
    body("userId").isString(),
    body("orgName").isString(),
    body("utilityId").isString(),
    body("partyId").isString(),
    body("fromDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error("Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
    body("thruDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error("Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
    body("energyUseAmount").isNumeric(),
    body("energyUseUom").isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const userId = req.body.userId;
      const orgName = req.body.orgName;
      const utilityId = req.body.utilityId;
      const partyId = req.body.partyId;
      const fromDate = req.body.fromDate;
      const thruDate = req.body.thruDate;
      const energyUseAmount = req.body.energyUseAmount;
      const energyUseUom = req.body.energyUseUom;
      let url = "";
      let md5: string = "";

      // check for overlapping dates before uploading to s3
      const overlapResponse = await EmissionsContractInvoke.checkDateOverlap(
        userId,
        orgName,
        utilityId,
        partyId,
        fromDate,
        thruDate
      );
      // upload doc to s3 if exists
      if (req.file) {
        let fileBin = req.file.buffer;
        let upload = await uploadToS3(
          fileBin,
          `${userId}-${orgName}-${utilityId}-${partyId}-${fromDate}-${thruDate}.pdf`
        );
        url = upload.Location;
        md5 = Md5.hashStr(fileBin.toString()).toString();
      }

      console.log(`# RECORDING EMISSIONS DATA TO UTILITYEMISSIONS CHANNEL`);

      // Record Emission to utilityEmissions Channel
      const blockchainResponse = await EmissionsContractInvoke.recordEmissions(
        userId,
        orgName,
        utilityId,
        partyId,
        fromDate,
        thruDate,
        energyUseAmount,
        energyUseUom,
        url,
        md5
      );

      if (blockchainResponse["info"] === "EMISSION RECORDED TO LEDGER") {
        res.status(201).send(blockchainResponse);
      } else {
        res.status(409).send(blockchainResponse);
      }
      log("info", "DONE.");
    } catch (e) {
      res.status(400).send(e);
      log("error", "DONE.");
    }
  }
);

// http://localhost:9000/api/v1/utilityemissionchannel/emissionscontract/getEmissionsData/:utilityId/:partyId/:fromDate/:thruDate";

export const GET_EMISSIONS_DATA =
  "/api/" + APP_VERSION + "/utilityemissionchannel/emissionscontract/getEmissionsData/:userId/:orgName/:uuid";
router.get(
  GET_EMISSIONS_DATA,
  [param("userId").isString(), param("orgName").isString(), param("uuid").isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const userId = req.params.userId;
      const orgName = req.params.orgName;
      const uuid = req.params.uuid;

      console.log(`# GETTING EMISSIONS DATA FROM UTILITYEMISSIONS CHANNEL`);

      // Get Emmission Data from utilityEmissions Channel
      const blockchainResponse = await EmissionsContractInvoke.getEmissionsData(userId, orgName, uuid);

      if (blockchainResponse["info"] === "UTILITY EMISSIONS DATA") {
        res.status(200).send(blockchainResponse);
      } else {
        res.status(409).send(blockchainResponse);
      }
      log("info", "DONE.");
    } catch (e) {
      res.status(400).send(e);
      log("error", "DONE.");
    }
  }
);

export const GET_ALL_EMISSIONS_DATA =
  "/api/" +
  APP_VERSION +
  "/utilityemissionchannel/emissionscontract/getAllEmissionsData/:userId/:orgName/:utilityId/:partyId";
router.get(GET_ALL_EMISSIONS_DATA, [param("userId").isString(), param("orgName").isString()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(412).json({ errors: errors.array() });
  }
  try {
    const userId = req.params.userId;
    const orgName = req.params.orgName;
    const utilityId = req.params.utilityId;
    const partyId = req.params.partyId;

    console.log(`# GETTING EMISSIONS DATA FROM UTILITYEMISSIONS CHANNEL`);

    // Get Emmission Data from utilityEmissions Channel
    const blockchainResponse = await EmissionsContractInvoke.getAllEmissionsData(userId, orgName, utilityId, partyId);

    if (Array.isArray(blockchainResponse)) {
      res.status(200).send(blockchainResponse);
    } else {
      res.status(409).send(blockchainResponse);
    }
    log("info", "DONE.");
  } catch (e) {
    res.status(400).send(e);
    log("error", "DONE.");
  }
});

export const GET_ALL_EMISSIONS_DATA_BY_DATE_RANGE =
  "/api/" +
  APP_VERSION +
  "/utilityemissionchannel/emissionscontract/getAllEmissionsDataByDateRange/:userId/:orgName/:fromDate/:thruDate";
router.get(
  GET_ALL_EMISSIONS_DATA_BY_DATE_RANGE,
  [
    param("userId").isString(),
    param("orgName").isString(),
    param("fromDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error("Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
    param("thruDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error("Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const userId = req.params.userId;
      const orgName = req.params.orgName;
      const fromDate = req.params.fromDate;
      const thruDate = req.params.thruDate;

      console.log(`# GETTING EMISSIONS DATA FROM UTILITYEMISSIONS CHANNEL BY DATE RANGE`);

      // Get Emmission Data from utilityEmissions Channel
      const blockchainResponse = await EmissionsContractInvoke.getAllEmissionsDataByDateRange(
        userId,
        orgName,
        fromDate,
        thruDate
      );

      if (Array.isArray(blockchainResponse)) {
        res.status(200).send(blockchainResponse);
      } else {
        res.status(409).send(blockchainResponse);
      }
      log("info", "DONE.");
    } catch (e) {
      res.status(400).send(e);
      log("error", "DONE.");
    }
  }
);

export const RECORD_AUDITED_EMISSIONS_TOKEN =
  "/api/" +
  APP_VERSION +
  "/utilityemissionchannel/emissionscontract/recordAuditedEmissionsToken/:userId/:orgName/:addressToIssue/:fromDate/:thruDate/:automaticRetireDate/:metadata/:description";
router.get(
  RECORD_AUDITED_EMISSIONS_TOKEN,
  [
    param("userId").isString(),
    param("orgName").isString(),
    param("addressToIssue").isString(),
    param("fromDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error("Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
    param("thruDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error("Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const userId = req.params.userId;
      const orgName = req.params.orgName;
      const addressToIssue = req.params.addressToIssue;
      const fromDate = req.params.fromDate;
      const thruDate = req.params.thruDate;
      const automaticRetireDate = new Date().toISOString();
      const description = "Audited Utility Emissions";
      let metadata = new Object();
      metadata["org"] = orgName;
      metadata["renewableEnergyUseAmount"] = 0;
      metadata["nonrenewableEnergyUseAmount"] = 0;
      metadata["utilityIds"] = [];
      metadata["energyUseUoms"] = [];
      metadata["factorSources"] = [];
      metadata["urls"] = [];
      metadata["md5s"] = [];

      let quantity = 0;
      let manifest = [];

      // Get Emmission Data from utilityEmissions Channel
      const blockchainResponse = await EmissionsContractInvoke.getAllEmissionsDataByDateRange(
        userId,
        orgName,
        fromDate,
        thruDate
      );

      if (Array.isArray(blockchainResponse)) {
        for (let entry of blockchainResponse) {
          if (!metadata["utilityIds"].includes(entry.utilityId)) {
            metadata["utilityIds"].push(entry.utilityId);
          }
          if (!metadata["energyUseUoms"].includes(entry.energyUseUom)) {
            metadata["energyUseUoms"].push(entry.energyUseUom);
          }
          if (!metadata["factorSources"].includes(entry.factorSource)) {
            metadata["factorSources"].push(entry.factorSource);
          }
          if (entry.md5 != "") {
            metadata["md5s"].push(entry.md5);
          }
          if (entry.url != "") {
            metadata["urls"].push(entry.url);
          }
          metadata["renewableEnergyUseAmount"] += entry.renewableEnergyUseAmount;
          metadata["nonrenewableEnergyUseAmount"] += entry.nonrenewableEnergyUseAmount;

          quantity += entry.emissionsAmount;
          manifest.push(entry.uuid);
        }
      } else {
        res.status(409).send(blockchainResponse);
      }

      let tokenId = await issue(
        addressToIssue,
        quantity.toFixed(2),
        toTimestamp(fromDate),
        toTimestamp(thruDate),
        toTimestamp(automaticRetireDate).toFixed(),
        metadata,
        manifest.join(", "),
        description
      );

      // upsert tokenId to all entries retrieved from the register
      for (let entry of blockchainResponse) {
        let updateRecord = await EmissionsContractInvoke.updateEmissionsRecord(
          userId,
          orgName,
          entry.uuid,
          entry.utilityId,
          entry.partyId,
          entry.fromDate,
          entry.thruDate,
          entry.emissionsAmount,
          entry.renewableEnergyUseAmount,
          entry.nonrenewableEnergyUseAmount,
          entry.energyUseUom,
          entry.factorSource,
          entry.url,
          entry.md5,
          tokenId
        );
      }

      let result: Object = new Object();
      result["info"] = "AUDITED EMISSIONS TOKEN RECORDED";
      result["tokenId"] = tokenId;
      result["quantity"] = quantity;
      result["fromDate"] = fromDate;
      result["thruDate"] = thruDate;
      result["automaticRetireDate"] = automaticRetireDate;
      result["metadata"] = metadata;
      result["manifest"] = manifest.join(", ");
      result["description"] = description;

      res.status(200).send(result);
      log("info", "DONE.");
    } catch (e) {
      res.status(400).send(e);
      log("error", "DONE.");
    }
  }
);
