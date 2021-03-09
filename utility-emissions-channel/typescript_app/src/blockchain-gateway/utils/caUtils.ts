/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import { ADMIN_USER_ID, ADMIN_USER_PASSWD, AUDITORS } from "../../config/config";
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

  console.log(`Built a CA Client named ${caInfo.caName}`);
  return caClient;
}

export async function enrollAdmin(caClient, wallet, orgMspId) {
  try {
    let response = "";
    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(ADMIN_USER_ID);
    if (identity) {
      response = "An identity for the admin user already exists in the wallet";
      return response;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({
      enrollmentID: ADMIN_USER_ID,
      enrollmentSecret: ADMIN_USER_PASSWD,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: "X.509",
    };
    await wallet.put(ADMIN_USER_ID, x509Identity);
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
    const adminIdentity = await wallet.get(ADMIN_USER_ID);
    if (!adminIdentity) {
      response =
        "An identity for the admin user does not exist in the wallet. Enroll the admin user before retrying";
      return response;
    }

    // build a user object for authenticating with the CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, ADMIN_USER_ID);

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
