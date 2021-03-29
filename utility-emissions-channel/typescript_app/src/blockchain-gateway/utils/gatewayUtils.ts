/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import fs from "fs";
import path from "path";

import { AUDITORS } from "../../config/config";

export function buildCCPAuditor(auditor) {
  console.log("buildCCPAuditor, auditor = ", auditor);
  if (!AUDITORS.hasOwnProperty(auditor)) {
      throw new Error(`AUDITORS contains no ${auditor}`);
  }
  // load the common connection configuration file
  const ccpPath: string = path.resolve(__dirname, AUDITORS[auditor]["conConfFile"]);

  const fileExists: boolean = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, "utf8");

  console.log(contents);

  // build a JSON object from the file contents
  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
}

export async function buildWallet(Wallets, walletPath) {
  // Create a new  wallet : Note that wallet is for managing identities.
  let wallet;
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Built a file system wallet at ${walletPath}`);
  } else {
    wallet = await Wallets.newInMemoryWallet();
    console.log("Built an in memory wallet");
  }

  return wallet;
}

export function prettyJSONString(inputString) {
  if (inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
  } else {
    return inputString;
  }
}

export function setWalletPathByOrg(orgName) {
  let walletPath: string = "";
  console.log("OrgName: " + orgName);

  if (!AUDITORS.hasOwnProperty(orgName)) {
      throw new Error(`AUDITORS contains no ${orgName}`);
  }
  let isPathAbsolute = AUDITORS[orgName]["isPathAbsolute"];
  if (isPathAbsolute) {
      walletPath = AUDITORS[orgName]["walletPath"];
  } else {
      walletPath = path.join(__dirname,  AUDITORS[orgName]["walletPath"]);
  }

  return walletPath;
}
