/*
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

import fs from "fs";
import path from "path";

export function buildCCPAuditor1() {
  // load the common connection configuration file
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "..",
    "docker-compose-setup",
    "organizations",
    "peerOrganizations",
    "auditor1.carbonAccounting.com",
    "connection-auditor1.json"
  );
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, "utf8");

  // build a JSON object from the file contents
  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
}

export function buildCCPAuditor2() {
  console.log("++++++++++++++++++++++++++++");
  // load the common connection configuration file
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "docker-compose-setup",
    "organizations",
    "peerOrganizations",
    "auditor2.carbonAccounting.com",
    "connection-auditor2.json"
  );

  const fileExists = fs.existsSync(ccpPath);
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

export function buildCCPAuditor3() {
  // load the common connection configuration file
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "docker-compose-setup",
    "organizations",
    "peerOrganizations",
    "auditor3.carbonAccounting.com",
    "connection-auditor3.json"
  );
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, "utf8");

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
  let walletPath = "";
  console.log("OrgName: " + orgName);
  switch (orgName) {
    case "auditor1":
      walletPath = path.join(__dirname, "..", "wallets", "auditor1");
      break;
    case "auditor2":
      walletPath = path.join(__dirname, "..", "wallets", "auditor2");
      break;
    case "auditor3":
      walletPath = path.join(__dirname, "..", "wallets", "auditor3");
      break;
  }
  return walletPath;
}
