import { ethers } from "ethers";
import netEmissionsTokenNetworkAbi from "./NetEmissionsTokenNetwork.json";
import { PRIVATE_KEY, CONTRACT_ADDRESS, INFURA_PROJECT_ID, INFURA_PROJECT_SECRET } from "../../config/networkConfig";
const tokenTypeId = 3;

function getProvider() {
  let provider = new ethers.providers.InfuraProvider("goerli", {
    projectId: INFURA_PROJECT_ID,
    projectSecret: INFURA_PROJECT_SECRET
  });
  return provider;
}

export async function registerAuditedEmissionDealer(addressToRegister) {
  let contractResponse;
  let provider = getProvider();
  //   let wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  let contract = new ethers.Contract(CONTRACT_ADDRESS, netEmissionsTokenNetworkAbi.abi, provider);

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
  let wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  let contract = new ethers.Contract(CONTRACT_ADDRESS, netEmissionsTokenNetworkAbi.abi, provider);

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
    let tokenIdRaw = issueEvent.slice((64*3), (64*4));
    console.log(`Got tokenIdRaw: ${tokenIdRaw}`);
    tokenId = parseInt(tokenIdRaw,16)
    console.log(`Got tokenId: ${tokenId}`);
  });
  return `${CONTRACT_ADDRESS}:${tokenId}`;
  
}
