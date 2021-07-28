/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import * as FabricCAServices from 'fabric-ca-client';
import { Wallet } from 'fabric-network';
import { AUDITORS } from "../../config/config";
import { buildCCPAuditor } from "./gatewayUtils";

/**
 *
 * @param {*} FabricCAServices
 * @param {*} ccp
 */
export function buildCAClient(FabricCAServices, ccp, caHostName) {
  // Create a new CA client for interacting with the CA.
  const caInfo = ccp.certificateAuthorities[caHostName]; //lookup CA details from config
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const caClient = new FabricCAServices(
    caInfo.url,
    { trustedRoots: caTLSCACerts, verify: false },
    caInfo.caName
  );

  console.log(`Built a CA url ${caInfo.url}`);
  console.log(`Built a CA Client named ${caInfo.caName}`);
  return caClient;
}

export interface UserToEnroll {
  caClient: FabricCAServices;
  wallet: Wallet;
  orgMspId: string;
  userId: string;
  userIdSecret: string;
}

/**
 * enroll a registered CA user and store the credentials in the wallet
 * @param userToEnroll details about the user and the wallet to use
 */
export const enrollUserToWallet = async (userToEnroll: UserToEnroll): Promise<object> => {
  // Return result
  let result = new Object();
  result["userId"] = userToEnroll.userId;
  result["msp"] = userToEnroll.orgMspId;
  try {
    // check that the identity isn't already in the wallet
    const identity = await userToEnroll.wallet.get(userToEnroll.userId);
    if (identity) {
      console.log(`Identity ${userToEnroll.userId} already exists in the wallet`);
      return;
    }
    // Enroll the user
    const enrollment = await userToEnroll.caClient.enroll({ enrollmentID: userToEnroll.userId, enrollmentSecret: userToEnroll.userIdSecret });
    // store the user
    const hsmIdentity = {
      credentials: {
          certificate: enrollment.certificate,
      },
      mspId: userToEnroll.orgMspId,
      type: 'HSM-X.509',
    };
    await userToEnroll.wallet.put(userToEnroll.userId, hsmIdentity);
    result["reponse"] = `Successfully enrolled user ${userToEnroll.userId} and imported it into the wallet`;
  } catch (error) {
    result["reponse"] = `Failed to enroll user ${userToEnroll.userId}: ${error}`;
    throw new Error(result["reponse"]);
  }
  return result;
  //console.error(result["reponse"]);
};

export interface UserToRegister {
    caClient: FabricCAServices;
    wallet: Wallet;
    orgMspId: string;
    adminId: string;
    userId: string;
    userIdSecret: string;
    affiliation: string;
}

export const registerUser = async (userToRegister: UserToRegister): Promise<string> => {
  try {
    // Must use a CA admin (registrar) to register a new user
    console.log("Get the admin's identity")
    const adminIdentity = await userToRegister.wallet.get(userToRegister.adminId);
    if (!adminIdentity) {
      console.log('An identity for the admin user does not exist in the wallet');
      console.log('Enroll the admin user before retrying');
      return;
    }
    // build a user object for authenticating with the CA
    const provider = userToRegister.wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, userToRegister.adminId);
    // Register the user
    // if affiliation is specified by client, the affiliation value must be configured in CA
    const secret = await userToRegister.caClient.register({
      affiliation: userToRegister.affiliation,
      enrollmentID: userToRegister.userId,
      enrollmentSecret: userToRegister.userIdSecret,
      role: 'client'
    }, adminUser);

    console.log(`Successfully registered ${userToRegister.userId}.`);
    return secret;
  } catch (error) {
    // check to see if it's an already registered error, if it is, then we can ignore it
    // otherwise we rethrow the error
    if (error.errors[0].code !== 74) {
      console.log(`Failed to register user : ${error}`)  
      throw error;
    }
  }
};


export function setOrgDataCA(orgName) {
  let ccp;
  let msp;
  let caName;
  console.log("OrgName: " + orgName);

  if (!AUDITORS.hasOwnProperty(orgName)) {
      throw new Error(`AUDITORS contains no ${orgName}`);
  }

  ccp = buildCCPAuditor(orgName);
  msp = AUDITORS[orgName]["msp"]
  caName = AUDITORS[orgName]["caName"]

  return { ccp, msp, caName };
}

/*

export async function enrollAdmin(caClient, wallet, orgMspId) {
  try {
    let response = "";
    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(adminUserId);
    if (identity) {
      response = "An identity for the admin user already exists in the wallet";
      return response;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({
      enrollmentID: adminUserId,
      enrollmentSecret: adminUserPasswd,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: "X.509",
    };
    await wallet.put(adminUserId, x509Identity);
    response =
      "Successfully enrolled admin user and imported it into the wallet";
    return response;
  } catch (error) {
    let response = "";
    response = `Failed to enroll admin user : ${error}`;
    console.error(response);
    return response;
  }
}

export async function registerAndEnrollUser(
  caClient,
  wallet,
  orgMspId,
  userId,
  affiliation
) {
  try {
    let response = "";
    // Check to see if we've already enrolled the user
    const userIdentity = await wallet.get(userId);
    if (userIdentity) {
      response = `An identity for the user ${userId} already exists in the wallet`;
      return response;
    }

    // Must use an admin to register a new user
    const adminIdentity = await wallet.get(adminUserId);
    if (!adminIdentity) {
      response =
        "An identity for the admin user does not exist in the wallet. Enroll the admin user before retrying";
      return response;
    }

    // build a user object for authenticating with the CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

    // Register the user, enroll the user, and import the new identity into the wallet.
    // if affiliation is specified by client, the affiliation value must be configured in CA
    const secret = await caClient.register(
      {
        affiliation: affiliation,
        enrollmentID: userId,
        role: "client",
      },
      adminUser
    );
    const enrollment = await caClient.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: "X.509",
    };
    await wallet.put(userId, x509Identity);
    response = `Successfully registered and enrolled user and imported it into the wallet`;
    return response;
  } catch (error) {
    let response = "";
    response = `Failed to register user : ${error}`;
    console.error(response);
    return response;
  }
}
*/

