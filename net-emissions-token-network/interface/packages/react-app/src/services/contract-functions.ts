// SPDX-License-Identifier: Apache-2.0
import { AbiCoder } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { abis, addresses } from "@project/contracts";


const SUCCESS_MSG = "Success! Transaction has been submitted to the network. Please wait for confirmation on the blockchain.";
const EXTRACT_ERROR_MESSAGE = /(?<="message":")(.*?)(?=")/g;

const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Canceled",
  "Quorum Failed",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
];

export const TOKEN_TYPES = [
  "Renewable Energy Certificate",
  "Carbon Emissions Offset",
  "Audited Emissions",
  "Carbon Tracker"
]

/*
 *  helper functions
 */
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}
function catchError(error: unknown) {
  const err = getErrorMessage(error);
  console.error(err);

  // try to extract error message, otherwise return raw error
  let formatted_error;

  if (err.startsWith("invalid ENS name")) {
    formatted_error = "Missing or invalid parameter.";
  } else if (err.startsWith("invalid BigNumber string")) {
    formatted_error = "Invalid number parameter."
  } else {
    try {
      let errors = JSON.stringify(error).match(EXTRACT_ERROR_MESSAGE);
      if (errors) {
        formatted_error = errors[errors.length - 1];
      } else {
        formatted_error = 'Unknown error: ' + err;
      }
    } catch (e) {
      formatted_error = err;
    }
  }

  return formatted_error;
}

// Helper function to prevent ambiguous failure message when dates aren't passed
function convertToZeroIfBlank(num: string | number) {
  if (!num) return 0
  if (typeof num === 'string') return parseInt(num)
  return num
}

function toUnixTime(date: Date | number) {
  // Return date if not a Date object
  console.log('toUnixTime', date)
  if (Object.prototype.toString.call(date) !== "[object Date]") return date as number;
  console.log('toUnixTime this is a date!', date, parseInt(((date as Date).getTime() / 1000).toFixed(0)))
  return parseInt(((date as Date).getTime() / 1000).toFixed(0));
}

export async function getBlockNumber(w3provider: Web3Provider) {
  return w3provider.getBlockNumber();
}

export function encodeParameters(types: string[], values: any[]) {
  let abi = new AbiCoder();
  return abi.encode(types, values);
}

export function decodeParameters(types: string[], values: any[]) {
  let abi = new AbiCoder();
  return abi.decode(types, values);
}

export function formatDate(timestamp: number|string) {
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp === 0) {
    return "None";
  } else {
    return (new Date(timestamp * 1000)).toLocaleString();
  }
}

/*
 *
 *  NetEmissionsTokenNetwork contract functions
 *
 */

export async function getRoles(w3provider: Web3Provider, address: string) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  try {
    return await contract.getRoles(address) as boolean[];
  } catch (error) {
    console.error('getRoles', error);
    return []
  }
}

export async function getIssuer(w3provider: Web3Provider, tokenId: number) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let issuer;
  try {
    issuer = await contract.getIssuer(tokenId);
  } catch (error) {
    issuer = getErrorMessage(error) 
    console.error('getIssuer', error);
  }
  return issuer;
}

export async function getTokenDetails(w3provider: Web3Provider, tokenId: number) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let details;
  try {
    details = await contract.getTokenDetails(tokenId);
  } catch (error) {
    details = getErrorMessage(error) 
    console.error('getTokenDetails', error);
  }
  return details;
}

export async function getNumOfUniqueTokens(w3provider: Web3Provider) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let uniqueTokens;
  try {
    uniqueTokens = await contract.getNumOfUniqueTokens();
  } catch (error) {
    uniqueTokens = getErrorMessage(error) 
    console.error('getNumOfUniqueTokens', error);
  }
  return uniqueTokens;
}

export async function getAvailableRetiredAndTransferred(w3provider: Web3Provider, address: string, tokenId: number) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let balances;
  try {
    balances = await contract.getAvailableRetiredAndTransferred(address, tokenId);
  } catch (error) {
    balances = getErrorMessage(error) 
    console.error('getAvailableAndRetired', error);
  }
  return balances;
}

