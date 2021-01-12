/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import { Contract, Gateway, Network, Wallet, Wallets } from "fabric-network";
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
import { checkDateConflict } from "../utils/dateUtils";
import { Md5 } from "ts-md5/dist/md5";
import { downloadFromS3 } from "../../blockchain-gateway/utils/aws";

export class EmissionsContractInvoke {
  constructor(message: string) {}

  static async recordEmissions(
    userId: any,
    orgName: any,
    utilityId: string,
    partyId: string,
    fromDate: string,
    thruDate: string,
    energyUseAmount: string,
    energyUseUom: string,
    url: string,
    md5: string
  ) {
    try {
      let response = "";

      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath: string = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);

      const gateway: Gateway = new Gateway();

      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: false },
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
      const blockchainResult: Buffer = await contract.submitTransaction(
        "recordEmissions",
        uuid,
        utilityId,
        partyId,
        fromDate,
        thruDate,
        energyUseAmount,
        energyUseUom,
        url,
        md5
      );
      const stringResult: string = blockchainResult.toString("utf-8");
      const jsonResult: any = JSON.parse(stringResult);

      // TODO: Add contract listener to wait for event of chaincode.

      // Disconnect from the gateway.
      // finally --> {}
      await gateway.disconnect();

      // Return result
      let result = new Object();
      result["info"] = "EMISSION RECORDED TO LEDGER";
      result["uuid"] = jsonResult.uuid;
      result["utilityId"] = jsonResult.utilityId;
      result["partyId"] = jsonResult.partyId;
      result["fromDate"] = jsonResult.fromDate;
      result["thruDate"] = jsonResult.thruDate;
      result["energyUseAmount"] = jsonResult.emissionsAmount;
      result["renewableEnergyUseAmount"] = jsonResult.renewableEnergyUseAmount;
      result["nonrenewableEnergyUseAmount"] = jsonResult.nonrenewableEnergyUseAmount;
      result["energyUseUom"] = jsonResult.energyUseUom;
      result["factorSource"] = jsonResult.factorSource;
      result["url"] = jsonResult.url;
      result["md5"] = jsonResult.md5;

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

  static async updateEmissionsRecord(
    userId,
    orgName,
    uuid,
    utilityId,
    partyId,
    fromDate,
    thruDate,
    emissionsAmount,
    renewable_energy_use_amount,
    nonrenewable_energy_use_amount,
    energyUseUom,
    factor_source,
    url,
    md5,
    tokenId
  ) {
    try {
      let response = "";

      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath: string = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);

      const gateway: Gateway = new Gateway();

      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: false },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network = await gateway.getNetwork("utilityemissionchannel");
      const contract = network.getContract("emissionscontract");
      // ###### Update Emissions Record ######
      const blockchainResult: Buffer = await contract.submitTransaction(
        "updateEmissionsRecord",
        uuid,
        utilityId,
        partyId,
        fromDate,
        thruDate,
        emissionsAmount,
        renewable_energy_use_amount,
        nonrenewable_energy_use_amount,
        energyUseUom,
        factor_source,
        url,
        md5,
        tokenId
      );
      const stringResult: string = blockchainResult.toString("utf-8");
      const jsonResult: any = JSON.parse(stringResult);

      // TODO: Add contract listener to wait for event of chaincode.

      // Disconnect from the gateway.
      // finally --> {}
      await gateway.disconnect();

      // Return result
      let result = new Object();
      result["info"] = "EMISSION RECORDED TO LEDGER";
      result["uuid"] = jsonResult.uuid;
      result["utilityId"] = jsonResult.utilityId;
      result["partyId"] = jsonResult.partyId;
      result["fromDate"] = jsonResult.fromDate;
      result["thruDate"] = jsonResult.thruDate;
      result["energyUseAmount"] = jsonResult.emissionsAmount;
      result["renewableEnergyUseAmount"] = jsonResult.renewableEnergyUseAmount;
      result["nonrenewableEnergyUseAmount"] = jsonResult.nonrenewableEnergyUseAmount;
      result["energyUseUom"] = jsonResult.energyUseUom;
      result["factorSource"] = jsonResult.factorSource;
      result["url"] = jsonResult.url;
      result["md5"] = jsonResult.md5;
      result["tokenId"] = jsonResult.tokenId;

