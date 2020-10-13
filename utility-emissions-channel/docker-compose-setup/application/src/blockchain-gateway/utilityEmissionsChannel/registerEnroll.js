/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";


const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin, setOrgDataCA } = require('../utils/caUtils.js');
const { buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3, buildWallet, setWalletPathByOrg } = require('../utils/gatewayUtils.js');

// Call this function only once per organization
async function registerOrgAdmin(orgName) {
    try {
        let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);

        // Build instance of fabric ca client
        const caClient = buildCAClient(FabricCAServices, ccp, caName);

        // create wallet to store user credentials
        const walletPath = setWalletPathByOrg(orgName);
        const wallet = await buildWallet(Wallets, walletPath);

        const response = await enrollAdmin(caClient, wallet, msp);
        // Return result
        let result = new Object();
        if (response === 'Successfully enrolled admin user and imported it into the wallet') {
            result["info"] = "ORG ADMIN REGISTERED";
        } else {
            result["info"] = response;
            result["orgName"] = orgName;
            result["msp"] = msp;
            result["caName"] = caName;
        }
        console.log(result)
        return result;

    } catch (error) {
        let errorDetails = `Failed register org admin: ${error}`
        console.error(errorDetails);
        return errorDetails;
    }
}


async function registerUser(userId, orgName, affiliation) {
    try {
        let { ccp, msp, caName } = setOrgDataCA(orgName, buildCCPAuditor1, buildCCPAuditor2, buildCCPAuditor3);
        console.log("+++++++++++++++++++++++++++++++++++")
        console.log(ccp)
        console.log(msp)
        console.log(caName)
        console.log(orgName)
        // Build instance of fabric ca client
        const caClient = buildCAClient(FabricCAServices, ccp, caName);
        console.log("+++++++++++++++++++++++++++++++++++")
        // create wallet to store user credentials
        const walletPath = setWalletPathByOrg(orgName);
        const wallet = await buildWallet(Wallets, walletPath);
        console.log("+++++++++++++++++++++++++++++++++++")
        const response = await registerAndEnrollUser(caClient, wallet, msp, userId, affiliation);

        
        // Return result
        let result = new Object();
        if (response === `Successfully registered and enrolled user and imported it into the wallet`) {
            result["info"] = "USER REGISTERED AND ENROLLED";
            result["userId"] = userId;
            result["orgName"] = orgName;
            result["msp"] = msp;
            result["affiliation"] = affiliation;
            result["caName"] = caName;
        } else {
            result["info"] = response;
            result["userId"] = userId;
            result["orgName"] = orgName;
            result["msp"] = msp;
            result["affiliation"] = affiliation;
            result["caName"] = caName;
        }
        console.log(result)
        return result;
    } catch (error) {
        console.error(`Failed register user: ${error}`);
        process.exit(1);
    }
};

module.exports = {
    registerOrgAdmin,
    registerUser
};