export async function getTokenType(w3provider: Web3Provider, tokenId: number) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let tokenType;
  try {
    tokenType = await contract.getTokenType(tokenId);
  } catch (error) {
    tokenType = getErrorMessage(error) 
    console.error('getTokenType', error);
  }
  return tokenType;
}

export async function getLimitedMode(w3provider: Web3Provider) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let limitedMode: boolean;
  try {
    limitedMode = await contract.limitedMode();
  } catch (error) {
    // limitedMode = getErrorMessage(error) 
    limitedMode = true 
    console.error('getLimitedMode', error);
  }
  return limitedMode;
}

export async function getAdmin(w3provider: Web3Provider) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let admin;
  try {
    admin = await contract.admin();
  } catch (error) {
    admin = getErrorMessage(error) 
    console.error('getAdmin', error);
  }
  return admin;
}

export async function issue(
  w3provider: Web3Provider,
  address: string,
  tokenTypeId: number,
  quantity: number,
  fromDate: number|Date,
  thruDate: number|Date,
  metadata: string,
  manifest: string,
  description: string
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let issue_result;
  try {
    await signed.issue(
      address,
      tokenTypeId,
      quantity,
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      metadata,
      manifest,
      description
    );
    issue_result = SUCCESS_MSG;
  } catch (error) {
    issue_result = catchError(error);
  }
  return issue_result;
}

export async function retire(w3provider: Web3Provider, tokenId: number, amount: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let retire_result;
  try {
    await signed.retire(tokenId, amount);
    retire_result = SUCCESS_MSG;
  } catch (error) {
    retire_result = catchError(error);
  }
  return retire_result;
}

export async function transfer(w3provider: Web3Provider, address: string, tokenId: number, amount: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let transfer_result;
  try {
    await signed.transfer(address, tokenId, amount);
    transfer_result = SUCCESS_MSG;
  } catch (error) {
    transfer_result = catchError(error);
  }
  return transfer_result;
}

export async function registerConsumer(w3provider: Web3Provider, address: string) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let registerConsumer_result;
  try {
    await signed.registerConsumer(address);
    registerConsumer_result = SUCCESS_MSG;
  } catch (error) {
    registerConsumer_result = catchError(error);
  }
  return registerConsumer_result;
}

export async function unregisterConsumer(w3provider: Web3Provider, address: string) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let unregisterConsumer_result;
  try {
    await signed.unregisterConsumer(address);
    unregisterConsumer_result = SUCCESS_MSG;
  } catch (error) {
    unregisterConsumer_result = catchError(error);
  }
  return unregisterConsumer_result;
}

export async function registerIndustry(w3provider: Web3Provider, address: string) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let registerIndustry_result;
  try {
    await signed.registerIndustry(address);
    registerIndustry_result = SUCCESS_MSG;
  } catch (error) {
    registerIndustry_result = catchError(error);
  }
  return registerIndustry_result;
}

export async function registerDealer(w3provider: Web3Provider, address: string, tokenTypeId: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let registerDealer_result;
  try {
    await signed.registerDealer(address, tokenTypeId);
    registerDealer_result = SUCCESS_MSG;
  } catch (error) {
    registerDealer_result = catchError(error);
  }
  return registerDealer_result;
}

export async function unregisterDealer(w3provider: Web3Provider, address: string, tokenTypeId: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let unregisterDealer_result;
  try {
    await signed.unregisterDealer(address, tokenTypeId);
    unregisterDealer_result = SUCCESS_MSG;
  } catch (error) {
    unregisterDealer_result = catchError(error);
  }
  return unregisterDealer_result;
}

/*
 *
 *  DAO token contract functions
 *
 */

export async function daoTokenTotalSupply(w3provider: Web3Provider) {
  let contract = new Contract(addresses.dao.daoToken.address, abis.daoToken.abi, w3provider);
  let balance;
  try {
    let fetchedBalance = await contract.getTotalSupply();
    let decimals = BigNumber.from("1000000000000000000");
    balance = fetchedBalance.div(decimals).toNumber();
  } catch (error) {
    balance = getErrorMessage(error)
  }
  return balance;
}

