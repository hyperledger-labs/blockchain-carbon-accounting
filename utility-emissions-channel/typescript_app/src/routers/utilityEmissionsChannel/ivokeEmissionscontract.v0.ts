import express from "express";
import { log } from "../../utils/log";
import { body, param, validationResult } from "express-validator";
import { EmissionsContractInvoke } from "../../blockchain-gateway/utilityEmissionsChannel/emissionsContractInvoke";

const APP_VERSION = "v1";
export const router = express.Router();

// http://localhost:9000/api/v1//utilityemissionchannel/emissionscontract/recordEmissions
export const RECORD_EMISSIONS =
  "/api/" +
  APP_VERSION +
  "/utilityemissionchannel/emissionscontract/recordEmissions";
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
        throw new Error(
          "Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)"
        );
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
    body("thruDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error(
          "Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)"
        );
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
        energyUseUom
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
  "/api/" +
  APP_VERSION +
  "/utilityemissionchannel/emissionscontract/getEmissionsData/:userId/:orgName/:utilityId/:partyId/:fromDate/:thruDate";
router.get(
  GET_EMISSIONS_DATA,
  [
    param("userId").isString(),
    param("orgName").isString(),
    param("utilityId").isString(),
    param("partyId").isString(),
    param("fromDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error(
          "Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)"
        );
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
    param("thruDate").custom((value, { req }) => {
      let matches = value.match(
        /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z)?$/
      );
      if (!matches) {
        throw new Error(
          "Date is required to be in ISO 6801 format (i.e 2016-04-06T10:10:09Z)"
        );
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
      const utilityId = req.params.utilityId;
      const partyId = req.params.partyId;
      const fromDate = req.params.fromDate;
      const thruDate = req.params.thruDate;

      console.log(`# GETTING EMISSIONS DATA FROM UTILITYEMISSIONS CHANNEL`);

      // Get Emmission Data from utilityEmissions Channel
      const blockchainResponse = await EmissionsContractInvoke.getEmissionsData(
        userId,
        orgName,
        utilityId,
        partyId,
        fromDate,
        thruDate
      );

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
router.get(
  GET_ALL_EMISSIONS_DATA,
  [param("userId").isString(), param("orgName").isString()],
  async (req, res) => {
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
      const blockchainResponse = await EmissionsContractInvoke.getAllEmissionsData(
        userId,
        orgName,
        utilityId,
        partyId
      );
      if (blockchainResponse.length > 0) {
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
