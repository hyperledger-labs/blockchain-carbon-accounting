// SPDX-License-Identifier: Apache-2.0
import { AES } from "crypto-js";
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
import { API_URL } from "../../config/config";

const APP_VERSION = "v1";
const PASSPHRASE = "secret passphrase";
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
      const partyId = AES.encrypt(req.body.partyId, PASSPHRASE).toString();
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
        try {
          md5 = Md5.hashStr(fileBin.toString()).toString();
        } catch (error) {
          console.error(error);
        }

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
    const partyId = AES.encrypt(req.params.partyId, PASSPHRASE).toString();

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

// required params:
// userId
// orgName
// addressToIssue
// emissionsRecordsToAudit
export const RECORD_AUDITED_EMISSIONS_TOKEN =
  "/api/" +
  APP_VERSION +
  "/utilityemissionchannel/emissionscontract/recordAuditedEmissionsToken";
router.post(
  RECORD_AUDITED_EMISSIONS_TOKEN,
  [
    body("userId").isString(),
    body("orgName").isString(),
    body("partyId").isString(),
    body("addressToIssue").isString(),
    body("emissionsRecordsToAudit").isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const userId = req.body.userId;
      const orgName = req.body.orgName;
      const partyId = AES.encrypt(req.body.partyId, PASSPHRASE).toString();
      const addressToIssue = req.body.addressToIssue;
      const emissionsRecordsToAudit = req.body.emissionsRecordsToAudit.toString().split(",");
      // @TODO: use automaticRetireDate parameter
      const automaticRetireDate = new Date().toISOString();
      const description = "Audited Utility Emissions";
      let metadata = new Object();
      metadata["org"] = orgName;
      metadata["type"] = "Utility Emissions";
      metadata["partyId"] = [];
      metadata["renewableEnergyUseAmount"] = 0;
      metadata["nonrenewableEnergyUseAmount"] = 0;
      metadata["utilityIds"] = [];
      metadata["factorSources"] = [];
      metadata["urls"] = [];
      metadata["md5s"] = [];
      metadata["fromDates"] = [];
      metadata["thruDates"] = [];

      let quantity = 0;
      let manifestIds = []; // stores uuids
      let fetchedEmissionsRecords = []; // stores fetched emissions records for updating tokenId on fabric after auditing

      // later, we look through the unix timestamp of all fetched emissions to find the earliest and latest dates
      // to populate the fromDate and toDate params on the Ethereum contract
      let fromDate = Number.MAX_SAFE_INTEGER;
      let thruDate = 0;

      // iterate through each emissions record UUID passed by user to API
      for (let uuid of emissionsRecordsToAudit) {

        // fetch details from the chaincode
        let emissionsRecord;
        try {
          emissionsRecord = await EmissionsContractInvoke.getEmissionsData(
            userId,
            orgName,
            uuid
          );
          fetchedEmissionsRecords.push(emissionsRecord);
        } catch (error) {
          console.error(`Error fetching emissions record of UUID ${uuid}`);
          console.error(error);
        }

        // skip entries that are already assigned a tokenId
        if (emissionsRecord.tokenId !== null) {
          let tokenIdSplit = emissionsRecord.tokenId.split(":");
          let contract = tokenIdSplit[0];
          let token = tokenIdSplit[1];
          console.log(`Skipping emissionsrecord with ID ${emissionsRecord.uuid}, already audited to token ${token} on contract ${contract}`);
          continue;
        }

        // check timestamps to find overall range of dates later
        let fetchedFromDate = toTimestamp(emissionsRecord.fromDate);
        if (fetchedFromDate < fromDate) {
          fromDate = fetchedFromDate;
        }
        let fetchedThruDate = toTimestamp(emissionsRecord.thruDate);
        if (toTimestamp(emissionsRecord.thruDate) > thruDate) {
          thruDate = fetchedThruDate;
        }

        if (emissionsRecord.fromDate != "" && emissionsRecord.thruDate != "") {
          metadata["fromDates"].push(emissionsRecord.fromDate);
          metadata["thruDates"].push(emissionsRecord.thruDate);
        }
        if (!metadata["utilityIds"].includes(emissionsRecord.utilityId)) {
          metadata["utilityIds"].push(emissionsRecord.utilityId);
        }
        if (!metadata["partyId"].includes(emissionsRecord.partyId)) {
          metadata["partyId"].push(emissionsRecord.partyId);
        }
        if (!metadata["factorSources"].includes(emissionsRecord.factorSource)) {
          metadata["factorSources"].push(emissionsRecord.factorSource);
        }
        if (emissionsRecord.md5 != "") {
          metadata["md5s"].push(emissionsRecord.md5);
        }
        if (emissionsRecord.url != "") {
          metadata["urls"].push(emissionsRecord.url);
        }
        metadata["renewableEnergyUseAmount"] += emissionsRecord.renewableEnergyUseAmount;
        metadata["nonrenewableEnergyUseAmount"] += emissionsRecord.nonrenewableEnergyUseAmount;

        quantity += ((emissionsRecord.emissionsAmount).toFixed(3) * 1000);
        manifestIds.push(emissionsRecord.uuid);
      }

      if (metadata["utilityIds"].length === 0) {
        throw new Error("No emissions records found; nothing to audit");
      }

      let manifest = "URL: " + API_URL + "/api/" + APP_VERSION + "/utilityemissionchannel/emissionscontract/getEmissionsData/, UUID: " + manifestIds.join(", ");
      console.log(`quantity: ${quantity}`);
      let tokenId = await issue(
        addressToIssue,
        quantity,
        fromDate,
        thruDate,
        toTimestamp(automaticRetireDate).toFixed(),
        JSON.stringify(metadata),
        manifest,
        description
      );

      // upsert tokenId to all entries retrieved from the register
      for (let emissionsRecord of fetchedEmissionsRecords) {
        let updateRecord = await EmissionsContractInvoke.updateEmissionsRecord(
          userId,
          orgName,
          emissionsRecord.uuid,
          emissionsRecord.utilityId,
          partyId,
          emissionsRecord.fromDate,
          emissionsRecord.thruDate,
          emissionsRecord.emissionsAmount,
          emissionsRecord.renewableEnergyUseAmount,
          emissionsRecord.nonrenewableEnergyUseAmount,
          emissionsRecord.energyUseUom,
          emissionsRecord.factorSource,
          emissionsRecord.url,
          emissionsRecord.md5,
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
      result["manifest"] = manifest;
      result["description"] = description;

      res.status(201).send(result);
      log("info", "DONE.");
    } catch (e) {
      res.status(400).send(e);
      log("error", "DONE.");
    }
  }
);