      console.log(result);
      return result;
    } catch (error) {
      let result = new Object();
      result["info"] = `Failed to submit transaction: ${error}`;

      console.error(`Failed to submit transaction: ${error}`);
      console.log(result);
      return result;
      // process.exit(1);
    }
  }

  static async getEmissionsData(userId: any, orgName: any, uuid: string) {
    try {
      let response: string = "";
      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath: string = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);

      const gateway: Gateway = new Gateway();
      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: false },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network: Network = await gateway.getNetwork("utilityemissionchannel");

      const contract: Contract = network.getContract("emissionscontract");

      // ###### Get Emissions Data ######
      const blockchainResult: Buffer = await contract.evaluateTransaction("getEmissionsData", uuid);
      const stringResult: string = blockchainResult.toString("utf-8");
      const jsonResult: any = JSON.parse(stringResult);

      if (jsonResult.url.length > 0) {
        try {
          // compare md5 in ledger against one being returned in url
          let incomingBinary: any = await downloadFromS3(
            `${userId}-${orgName}-${jsonResult.utilityId}-${jsonResult.partyId}-${jsonResult.fromDate}-${jsonResult.thruDate}.pdf`
          );
          let incomingMd5 = Md5.hashStr(incomingBinary);
          if (incomingMd5 != jsonResult.md5) {
            throw new Error(
              `The retrieved document ${jsonResult.url} has a different MD5 hash than recorded on the ledger. This file may have been tampered with. `
            );
          }
        } catch (err) {
          console.log("Failed to download from URL");
        }
      }

      // Disconnect from the gateway.
      await gateway.disconnect();

      // Return result
      let result: Object = new Object();
      result["info"] = "UTILITY EMISSIONS DATA";
      result["uuid"] = jsonResult.uuid;
      result["utilityId"] = jsonResult.utilityId;
      result["partyId"] = jsonResult.partyId;
      result["fromDate"] = jsonResult.fromDate;
      result["thruDate"] = jsonResult.thruDate;
      result["emissionsAmount"] = jsonResult.emissionsAmount;
      result["renewableEnergyUseAmount"] = jsonResult.renewableEnergyUseAmount;
      result["nonrenewableEnergyUseAmount"] = jsonResult.nonrenewableEnergyUseAmount;
      result["energyUseUom"] = jsonResult.energyUseUom;
      result["factorSource"] = jsonResult.factorSource;
      result["url"] = jsonResult.url;
      result["md5"] = jsonResult.md5;
      result["tokenId"] = jsonResult.tokenId;

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

  static async getAllEmissionsData(userId: any, orgName: any, utilityId: string, partyId: string) {
    try {
      let response: string = "";
      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath: string = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);

      const gateway: Gateway = new Gateway();
      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: false },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network: Network = await gateway.getNetwork("utilityemissionchannel");

      const contract: Contract = network.getContract("emissionscontract");

      // ###### Get Emissions Data ######
      const blockchainResult: Buffer = await contract.evaluateTransaction("getAllEmissionsData", utilityId, partyId);
      const stringResult: string = blockchainResult.toString();
      const jsonResult: any = JSON.parse(stringResult);

      // Disconnect from the gateway.
      await gateway.disconnect();

      // Return result
      let all_emissions: any[] = [];
      let current_year: number = new Date().getFullYear();
      for (let emission_item of jsonResult) {
        let result: Object = new Object();
        let record = emission_item.Record;
        if (record.url.length > 0) {
          try {
            // compare md5 in ledger against one being returned in url
            let incomingBinary: any = await downloadFromS3(
              `${userId}-${orgName}-${jsonResult.utilityId}-${jsonResult.partyId}-${jsonResult.fromDate}-${jsonResult.thruDate}.pdf`
            );
            let incomingMd5 = Md5.hashStr(incomingBinary);
            if (incomingMd5 != jsonResult.md5) {
              throw new Error(
                `The retrieved document ${jsonResult.url} has a different MD5 hash than recorded on the ledger. This file may have been tampered with. `
              );
            }
          } catch (err) {
            console.log("Failed to download from URL");
          }
        }

        // Do not include entries outside of the past year
        // var current_year = current_date.getFullYear();
        if (parseInt(record.fromDate.slice(0, 4)) < current_year - 1) {
          continue;
        }

        result["info"] = "UTILITY EMISSIONS DATA";
        result["uuid"] = record.uuid;
        result["utilityId"] = record.utilityId;
        result["partyId"] = record.partyId;
        result["fromDate"] = record.fromDate;
        result["thruDate"] = record.thruDate;
        result["emissionsAmount"] = record.emissionsAmount;
        result["renewableEnergyUseAmount"] = record.renewableEnergyUseAmount;
        result["nonrenewableEnergyUseAmount"] = record.nonrenewableEnergyUseAmount;
        result["energyUseUom"] = record.energyUseUom;
        result["factorSource"] = record.factorSource;
        result["url"] = record.url;
        result["md5"] = record.md5;
        result["tokenId"] = record.tokenId;

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

  static async getAllEmissionsDataByDateRange(userId: any, orgName: any, fromDate: string, thruDate: string) {
    try {
      let response: string = "";
      let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

      const walletPath: string = setWalletPathByOrg(orgName);
      console.log("+++++++++++++++++ Walletpath: " + walletPath);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);

      const gateway: Gateway = new Gateway();
      try {
        await gateway.connect(ccp, {
          wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: false },
        });
      } catch (err) {
        response = `ERROR: ${err}`;
        console.log(response);
        return response;
      }

      const network: Network = await gateway.getNetwork("utilityemissionchannel");

      const contract: Contract = network.getContract("emissionscontract");

      // ###### Get Emissions Data ######
      const blockchainResult: Buffer = await contract.evaluateTransaction(
        "getAllEmissionsDataByDateRange",
        fromDate,
        thruDate
      );
      const stringResult: string = blockchainResult.toString();
      const jsonResult: any = JSON.parse(stringResult);

      // Disconnect from the gateway.
      await gateway.disconnect();

      // Return result
      let all_emissions: any[] = [];
      for (let emission_item of jsonResult) {
        let result: Object = new Object();
        let record = emission_item.Record;
        if (record.url.length > 0) {
          try {
            // compare md5 in ledger against one being returned in url
            let incomingBinary: any = await downloadFromS3(
              `${userId}-${orgName}-${jsonResult.utilityId}-${jsonResult.partyId}-${jsonResult.fromDate}-${jsonResult.thruDate}.pdf`
            );
            let incomingMd5 = Md5.hashStr(incomingBinary);
            if (incomingMd5 != jsonResult.md5) {
              throw new Error(
                `The retrieved document ${jsonResult.url} has a different MD5 hash than recorded on the ledger. This file may have been tampered with. `
              );
            }
          } catch (err) {
            console.log("Failed to download from URL");
          }
        }
        result["info"] = "UTILITY EMISSIONS DATA";
        result["uuid"] = record.uuid;
        result["utilityId"] = record.utilityId;
        result["partyId"] = record.partyId;
        result["fromDate"] = record.fromDate;
        result["thruDate"] = record.thruDate;
        result["emissionsAmount"] = record.emissionsAmount;
        result["renewableEnergyUseAmount"] = record.renewableEnergyUseAmount;
        result["nonrenewableEnergyUseAmount"] = record.nonrenewableEnergyUseAmount;
        result["energyUseUom"] = record.energyUseUom;
        result["factorSource"] = record.factorSource;
        result["url"] = record.url;
        result["md5"] = record.md5;

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

  static async checkDateOverlap(
    userId: any,
    orgName: any,
    utilityId: string,
    partyId: string,
    fromDate: any,
    thruDate: any
  ) {
    let response = "";

    let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

    const walletPath: string = setWalletPathByOrg(orgName);
    console.log("+++++++++++++++++ Walletpath: " + walletPath);
    const wallet: any = await buildWallet(Wallets, walletPath);

    const gateway: Gateway = new Gateway();

    try {
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });
    } catch (err) {
      response = `ERROR: ${err}`;
      console.log(response);
      return response;
    }

    const network: Network = await gateway.getNetwork("utilityemissionchannel");
    const contract: Contract = network.getContract("emissionscontract");

    // Check for date overlap

    // Get Emissions for utilityID and partyId to compare
    const allEmissionsResult: Buffer = await contract.evaluateTransaction("getAllEmissionsData", utilityId, partyId);
    const allEmissionsString: string = allEmissionsResult.toString();
    const jsonEmissionsResult: any = JSON.parse(allEmissionsString);

    // Compare each entry against incoming emissions record
    for (let emission_item of jsonEmissionsResult) {
      let record = emission_item.Record;

      let fromDateToCheck = record.fromDate;
      let thruDateToCheck = record.thruDate;

      let overlap: boolean = checkDateConflict(fromDateToCheck, thruDateToCheck, fromDate, thruDate);
      if (overlap) {
        throw new Error(
          `Supplied dates ${fromDate} to ${thruDate} overlap with an existing dates ${fromDateToCheck} to ${thruDateToCheck}.`
        );
      }
    }
  }
}
