/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require('fs');


async function main() {
  try {
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get("User1@auditor1.carbonAccounting.com");
    if (!identity) {
      console.log(
        'An identity for the user "User1" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }
    
    const connectionProfileJson = (await fs.promises.readFile('../organizations/peerOrganizations/auditor1.carbonAccounting.com/connection-auditor1.json')).toString();
    const connectionProfile = JSON.parse(connectionProfileJson, 'utf8');
    const gateway = new Gateway();
    try {await gateway.connect(connectionProfile, {
      wallet,
      identity: "User1@auditor1.carbonAccounting.com",
      discovery: {"enabled": true, "asLocalhost": true}
    });}
    catch (err) {
      console.log("ERROR: " + err)
    }
    //console.log(gateway)
    const network = await gateway.getNetwork('utilityemissionchannel');
    //console.log(network)

    const contract = network.getContract('emissionscontract');

    // ###### Record Emissions ######
    await contract.submitTransaction('recordEmissions', 'MediumUtility', 'MyCompany', '2020-06-01', '2020-06-30', '1500', 'KWH');

    // ###### Get Emissions Data ######
    const result = await contract.evaluateTransaction('getEmissionsData', 'MediumUtility', 'MyCompany', '2020-06-01', '2020-06-30');
    const stringResult = result.toString('utf8')
    const JsonResult = JSON.parse(stringResult)
    console.log (JsonResult)





    // Disconnect from the gateway.
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}

main();

async function fabricClient() {
  try {
    var client = await Client.loadFromConfig("connection-org1-oc.json");
    var channel = await client.queryPeers("grpcs://internal-af58e5e8b9bef11eab3850a6b3b1ba41-1789620656.eu-central-1.elb.amazonaws.com:31043", 0)
    var msp = await client.getMspid();
    console.log(msp)
  } catch (err) {
    console.log(err);
  }
}
//fabricClient();
