const express = require("express");
const chalk = require("chalk");
const { log } = require("../../utils/log");
const { body, query, check, param, validationResult } = require("express-validator");
const emissionsContractInvoke = require("../../blockchain-gateway/utilityEmissionsChannel/emissionsContractInvoke");


const APP_VERSION = "v1";
const router = new express.Router();

// http://localhost:9000/api/v1//utilityemissionchannel/emissionscontract/recordEmissions
const RECORD_EMISSIONS = "/api/" + APP_VERSION + "/utilityemissionchannel/emissionscontract/recordEmissions";
router.post(
  RECORD_EMISSIONS,
  [
    body("userId").isString(),
    body("orgName").isString(),
    body("utilityId").isString(),
    body("partyId").isString(),
    body("fromDate").isString(),
    body("thruDate").isString(),
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

      console.log(
        `# RECORDING EMISSIONS DATA TO UTILITYEMISSIONS CHANNEL`
      );

      // Record Emission to utilityEmissions Channel
      const blockchainResponse = await emissionsContractInvoke.recordEmissions(
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

const GET_EMISSIONS_DATA = "/api/" + APP_VERSION + "/utilityemissionchannel/emissionscontract/getEmissionsData/:userId/:orgName/:utilityId/:partyId/:fromDate/:thruDate";
router.get(
  GET_EMISSIONS_DATA,
  [
    param("userId").isString(),
    param("orgName").isString(),
    param("utilityId").isString(),
    param("partyId").isString(),
    param("fromDate").isString(),
    param("thruDate").isString()
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

      console.log(
        `# GETTING EMISSIONS DATA FROM UTILITYEMISSIONS CHANNEL`
      );

      // Get Emmission Data from utilityEmissions Channel 
      const blockchainResponse = await emissionsContractInvoke.getEmissionsData(
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


module.exports = router;