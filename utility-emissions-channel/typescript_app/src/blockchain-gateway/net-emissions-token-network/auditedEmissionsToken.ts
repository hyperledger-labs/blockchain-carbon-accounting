// SPDX-License-Identifier: Apache-2.0
import { ethers } from "ethers";
import netEmissionsTokenNetworkAbi from "./NetEmissionsTokenNetwork.json";
import {
  WALLET_PRIVATE_KEY,
  CONTRACT_ADDRESS,
  INFURA_PROJECT_ID,
  INFURA_PROJECT_SECRET,
  JSON_RPC_URL,
  NETWORK
} from "../../config/networkConfig";
const tokenTypeId = 3;

const walletPrivateKey = WALLET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
const contractAddress = CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;
const jsonRpcUrl = JSON_RPC_URL || process.env.JSON_RPC_URL || "https://rpc.xdaichain.com/";
const useNetworks = NETWORK || process.env.NETWORK || "xdai";

const infuraProjectId = INFURA_PROJECT_ID || process.env.INFURA_PROJECT_ID;
const infuraProjectSecret = INFURA_PROJECT_SECRET || process.env.INFURA_PROJECT_SECRET;

function getProvider() {
  let provider = null;
  if (useNetworks.toLowerCase() === 'goerli') {
    // Goerli
    provider = new ethers.providers.InfuraProvider("goerli", {
      projectId: infuraProjectId,
      projectSecret: infuraProjectSecret
    });
  } else {
    // xDai
    provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  }

  return provider;
}

export async function registerAuditedEmissionDealer(addressToRegister) {
  let contractResponse;
  let provider = getProvider();
  // let wallet = new ethers.Wallet(walletPrivateKey,, provider);
  let contract = new ethers.Contract(contractAddress, netEmissionsTokenNetworkAbi.abi, provider);

  let signer = provider.getSigner();

  let signed = contract.connect(signer);
  let registerAuditedEmissionDealer = await signed
    .registerDealer(addressToRegister, 3)
    .then((response) => (contractResponse = response));
  return JSON.stringify(contractResponse);
}

export async function issue(
  addressToIssue,
  quantity,
  fromDate,
  thruDate,
  automaticRetireDate,
  metadata,
  manifest,
  description
) {
  let provider = getProvider();
  let wallet = new ethers.Wallet(walletPrivateKey, provider);
  let contract = new ethers.Contract(contractAddress, netEmissionsTokenNetworkAbi.abi, provider);

  let signed = contract.connect(wallet);
  let issue = await signed
    .issue(
      addressToIssue,
      tokenTypeId,
      quantity,
      fromDate,
      thruDate,
      automaticRetireDate,
      metadata,
      manifest,
      description
    );
  console.log("Waiting for receipt of transaction on the blockchain with Ethers.js...");

  // each parameter returned in the event payload is 64 characters long hexadecimal number
  // the third parameter is tokenId, so find it in the payload, format, and return it
  let tokenId;
  let transactionReceipt = await issue.wait().then((receipt) => {
    let issueEventRaw = JSON.stringify(receipt.events.pop().data);
    let issueEvent = issueEventRaw.substring(3, issueEventRaw.length-1);
    console.log(`Got issueEvent: ${issueEvent}`);
    let tokenIdRaw = issueEvent.slice((64*2), (64*3));
    console.log(`Got tokenIdRaw: ${tokenIdRaw}`);
    tokenId = parseInt(tokenIdRaw,16)
    console.log(`Got tokenId: ${tokenId}`);
  });
  return `${contractAddress}:${tokenId}`;

}
