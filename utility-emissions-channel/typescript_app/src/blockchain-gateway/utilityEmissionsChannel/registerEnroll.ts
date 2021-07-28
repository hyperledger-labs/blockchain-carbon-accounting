/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

//import * as FabricCAServices from 'fabric-ca-client';
import FabricCAServices from "fabric-ca-client";
import { HsmOptions, HsmX509Provider, Wallet, Wallets } from "fabric-network";
import { enrollUserToWallet, registerUser, UserToEnroll, UserToRegister, setOrgDataCA } from "../utils/caUtils";
import * as fs from 'fs';

import { buildWallet, setWalletPathByOrg } from "../utils/gatewayUtils";

import { ADMIN_USER_ID, ADMIN_USER_PASSWD, PKCS11_PIN, PKCS11_LABEL } from "../../config/config";

const adminUserId = ADMIN_USER_ID || process.env.ADMIN_USER_ID;
const adminUserPasswd = ADMIN_USER_PASSWD || process.env.ADMIN_USER_PASSWD;


var hsmProviderStore = new Object();
// Call this function only once per organization
export class EmissionsContractInvoke {
  constructor() {}

  static async registerOrgAdmin(orgName) {
    try {
      let { ccp, msp, caName } = setOrgDataCA(orgName);

      // Build instance of fabric ca client
      // const caClient = buildCAClient(FabricCAServices, ccp, caName);

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      const caInfo = ccp.certificateAuthorities[caName]; // lookup CA details from config
      const caTLSCACerts = caInfo.tlsCACerts.pem;

      // create wallet to store user credentials
      const walletPath: string = setWalletPathByOrg(orgName);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);

      const hsmProvider = await setHsmProvider(wallet,orgName);

      console.log("building HSM Client");
      // Build CA client using an HSM enabled cryptosuite
      const hsmCAClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName, hsmProvider.getCryptoSuite());
      console.log(`Built a CA Client named ${caName}`);

      //const response: string = await enrollAdmin(caClient, wallet, msp);
      // enroll admin with hsmCAClient instead of original CAClient
      //const response: string = await enrollAdmin(hsmCAClient, wallet, msp);


      console.log("Enrolling CA admin");
      // enroll the CA admin into the wallet if it doesn't already exist in the wallet
      let result = await enrollUserToWallet({
        caClient: hsmCAClient,
        wallet,
        orgMspId: msp,
        userId: adminUserId,
        userIdSecret: adminUserPasswd,
      } as UserToEnroll);

      result["info"] = "ORG ADMIN REGISTERED"
      result["orgName"] = orgName;
      result["msp"] = msp;
      result["caName"] = caName;
      console.log(result);
      return result;
    } catch (error) {
      let errorDetails = `Failed register org admin: ${error}`;
      console.error(errorDetails);
      return errorDetails;
    }
  }

  static async registerAndEnrollUser(userId, orgName, affiliation) {
    try {
      let { ccp, msp, caName } = setOrgDataCA(orgName);

      console.log("+++++++++++++++++++++++++++++++++++");
      // create wallet to store user credentials
      const walletPath: string = setWalletPathByOrg(orgName);
      const wallet: Wallet = await buildWallet(Wallets, walletPath);
      console.log("+++++++++++++++++++++++++++++++++++");

      console.log(ccp);
      console.log(msp);
      console.log(caName);
      console.log(orgName);

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      const caInfo = ccp.certificateAuthorities[caName]; // lookup CA details from config
      const caTLSCACerts = caInfo.tlsCACerts.pem;

      const hsmProvider = await setHsmProvider(wallet,orgName);
      // Build instance of fabric ca client
      //const caClient = buildCAClient(FabricCAServices, ccp, caName);

      // Build CA client using an HSM enabled cryptosuite
      const hsmCAClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName, hsmProvider.getCryptoSuite());
      console.log(`Built a CA Client named ${caName}`);
      console.log("+++++++++++++++++++++++++++++++++++");

      //const response = await registerAndEnrollUser(caClient, wallet, msp, userId, affiliation);
      
      const adminIdentity = await wallet.get(adminUserId);
      let secret = await registerUser({
          caClient: hsmCAClient,
          adminId: adminUserId,
          wallet,
          orgMspId: msp,
          userId: userId,
          // the original implemenation provided no secret passphrase when registering a new user 
          userIdSecret: null,
          affiliation: affiliation,
      } as UserToRegister);

      let result = new Object();

      // By default you can only enroll a user once, after that you would have to re-enroll using the current
      // certificate rather than using the secret.
      result = await enrollUserToWallet({
          caClient: hsmCAClient,
          wallet,
          orgMspId: msp,
          userId: userId,
          //userIdSecret: null,
          // use secret output from registration step above as opposed to user provided passphrase
          userIdSecret: secret,
      } as UserToEnroll);

      result["info"] = "USER REGISTERED AND ENROLLED";
      result["orgName"] = orgName;
      result["caName"] = caName;
      result["affiliation"] = affiliation;
      console.log(result);
      return result;
    } catch (error) {
      console.error(`Failed to register and enroll user ${userId}: ${error}`);
    }
  }
}

async function setHsmProvider(wallet,orgName){
  let hsmProvider = hsmProviderStore[orgName]
  if(!hsmProvider){
    console.log("set HSM Options");
    // softhsm pkcs11 options to use
    const softHSMOptions: HsmOptions = {
      lib: await findSoftHSMPKCS11Lib(),
      pin: process.env.PKCS11_PIN || PKCS11_PIN,
      label: process.env.PKCS11_LABEL || PKCS11_LABEL
    }
    //console.log(softHSMOptions);
    try{

      hsmProvider = new HsmX509Provider(softHSMOptions)
      hsmProviderStore[orgName]=hsmProvider
    }
    catch(error){
      console.error(`Failed to set HSM provider: ${error}`);
      throw error;
    }
  }
  // add the HSM provider to the provider registry of the wallet
  wallet.getProviderRegistry().addProvider(hsmProvider);
  //console.log(hsmProvider)
  return hsmProvider
}

/**
 * Determine the location of the SoftHSM PKCS11 Library
 * @returns the location of the SoftHSM PKCS11 Library or 'NOT FOUND' if not found
 */
async function findSoftHSMPKCS11Lib() {
    var path = require('path');
    const root = path.dirname(require.main.filename || process.mainModule.filename);

    const commonSoftHSMPathNames = [
        '/usr/lib/softhsm/libsofthsm2.so',
        '/usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so',
        '/usr/local/lib/softhsm/libsofthsm2.so',
        '/usr/lib/libacsp-pkcs11.so',
    ];

    let pkcsLibPath = 'NOT FOUND';
    if (typeof process.env.PKCS11_LIB === 'string' && process.env.PKCS11_LIB !== '') {
        pkcsLibPath = process.env.PKCS11_LIB;
    } else {
        //
        // Check common locations for PKCS library
        //
        for (const pathnameToTry of commonSoftHSMPathNames) {
            //console.log(pathnameToTry);
            if (fs.existsSync(pathnameToTry)) {
                pkcsLibPath = pathnameToTry;
                break;
            }
        }
    }

    return pkcsLibPath;
}

