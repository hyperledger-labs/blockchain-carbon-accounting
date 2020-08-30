/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require('fs')

async function recordEmissions(utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom) {
  try {
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get("User1@auditor1.carbonAccounting.com");
    if (!identity) {
      console.log(
        'An identity for the user "User1" does not exist in the wallet'
      );
      console.log("Register user before retrying");
      return;
    }

    const connectionProfileJson = (await fs.promises.readFile('../organizations/peerOrganizations/auditor1.carbonAccounting.com/connection-auditor1.json')).toString();
    const connectionProfile = JSON.parse(connectionProfileJson, 'utf8');
    const gateway = new Gateway();
    try {
      await gateway.connect(connectionProfile, {
        wallet,
        identity: "User1@auditor1.carbonAccounting.com",
        discovery: { "enabled": true, "asLocalhost": true }
      });
    }
    catch (err) {
      console.log("ERROR: " + err)
    }

    const network = await gateway.getNetwork('utilityemissionchannel');

    const contract = network.getContract('emissionscontract');

    // ###### Record Emissions ######
    await contract.submitTransaction('recordEmissions', utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom);

    // TODO: Add contract listener to wait for event of chaincode. 

    // Disconnect from the gateway.
    await gateway.disconnect();

    // Return result
    let result = new Object();
    result["info"] = "EMISSION RECORDED TO LEDGER";
    result["utilityId"] = utilityId;
    result["partyId"] = partyId;
    result["fromDate"] = fromDate;
    result["thruDate"] = thruDate;
    result["energyUseAmount"] = energyUseAmount;
    result["energyUseUom"] = energyUseUom;
    console.log(result)
    return result;

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}


async function getEmissionsData(utilityId, partyId, fromDate, thruDate) {
  try {
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get("User1@auditor1.carbonAccounting.com");
    if (!identity) {
      console.log(
        'An identity for the user "User1" does not exist in the wallet'
      );
      console.log("Register user before retrying");
      return;
    }

    const connectionProfileJson = (await fs.promises.readFile('../organizations/peerOrganizations/auditor1.carbonAccounting.com/connection-auditor1.json')).toString();
    const connectionProfile = JSON.parse(connectionProfileJson, 'utf8');
    const gateway = new Gateway();
    try {
      await gateway.connect(connectionProfile, {
        wallet,
        identity: "User1@auditor1.carbonAccounting.com",
        discovery: { "enabled": true, "asLocalhost": true }
      });
    }
    catch (err) {
      console.log("ERROR: " + err)
    }

    const network = await gateway.getNetwork('utilityemissionchannel');

    const contract = network.getContract('emissionscontract');

    // ###### Get Emissions Data ######
    const blockchainResult = await contract.evaluateTransaction('getEmissionsData', utilityId, partyId, fromDate, thruDate);
    const stringResult = blockchainResult.toString('utf8')
    const jsonResult = JSON.parse(stringResult)

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
    console.log(result)
    return result;
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    process.exit(1);
  }
}

module.exports = {
  recordEmissions,
  getEmissionsData
};
