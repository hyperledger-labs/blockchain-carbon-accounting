// SPDX-License-Identifier: Apache-2.0
import { abis, addresses } from "@blockchain-carbon-accounting/contracts";
import { AbiCoder } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet"
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { RolesInfo, Tracker } from "../components/static-data";


const SUCCESS_MSG = "Success! Transaction has been submitted to the network. Please wait for confirmation on the blockchain.";
// was /(?<="message":")(.*?)(?=")/ but that does not work in Safari
const EXTRACT_ERROR_MESSAGE = /"message":"(.*?)="/;

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
        // last element is the captured group
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
  if (Object.prototype.toString.call(date) !== "[object Date]") return date as number;
  return parseInt(((date as Date).getTime() / 1000).toFixed(0));
}

export async function getBlockNumber(w3provider: Web3Provider | JsonRpcProvider) {
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

/** Decodes an epoch (number of seconds since Jan 1 1970) into a Date object. */
export function decodeDate(epoch_in_s?: number) {
  if (!epoch_in_s) {
    return undefined;
  } else {
    return new Date(epoch_in_s * 1000);
  }
}

/*
 *
 *  NetEmissionsTokenNetwork contract functions
 *
 */

export async function getRoles(w3provider: Web3Provider | JsonRpcProvider, address: string) {
  if (!w3provider || !address) return {};
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  try {
    const r = await contract.getRoles(address) as RolesInfo;
    // note: the returned value is not extensible, so copy the values here
    const roles = {...r}
    if (roles.isAdmin || roles.isRecDealer || roles.isConsumer || roles.isCeoDealer || roles.isAeDealer || roles.isIndustryDealer || roles.isIndustry) roles.hasAnyRole = true;
    if (roles.isAdmin || roles.isRecDealer || roles.isCeoDealer || roles.isAeDealer ) roles.hasDealerRole = true;
    if (roles.isIndustry) roles.hasIndustryRole = true;
    return roles;
  } catch (error) {
    console.error('getRoles', address, error);
    return {}
  }
}

export async function getIssuedBy(w3provider: Web3Provider | JsonRpcProvider, tokenId: number) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let issuer;
  try {
    issuer = await contract.getIssuedBy(tokenId);
  } catch (error) {
    issuer = getErrorMessage(error)
    console.error('getIssuedBy', error);
  }
  return issuer;
}