export async function daoTokenBalanceOf(w3provider: Web3Provider, account: string) {
  let contract = new Contract(addresses.dao.daoToken.address, abis.daoToken.abi, w3provider);
  let balance;
  try {
    let fetchedBalance = await contract.balanceOf(account);
    let decimals = BigNumber.from("1000000000000000000");
    balance = fetchedBalance.div(decimals).toNumber();
  } catch (error) {
    balance = getErrorMessage(error) 
  }
  return balance;
}

export async function delegate(w3provider: Web3Provider, delegatee: string) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.daoToken.address, abis.daoToken.abi, w3provider);
  let signed = contract.connect(signer);
  let delegate;
  try {
    await signed.delegate(delegatee);
    delegate = SUCCESS_MSG;
  } catch (error) {
    delegate = catchError(error);
  }
  return delegate;
}

export async function delegates(w3provider: Web3Provider, address: string) {
  let contract = new Contract(addresses.dao.daoToken.address, abis.daoToken.abi, w3provider);
  let delegates;
  try {
    delegates = await contract.delegates(address);
  } catch (error) {
    delegates = getErrorMessage(error) 
  }
  return delegates;
}

/*
 *
 *  Governor contract functions
 *
 */

export async function getProposalCount(w3provider: Web3Provider) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let count;
  try {
    count = await contract.proposalCount();
  } catch (error) {
    count = getErrorMessage(error)
  }
  return count;
}

export async function getProposalDetails(w3provider: Web3Provider, proposalId: number): Promise<any|string> {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let proposals;
  try {
    proposals = await contract.proposals(proposalId);
  } catch (error) {
    proposals = getErrorMessage(error) 
  }
  return proposals;
}

export async function getProposalState(w3provider: Web3Provider, proposalId: number) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let state;
  try {
    state = await contract.state(proposalId);
  } catch (error) {
    state = getErrorMessage(error) 
  }
  return PROPOSAL_STATES[state];
}

export async function propose(w3provider: Web3Provider, targets: string[], values: number[], signatures: string[], calldatas: string[], description: string[]) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let signed = contract.connect(signer);
  let proposal;
  try {
    if (targets && targets.length > 1) {
      console.log(
        "propose calling proposeMultiAttribute with",
        {targets,
        values,
        signatures,
        calldatas,
        description}
      );
      await signed.proposeMultiAttribute(
        targets,
        values,
        signatures,
        calldatas,
        description
      );
    } else {
      console.log(
        "propose calling propose with",
        {targets,
        values,
        signatures,
        calldatas,
        description}
      );
      await signed.propose(targets, values, signatures, calldatas, description[0]);
    }
    proposal = SUCCESS_MSG;
  } catch (error) {
    console.error(error);
    let err = catchError(error);
    proposal = err + " Is your delegatee set?";
  }
  return proposal;
}

export async function getReceipt(w3provider: Web3Provider, proposalId: number, voter: string) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let receipt;
  try {
    receipt = await contract.getReceipt(proposalId, voter);
  } catch (error) {
    receipt = catchError(error);
  }
  return receipt;
}

export async function getActions(w3provider: Web3Provider, proposalId: number) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let actions;
  try {
    actions = await contract.getActions(proposalId);
  } catch (error) {
    actions = catchError(error);
  }
  return actions;
}

export async function getDescription(w3provider: Web3Provider, proposalId: number) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let description;
  try {
    description = await contract.getDescription(proposalId);
  } catch (error) {
    description = catchError(error);
  }
  return description;
}

export async function castVote(w3provider: Web3Provider, proposalId: number, support: boolean, votes: BigNumber) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let signed = contract.connect(signer);
  let castVote;
  try {
    await signed.castVote(proposalId, support, votes);
    castVote = SUCCESS_MSG;
  } catch (error) {
    castVote = catchError(error);
  }
  return castVote;
}

export async function queue(w3provider: Web3Provider, proposalId: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let signed = contract.connect(signer);
  let queue;
  try {
    await signed.queue(proposalId);
    queue = SUCCESS_MSG;
  } catch (error) {
    queue = catchError(error);
  }
  return queue;
}

