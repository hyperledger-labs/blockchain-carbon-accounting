import { ethers } from "ethers";
import netEmissionsTokenNetworkAbi from "./NetEmissionsTokenNetwork.json";
import { privateKey, contractAddress, url } from "./networkConfig";
const tokenTypeId = 3;

export async function registerAuditedEmissionDealer(addressToRegister) {
  let contractResponse;
  let provider = new ethers.providers.JsonRpcProvider(url);
  //   let wallet = new ethers.Wallet(privateKey, provider);
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
  let issueResponse;
  let provider = new ethers.providers.JsonRpcProvider(url);
  let wallet = new ethers.Wallet(privateKey, provider);
  let contract = new ethers.Contract(contractAddress, netEmissionsTokenNetworkAbi.abi, provider);

  // let signer = provider.getSigner();

  let signed = contract.connect(wallet);
  let issue = await signed
    .issue(
      addressToIssue,
      tokenTypeId,
      ethers.utils.parseUnits(quantity.toString(), 8),
      fromDate,
      thruDate,
      automaticRetireDate,
      metadata,
      manifest,
      description
    )
    .then((response) => (issueResponse = response));
  // Get ID of first issued token
  let transactionReceipt = await issue.wait(0);
  let issueEvent = transactionReceipt.events.pop();
  let tokenId = issueEvent.args[0].toNumber();
  return tokenId;
}