export async function getTokenDetails(w3provider: Web3Provider | JsonRpcProvider, tokenId: number) {
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

export async function getNumOfUniqueTokens(w3provider: Web3Provider | JsonRpcProvider) {
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

export async function getTokenType(w3provider: Web3Provider | JsonRpcProvider, tokenId: number) {
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

export async function getLimitedMode(w3provider: Web3Provider | JsonRpcProvider) {
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

export async function getAdmin(w3provider: Web3Provider | JsonRpcProvider) {
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
  w3provider: Web3Provider | JsonRpcProvider,
  issuedFrom: string | undefined,
  issuedTo: string,
  tokenTypeId: number,
  quantity: bigint,
  fromDate: number | Date,
  thruDate: number | Date,
  metadata: string,
  manifest: string,
  description: string,
  privateKey: string,
) {
  let issue_result;
  if (w3provider instanceof Web3Provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = contract.connect(signer);

    try {
      await signed.issue(
        issuedFrom || 0,
        issuedTo,
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
  } else {
    console.log("Json Provider - Issue");
    const signer  = new Wallet(privateKey, w3provider);
    let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, signer)
    try{
      await contract.issue(
        issuedFrom || 0,
        issuedTo,
        tokenTypeId,
        quantity,
        convertToZeroIfBlank(toUnixTime(fromDate)),
        convertToZeroIfBlank(toUnixTime(thruDate)),
        metadata,
        manifest,
        description
      );
      issue_result = SUCCESS_MSG;
    } catch(error){
      issue_result = catchError(error);
    }

  }

  return issue_result;
}

export async function issueAndTrack(
  w3provider: Web3Provider | JsonRpcProvider,
  issuedFrom: string,
  issuedTo: string,
  trackerId: number,
  _trackerDescription: string,
  tokenTypeId: number,
  quantity: number,
  fromDate: number|Date,
  thruDate: number|Date,
  metadata: string,
  manifest: string,
  description: string,
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let issue_result;
  try {
    await signed.issueAndTrack(
      issuedFrom,
      issuedTo,
      addresses.carbonTracker.address,
      trackerId,
      //trackerDescription,
      tokenTypeId,
      quantity,
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      metadata,
      manifest,
      description
    );
    //let tokenId = await signed.getNumOfUniqueTokens();
    issue_result = SUCCESS_MSG;
  } catch (error) {
    issue_result = catchError(error);
  }
  return issue_result;
}

export async function productUpdate(
  w3provider: Web3Provider | JsonRpcProvider,
  trackerId: number,
  productAmount: bigint,
  productName: string,
  productUnit: string,
  productUnitAmount: bigint,
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let issue_result,response;
  try {
    response = await signed.productsUpdate(
      trackerId,
      [0].map(Number),
      [productAmount].map(Number),
      convertStringToArray(productName),
      convertStringToArray(productUnit),
      [productUnitAmount].map(Number)
    );
    issue_result = SUCCESS_MSG;
  } catch (error) {
    issue_result = catchError(error);
  }
  return [issue_result,response];
}

export async function verifyTracker(
  w3provider: Web3Provider | JsonRpcProvider,
  trackerId: number
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let audit_result;
  try {
    await signed.audit(trackerId);
    audit_result = SUCCESS_MSG;
  } catch (error) {
    audit_result = catchError(error);
  }
  return audit_result;
}

export async function transferProduct(
  w3provider: Web3Provider | JsonRpcProvider,
  sourceTrackerId: number,
  productId: number,
  productAmount: number,
  trackee: string,
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let transfer_result;
  try {
    await signed.transferProduct(productId,productAmount,sourceTrackerId,trackee);
    transfer_result = SUCCESS_MSG;
  } catch (error) {
    transfer_result = catchError(error);
  }
  return transfer_result;
}



export async function retire(w3provider: Web3Provider | JsonRpcProvider, tokenId: number, amount: number) {
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

export async function transfer(w3provider: Web3Provider | JsonRpcProvider, address: string, tokenId: number, amount: number) {
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

export async function registerConsumer(w3provider: Web3Provider | JsonRpcProvider, address: string) {
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

export async function unregisterConsumer(w3provider: Web3Provider | JsonRpcProvider, address: string) {
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

export async function registerIndustry(w3provider: Web3Provider | JsonRpcProvider, address: string) {
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

export async function unregisterIndustry(w3provider: Web3Provider | JsonRpcProvider, address: string) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = contract.connect(signer);
  let registerIndustry_result;
  try {
    await signed.unregisterIndustry(address);
    registerIndustry_result = SUCCESS_MSG;
  } catch (error) {
    registerIndustry_result = catchError(error);
  }
  return registerIndustry_result;
}

export async function registerDealer(w3provider: Web3Provider | JsonRpcProvider, address: string, tokenTypeId: number) {
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

export async function unregisterDealer(w3provider: Web3Provider | JsonRpcProvider, address: string, tokenTypeId: number) {
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

export async function daoTokenTotalSupply(w3provider: Web3Provider | JsonRpcProvider) {
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

export async function daoTokenBalanceOf(w3provider: Web3Provider | JsonRpcProvider, account: string) {
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

export async function delegate(w3provider: Web3Provider | JsonRpcProvider, delegatee: string) {
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

export async function delegates(w3provider: Web3Provider | JsonRpcProvider, address: string) {
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

export async function getProposalCount(w3provider: Web3Provider | JsonRpcProvider) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let count;
  try {
    count = await contract.proposalCount();
  } catch (error) {
    count = getErrorMessage(error)
  }
  return count;
}

export async function getProposalDetails(w3provider: Web3Provider | JsonRpcProvider, proposalId: number): Promise<any|string> {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let proposals;
  try {
    proposals = await contract.proposals(proposalId);
  } catch (error) {
    proposals = getErrorMessage(error)
  }
  return proposals;
}

export async function getProposalState(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let state;
  try {
    state = await contract.state(proposalId);
  } catch (error) {
    state = getErrorMessage(error)
  }
  return PROPOSAL_STATES[state];
}

export async function propose(w3provider: Web3Provider | JsonRpcProvider, targets: string[], values: number[], signatures: string[], calldatas: string[], description: string[]) {
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

export async function getReceipt(w3provider: Web3Provider | JsonRpcProvider, proposalId: number, voter: string) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let receipt;
  try {
    receipt = await contract.getReceipt(proposalId, voter);
  } catch (error) {
    receipt = catchError(error);
  }
  return receipt;
}

export async function getActions(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let actions;
  try {
    actions = await contract.getActions(proposalId);
  } catch (error) {
    actions = catchError(error);
  }
  return actions;
}

export async function getDescription(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
  let contract = new Contract(addresses.dao.governor.address, abis.governor.abi, w3provider);
  let description;
  try {
    description = await contract.getDescription(proposalId);
  } catch (error) {
    description = catchError(error);
  }
  return description;
}

export async function castVote(w3provider: Web3Provider | JsonRpcProvider, proposalId: number, support: boolean, votes: BigNumber) {
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

export async function queue(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
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

export async function execute(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
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

export async function cancel(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
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

export async function refund(w3provider: Web3Provider | JsonRpcProvider, proposalId: number) {
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

export async function getQuorum(w3provider: Web3Provider | JsonRpcProvider) {
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

export async function getProposalThreshold(w3provider: Web3Provider | JsonRpcProvider) {
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
export async function registerTracker(w3provider: Web3Provider | JsonRpcProvider,trackee: string){
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

export async function getNumOfUniqueTrackers(w3provider: Web3Provider | JsonRpcProvider) {
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let uniqueTrackers;
  try {
    uniqueTrackers = await contract.getNumOfUniqueTrackers();
  } catch (error) {
    uniqueTrackers = getErrorMessage(error)
  }
  return uniqueTrackers;
}
export async function getTrackerDetails(
  w3provider: Web3Provider | JsonRpcProvider,
  trackerId: number,
  address: string): Promise<Tracker|string> {
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let details;
  try {
    let [trackerDetails, totalEmissions, productIds] = (await contract.getTrackerDetails(trackerId));
    totalEmissions = BigInt(totalEmissions);
    productIds = productIds.map(Number)
    let totalProductAmounts = Number(trackerDetails.totalProductAmounts);

    let owner = await contract.ownerOf(trackerId);

    let [tokenIds,tokenAmounts] = await contract.getTrackerTokenDetails(trackerId);

    let decimals = (await contract.decimalsEf()).toNumber();
    let emissionFactor = await contract.emissionFactor(trackerId) / decimals;

    let myTokenAmounts = [].map(BigInt);
    let emissionFactors = [];
    let myProductsTotalEmissions = BigInt(0);

    let myProductBalances =[].map(Number);
    let productAmounts=[].map(Number),available=[],productNames=[],conversions=[],units=[];

    let result;
    for (let i = 0; i < productIds.length; i++) {
      const productDetails = await contract.getProductDetails(productIds[i]);
      result = productDetails;

      productAmounts.push(Number(result[1]));
      available.push(Number(result[2]));

      result = await contract.getProductOptionalDetails(productIds[i]);
      
      productNames.push(result[0].toString());
      //conversions.push(result[1].toNumber()/decimals);
      units.push(result[2].toString());

      result = await contract._productData(productIds[i]);
      conversions.push(result[2].toNumber()/result[6].toNumber())

      myProductBalances[i] = Number(await contract.getProductBalance(productIds[i],trackerId,address));

      myTokenAmounts = tokenAmounts.map((e:number) => (
        (e*myProductBalances[i]/totalProductAmounts)));

      myProductsTotalEmissions += BigInt(Math.floor(myProductBalances[i]*emissionFactor)) ;


      productAmounts[i] = (productAmounts[i] * conversions[i]);
      myProductBalances[i] = (myProductBalances[i] * conversions[i]);
      available[i] = (available[i] * conversions[i]);

      emissionFactors[i] = (emissionFactor / conversions[i]);
    }
    if(myProductsTotalEmissions>0 && owner.toString().toLowerCase()!==address.toLowerCase()){
      totalEmissions = myProductsTotalEmissions;
      tokenAmounts = myTokenAmounts;
      available = myProductBalances;
    }
    let tokenDetails = [];
    for (let i = 0; i < tokenIds.length; i++) {
      tokenDetails[i]= await getTokenDetails(w3provider,tokenIds[i]);
    }

    let tracker: Tracker = {
      trackerId,
      auditor: trackerDetails.auditor,
      trackee: trackerDetails.trackee,
      fromDate: Number(trackerDetails.fromDate),
      thruDate: Number(trackerDetails.thruDate),
      metadata: trackerDetails.metadata,
      description: trackerDetails.description,
      totalEmissions,
      //: Number(remainingEmissions.toFixed(0)),
      myProductsTotalEmissions: myProductsTotalEmissions,
      //totalOffset: totalOffset,
      products: {
        ids: productIds,
        myBalances: myProductBalances.map(BigInt),
        names: productNames,
        amounts: productAmounts,
        available,
        emissionFactors: emissionFactors,
        units,
        conversions
      },
      tokens: {
        amounts: tokenAmounts,
        details: tokenDetails
      },
    };
    details = tracker
  } catch (error) {
    details = getErrorMessage(error)
  }
  return details;
}
export async function getTrackerIds(w3provider: Web3Provider | JsonRpcProvider, trackerId: number) {
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let trackerIds;
  try {
    trackerIds = await contract.getTrackerIds(trackerId);
  } catch (error) {
    trackerIds = getErrorMessage(error)
  }
  return trackerIds;
}
export async function getEmissionFactor(w3provider: Web3Provider | JsonRpcProvider, trackerId: number, tokenTypeId: number){
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let ef;
  try {
    ef = await contract.emissionFactor(trackerId,tokenTypeId);
  } catch (error) {
    ef = getErrorMessage(error)
  }
  return ef;
}

export async function getTokenAmounts(w3provider: Web3Provider | JsonRpcProvider, trackerId: number, sourceTrackerId: number){
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let tokenAmounts;
  try {
    tokenAmounts = await contract.getTokenAmounts(trackerId,sourceTrackerId);
  } catch (error) {
    tokenAmounts = getErrorMessage(error)
  }
  return tokenAmounts;
}

export async function getRegisteredTracker(w3provider: Web3Provider | JsonRpcProvider, signedInAddress: string){
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
  w3provider: Web3Provider | JsonRpcProvider,
  trackee: string,
  tokenIds: string,
  tokenAmounts: string,
  fromDate: number|Date, //number|
  thruDate: number|Date, //number|
  description: string){
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let track_result;
  try {
    track_result=await signed.track(
      trackee,
      convertStringToNumArray(tokenIds),
      convertToTons(tokenAmounts),
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      description
    );
    track_result = SUCCESS_MSG;
  } catch (error) {
    track_result = catchError(error);
  }
  return track_result;
}

export async function trackUpdate(
  w3provider: Web3Provider | JsonRpcProvider, trackerId: number,
  tokenIds: string,tokenAmounts: string,
  fromDate: number|Date,thruDate: number|Date,
  description: string){
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.carbonTracker.address, abis.carbonTracker.abi, w3provider);
  let signed = contract.connect(signer);
  let track_result;
  try {
    track_result=await signed.trackUpdate(
      trackerId,
      convertStringToNumArray(tokenIds),
      convertToTons(tokenAmounts),
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      description
    );
    track_result = SUCCESS_MSG;
  } catch (error) {
    track_result = catchError(error);
  }
  return track_result;
}

function convertStringToNumArray(params: string){
  return params.replace(/\s/g,'').split(',').map(Number);
}
function convertStringToArray(params: string){
  return params.split(',').map(String);
}
function convertToTons(params: string){
  return convertStringToNumArray(params).map(function(item){ return item*1000 })
}

