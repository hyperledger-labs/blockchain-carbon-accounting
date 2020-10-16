/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";


const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { setOrgDataCA } = require('../utils/caUtils.js');
const { buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3, buildWallet, setWalletPathByOrg } = require('../utils/gatewayUtils.js');

async function recordEmissions(userId, orgName, utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom) {
  
  try {
    let response = "";

    let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

    const walletPath = setWalletPathByOrg(orgName);
    console.log("+++++++++++++++++ Walletpath: " + walletPath)
    const wallet = await buildWallet(Wallets, walletPath);

    const gateway = new Gateway();
    
    try {
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { "enabled": true, "asLocalhost": true }
      });

      
    }
    catch (err) {
      response = `ERROR: ${err}`
      console.log(response)
      return response
    }

    const network = await gateway.getNetwork('utilityemissionchannel');

    const contract = network.getContract('emissionscontract');

    // ###### Record Emissions ######
    await contract.submitTransaction('recordEmissions', utilityId, partyId, fromDate, thruDate, energyUseAmount, energyUseUom);

    // TODO: Add contract listener to wait for event of chaincode. 

    // Disconnect from the gateway.
    // finally --> {}
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
    let result = new Object(); 
    result["info"] = `Failed to submit transaction: ${error}`;
    result["utilityId"] = utilityId;
    result["partyId"] = partyId;
    result["fromDate"] = fromDate;
    result["thruDate"] = thruDate;
    result["energyUseAmount"] = energyUseAmount;
    result["energyUseUom"] = energyUseUom;
    console.error(`Failed to submit transaction: ${error}`);
    console.log(result)
    return result
    // process.exit(1);
  }
}


async function getEmissionsData(userId, orgName, utilityId, partyId, fromDate, thruDate) {
  try {
    let response = "";
    let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

    const walletPath = setWalletPathByOrg(orgName);
    console.log("+++++++++++++++++ Walletpath: " + walletPath)
    const wallet = await buildWallet(Wallets, walletPath);

    const gateway = new Gateway();
    try {
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { "enabled": true, "asLocalhost": true }
      });
    }
    catch (err) {
      response = `ERROR: ${err}`
      console.log(response)
      return response
    }

    const network = await gateway.getNetwork('utilityemissionchannel');

    const contract = network.getContract('emissionscontract');

    // ###### Get Emissions Data ######
    const blockchainResult = await contract.evaluateTransaction('getEmissionsData', utilityId, partyId, fromDate, thruDate);
    const stringResult = JSON.stringify(blockchainResult)
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
    let result = new Object(); 
    result["info"] = `Failed to evaluate transaction: ${error}`;
    result["utilityId"] = utilityId;
    result["partyId"] = partyId;
    result["fromDate"] = fromDate;
    result["thruDate"] = thruDate;
    console.error(`Failed to evaluate transaction: ${error}`);
    console.log(result)
    return result
    // process.exit(1);
  }
}

module.exports = {
  recordEmissions,
  getEmissionsData
};
