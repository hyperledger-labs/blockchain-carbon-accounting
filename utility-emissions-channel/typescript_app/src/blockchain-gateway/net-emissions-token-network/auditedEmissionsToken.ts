import { ethers } from "ethers";
import netEmissionsTokenNetworkAbi from "./NetEmissionsTokenNetwork.json";
import { PRIVATE_KEY, CONTRACT_ADDRESS, URL, IS_GOERLI, INFURA_PROJECT_ID, INFURA_PROJECT_SECRET } from "./networkConfig";
const tokenTypeId = 3;

export function getProvider() {
  let provider;
  if (IS_GOERLI) {
    provider = new ethers.providers.InfuraProvider("goerli", {
      projectId: INFURA_PROJECT_ID,
      projectSecret: INFURA_PROJECT_SECRET
    });
  } else {
    provider = new ethers.providers.JsonRpcProvider(URL);
  }
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
  let issueResponse;
  let provider = getProvider();
  let wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  let contract = new ethers.Contract(CONTRACT_ADDRESS, netEmissionsTokenNetworkAbi.abi, provider);

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
  // let transactionReceipt = await issue.wait(0);
  // let issueEvent = transactionReceipt.events.pop();
  // let tokenId = issueEvent.args[0].toNumber();
  // return tokenId;
  return "success";
}
