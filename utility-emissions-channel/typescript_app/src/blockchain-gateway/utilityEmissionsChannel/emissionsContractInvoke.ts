/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import { Gateway, Wallets } from "fabric-network";
const path = require("path");
import { setOrgDataCA } from "../utils/caUtils";
import {
  buildCCPAuditor1,
  buildCCPAuditor2,
  buildCCPAuditor3,
  buildWallet,
  setWalletPathByOrg,
} from "../utils/gatewayUtils";
import { getNewUuid } from "../utils/uuid";
import { checkDateConflict } from "../utils/checkDateConflict";

export class EmissionsContractInvoke {
  constructor(message: string) {}

  static async recordEmissions(
    userId,
    orgName,
    utilityId,
    partyId,
    fromDate,
    thruDate,
    energyUseAmount,
    energyUseUom,
    url
  ) {
    try {
      let response = "";

      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet = await buildWallet(Wallets, walletPath);

      const gateway = new Gateway();

      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: true },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network = await gateway.getNetwork("utilityemissionchannel");
      const contract = network.getContract("emissionscontract");

      // ###### Record Emissions ######
      let uuid = getNewUuid();
      const blockchainResult = await contract.submitTransaction(
        "recordEmissions",
        uuid,
        utilityId,
        partyId,
        fromDate,
        thruDate,
        energyUseAmount,
        energyUseUom,
        url
      );
      const stringResult = blockchainResult.toString("utf-8");
      const jsonResult = JSON.parse(stringResult);

      // TODO: Add contract listener to wait for event of chaincode.

      // Disconnect from the gateway.
      // finally --> {}
      await gateway.disconnect();

      // Return result
      let result = new Object();
      result["info"] = "EMISSION RECORDED TO LEDGER";
      result["utilityId"] = jsonResult.utilityId;
      result["partyId"] = jsonResult.partyId;
      result["fromDate"] = jsonResult.fromDate;
      result["thruDate"] = jsonResult.thruDate;
      result["energyUseAmount"] = jsonResult.emissionsAmount;
      result["energyUseUom"] = jsonResult.emissionsUom;
      result["renewableEnergyUseAmount"] = jsonResult.renewableEnergyUseAmount;
      result["nonrenewableEnergyUseAmount"] = jsonResult.nonrenewableEnergyUseAmount;
      result["energyUseUom"] = jsonResult.energyUseUom;
      result["factorSource"] = jsonResult.factorSource;
      result["url"] = jsonResult.url;

      console.log(result);
      return result;
    } catch (error) {
      let result = new Object();
      result["info"] = `Failed to submit transaction: ${error}`;
      result["utilityId"] = utilityId;
      result["partyId"] = partyId;
      result["fromDate"] = fromDate;
      result["thruDate"] = thruDate;
      result["energyUseAmount"] = energyUseAmount;
      result["energyUseUom"] = energyUseUom;

      console.error(`Failed to submit transaction: ${error}`);
      console.log(result);
      return result;
      // process.exit(1);
    }
  }

  static async getEmissionsData(userId, orgName, uuid) {
    try {
      let response = "";
      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet = await buildWallet(Wallets, walletPath);

      const gateway = new Gateway();
      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: true },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network = await gateway.getNetwork("utilityemissionchannel");

      const contract = network.getContract("emissionscontract");

      // ###### Get Emissions Data ######
      const blockchainResult = await contract.evaluateTransaction("getEmissionsData", uuid);
      const stringResult = blockchainResult.toString("utf-8");
      const jsonResult = JSON.parse(stringResult);

      // Disconnect from the gateway.
      await gateway.disconnect();

      // Return result
      let result = new Object();
      result["info"] = "UTILITY EMISSIONS DATA";
      result["utilityId"] = jsonResult.utilityId;
      result["partyId"] = jsonResult.partyId;
      result["fromDate"] = jsonResult.fromDate;
      result["thruDate"] = jsonResult.thruDate;
      result["emissionsAmount"] = jsonResult.emissionsAmount;
      result["emissionsUom"] = jsonResult.emissionsUom;
      result["renewableEnergyUseAmount"] = jsonResult.renewableEnergyUseAmount;
      result["nonrenewableEnergyUseAmount"] = jsonResult.nonrenewableEnergyUseAmount;
      result["energyUseUom"] = jsonResult.energyUseUom;
      result["factorSource"] = jsonResult.factorSource;
      result["url"] = jsonResult.url;

      console.log(result);
      return result;
    } catch (error) {
      let result = new Object();
      result["info"] = `Failed to evaluate transaction: ${error}`;
      result["uuid"] = uuid;
      console.error(`Failed to evaluate transaction: ${error}`);
      console.log(result);
      return result;
      // process.exit(1);
    }
  }

  static async getAllEmissionsData(userId, orgName, utilityId, partyId) {
    try {
      let response = "";
      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet = await buildWallet(Wallets, walletPath);

      const gateway = new Gateway();
      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: true },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network = await gateway.getNetwork("utilityemissionchannel");

      const contract = network.getContract("emissionscontract");

      // ###### Get Emissions Data ######
      const blockchainResult = await contract.evaluateTransaction("getAllEmissionsData", utilityId, partyId);
      const stringResult = blockchainResult.toString();
      const jsonResult = JSON.parse(stringResult);

      // Disconnect from the gateway.
      await gateway.disconnect();

      // Return result
      let all_emissions = [];
      let current_year = new Date().getFullYear();
      for (let emission_item of jsonResult) {
        let result = new Object();
        let record = emission_item.Record;

        // Do not include entries outside of the past year
        // var current_year = current_date.getFullYear();
        if (parseInt(record.fromDate.slice(0, 4)) < current_year - 1) {
          continue;
        }

        result["info"] = "UTILITY EMISSIONS DATA";
        result["utilityId"] = record.utilityId;
        result["partyId"] = record.partyId;
        result["fromDate"] = record.fromDate;
        result["thruDate"] = record.thruDate;
        result["emissionsAmount"] = record.emissionsAmount;
        result["emissionsUom"] = record.emissionsUom;
        result["renewableEnergyUseAmount"] = record.renewableEnergyUseAmount;
        result["nonrenewableEnergyUseAmount"] = record.nonrenewableEnergyUseAmount;
        result["energyUseUom"] = record.energyUseUom;
        result["factorSource"] = record.factorSource;
        result["url"] = record.url;

        all_emissions.push(result);
      }
      console.log(all_emissions);
      return all_emissions;
    } catch (error) {
      let result = new Object();
      let all_emissions = [];

      result["info"] = `Failed to evaluate transaction: ${error}`;

      console.error(`Failed to evaluate transaction: ${error}`);
      return all_emissions;
      // process.exit(1);
    }
  }

  static async checkDateOverlap(userId, orgName, utilityId, partyId, fromDate, thruDate) {
    let response = "";

    let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

    const walletPath = setWalletPathByOrg(orgName);
    console.log("+++++++++++++++++ Walletpath: " + walletPath);
    const wallet = await buildWallet(Wallets, walletPath);

    const gateway = new Gateway();

    try {
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: true },
      });
    } catch (err) {
      response = `ERROR: ${err}`;
      console.log(response);
      return response;
    }

    const network = await gateway.getNetwork("utilityemissionchannel");
    const contract = network.getContract("emissionscontract");

    // Check for date overlap

    // Get Emissions for utilityID and partyId to compare
    const allEmissionsResult = await contract.evaluateTransaction("getAllEmissionsData", utilityId, partyId);
    const allEmissionsString = allEmissionsResult.toString();
    const jsonEmissionsResult = JSON.parse(allEmissionsString);

    // Compare each entry against incoming emissions record
    for (let emission_item of jsonEmissionsResult) {
      let record = emission_item.Record;

      let fromDateToCheck = record.fromDate;
      let thruDateToCheck = record.thruDate;

      let overlap = checkDateConflict(fromDateToCheck, thruDateToCheck, fromDate, thruDate);
      if (overlap) {
        throw new Error(
          `Supplied dates ${fromDate} to ${thruDate} overlap with an existing dates ${fromDateToCheck} to ${thruDateToCheck}.`
        );
      }
    }
  }
}
