import express from "express";
import { log } from "../../utils/log";
import { body, validationResult } from "express-validator";
import { EmissionsContractInvoke } from "../../blockchain-gateway/utilityEmissionsChannel/registerEnroll";

const APP_VERSION = "v1";
export const router = express.Router();

// http://localhost:9000/api/v1/utilityemissionchannel/registerEnroll/user
export const REGISTER_ENROLL_USER =
  "/api/" + APP_VERSION + "/utilityemissionchannel/registerEnroll/user";
router.post(
  REGISTER_ENROLL_USER,
  [
    body("userId").isString(),
    body("orgName").isString(),
    body("affiliation").isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const userId = req.body.userId;
      const orgName = req.body.orgName;
      const affiliation = req.body.affiliation;

      console.log(`# REGISTERING AND ENROLLING USER `);

      // Record Emission to utilityEmissions Channel
      const blockchainResponse = await EmissionsContractInvoke.registerUser(
        userId,
        orgName,
        affiliation
      );

      if (blockchainResponse["info"] === "USER REGISTERED AND ENROLLED") {
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

// http://localhost:9000/api/v1/utilityemissionchannel/registerEnroll/admin
export const REGISTER_ORG_ADMIN =
  "/api/" + APP_VERSION + "/utilityemissionchannel/registerEnroll/admin";
router.post(
  REGISTER_ORG_ADMIN,
  [body("orgName").isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(412).json({ errors: errors.array() });
    }
    try {
      const orgName = req.body.orgName;

      console.log(`# REGISTERING ORG ADMIN `);

      // Register org admin
      const blockchainResponse = await EmissionsContractInvoke.registerOrgAdmin(
        orgName
      );

      if (blockchainResponse["info"] === "ORG ADMIN REGISTERED") {
        res.status(201).send(blockchainResponse);
      } else {
        res.status(409).send(blockchainResponse);
      }
      log("info", "DONE.");
    } catch (e) {
      res.status(400).send(e);
      log("error", "DONE.");
    } finally {
      // process.exit(1);
    }
  }
);