export async function execute(w3provider: Web3Provider, proposalId: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let signed = contract.connect(signer);
  let execute;
  try {
    await signed.execute(proposalId);
    execute = SUCCESS_MSG;
  } catch (error) {
    execute = catchError(error);
  }
  return execute;
}

export async function cancel(w3provider: Web3Provider, proposalId: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let signed = contract.connect(signer);
  let cancel;
  try {
    await signed.cancel(proposalId);
    cancel = SUCCESS_MSG;
  } catch (error) {
    cancel = catchError(error);
  }
  return cancel;
}

export async function refund(w3provider: Web3Provider, proposalId: number) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let signed = contract.connect(signer);
  let refund;
  try {
    await signed.refund(proposalId);
    refund = SUCCESS_MSG;
  } catch (error) {
    refund = catchError(error);
  }
  return refund;
}

export async function getQuorum(w3provider: Web3Provider) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let quorum;
  try {
    quorum = await contract.quorumVotes();
  } catch (error) {
    catchError(error);
    quorum = null;
  }
  return quorum;
}

export async function getProposalThreshold(w3provider: Web3Provider) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let proposalThreshold;
  try {
    proposalThreshold = await contract.proposalThreshold();
  } catch (error) {
    catchError(error);
    proposalThreshold = null;
  }
  return proposalThreshold;
}
export async function registerTracker(w3provider: Web3Provider,trackee: string){
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let register_result;
  try {
    await signed.registerTracker(trackee,);
    register_result = SUCCESS_MSG;
  } catch (error) {
    register_result = catchError(error);
  }
  return register_result;
}

export async function getNumOfUniqueTrackers(w3provider: Web3Provider) {
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let uniqueTrackers;
  try {
    uniqueTrackers = await contract.getNumOfUniqueTrackers();
  } catch (error) {
    uniqueTrackers = getErrorMessage(error) 
  }
  return uniqueTrackers;
}
export async function getTrackerDetails(w3provider: Web3Provider, trackerId: number) {
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let details;
  try {
    details = await contract.getTrackerDetails(trackerId);
  } catch (error) {
    details = getErrorMessage(error) 
  }
  return details;
}
export async function getTrackerIds(w3provider: Web3Provider, trackerId: number) {
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let trackerIds;
  try {
    trackerIds = await contract.getTrackerIds(trackerId);
  } catch (error) {
    trackerIds = getErrorMessage(error) 
  }
  return trackerIds;
}
export async function getCarbonIntensity(w3provider: Web3Provider, trackerId: number, tokenTypeId: number){
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let ci;
  try {
    ci = await contract.carbonIntensity(trackerId,tokenTypeId);
  } catch (error) {
    ci = getErrorMessage(error) 
  }
  return ci;
}


export async function getTokenAmounts(w3provider: Web3Provider, trackerId: number, sourceTrackerId: number){
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let tokenAmounts;
  try {
    tokenAmounts = await contract.getTokenAmounts(trackerId,sourceTrackerId);
  } catch (error) {
    tokenAmounts = getErrorMessage(error)
  }
  return tokenAmounts;
}

export async function getRegisteredTracker(w3provider: Web3Provider, signedInAddress: string){
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let registeredTracker;
  try {
    registeredTracker = await contract.hasRole(await contract.REGISTERED_TRACKER, signedInAddress);
  } catch (error) {
    registeredTracker = getErrorMessage(error)
  }
  console.log('getRegisteredTracker: hasRole result = ' + registeredTracker);
  return true;
}

export async function track(
  w3provider: Web3Provider,
  trackee: string,
  tokenIds: string,
  inAmounts: string,
  outAmounts: string,
  trackerIds: string,
  fromDate: Date,
  thruDate: Date
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let track_result;
  try {
    await signed.track(
      trackee,
      convertStringToArray(tokenIds),
      convertToTons(inAmounts),
      convertToTons(outAmounts),
      convertToTons(trackerIds),
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      "",
      ""
    );
    track_result = SUCCESS_MSG;
  } catch (error) {
    track_result = catchError(error);
  }
  return track_result;
}

function convertStringToArray(params: string){
  return params.replace(/\s/g,'').split(',').map(Number);
}
function convertToTons(params: string){
  return convertStringToArray(params).map(function(item){ return item*1000 })
}

