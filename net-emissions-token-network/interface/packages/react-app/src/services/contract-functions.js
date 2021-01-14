import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

const SUCCESS_MSG = "Success! Transaction has been submitted to the network. Please wait for confirmation on the blockchain.";

// Helper function to prevent ambiguous failure message when dates aren't passed
function convertToZeroIfBlank(num) {
  return parseInt(num) || 0;
}

function toUnixTime(date) {
  // Return date if not a Date object
  if (Object.prototype.toString.call(date) !== "[object Date]") return date;
  return parseInt((date.getTime() / 1000).toFixed(0));
}

export async function getRoles(w3provider, address) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let roles;
  try {
    roles = await contract.getRoles(address);
  } catch (error) {
    roles = error.message;
  }
  return roles;
}

export async function getIssuer(w3provider, tokenId) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let issuer;
  try {
    issuer = await contract.getIssuer(tokenId);
  } catch (error) {
    issuer = error.message;
  }
  return issuer;
}

export async function getTokenDetails(w3provider, tokenId) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let details;
  try {
    details = await contract.getTokenDetails(tokenId);
  } catch (error) {
    details = error.message;
  }
  return details;
}

export async function getNumOfUniqueTokens(w3provider) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let uniqueTokens;
  try {
    uniqueTokens = await contract.getNumOfUniqueTokens();
  } catch (error) {
    uniqueTokens = error.message;
  }
  return uniqueTokens;
}

export async function getAvailableAndRetired(w3provider, address, tokenId) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let balances;
  try {
    balances = await contract.getAvailableAndRetired(address, tokenId);
  } catch (error) {
    balances = error.message;
  }
  return balances;
}

export async function getTokenType(w3provider, tokenId) {
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let tokenType;
  try {
    tokenType = await contract.getTokenType(tokenId);
  } catch (error) {
    tokenType = error.message;
  }
  return tokenType;
}

export async function issue(
  w3provider,
  address,
  tokenTypeId,
  quantity,
  fromDate,
  thruDate,
  automaticRetireDate,
  metadata,
  manifest,
  description
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let issue_result;
  try {
    await signed.issue(
      address,
      tokenTypeId,
      quantity,
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      convertToZeroIfBlank(toUnixTime(automaticRetireDate)),
      metadata,
      manifest,
      description
    );
    issue_result = SUCCESS_MSG;
  } catch (error) {
    // Format error message
    if (error.message.startsWith("resolver or addr is not configured for ENS name")) {
      issue_result = "Error: Invalid address. Please enter a valid address of the format 0x000...";
    } else if (error.message.startsWith('invalid BigNumber string (argument="value"')) {
      issue_result = "Error: Invalid quantity. Please enter a valid quantity of tokens to issue.";
    } else {
      issue_result = error.message;
    }
  }
  return issue_result;
}

export async function retire(w3provider, tokenId, amount) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let retire_result;
  try {
    await signed.retire(tokenId, amount);
    retire_result = SUCCESS_MSG;
  } catch (error) {
    retire_result = error.message;
  }
  return retire_result;
}

export async function transfer(w3provider, address, tokenId, amount) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let transfer_result;
  try {
    await signed.transfer(address, tokenId, amount);
    transfer_result = SUCCESS_MSG;
  } catch (error) {
    transfer_result = error.message;
  }
  return transfer_result;
}

export async function registerConsumer(w3provider, address) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let registerConsumer_result;
  try {
    await signed.registerConsumer(address);
    registerConsumer_result = SUCCESS_MSG;
  } catch (error) {
    registerConsumer_result = error.message;
  }
  return registerConsumer_result;
}

export async function unregisterConsumer(w3provider, address) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let unregisterConsumer_result;
  try {
    await signed.unregisterConsumer(address);
    unregisterConsumer_result = SUCCESS_MSG;
  } catch (error) {
    unregisterConsumer_result = error.message;
  }
  return unregisterConsumer_result;
}

export async function registerDealer(w3provider, address, tokenTypeId) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let registerDealer_result;
  try {
    await signed.registerDealer(address, tokenTypeId);
    registerDealer_result = SUCCESS_MSG;
  } catch (error) {
    registerDealer_result = error.message;
  }
  return registerDealer_result;
}

export async function unregisterDealer(w3provider, address, tokenTypeId) {
  let signer = w3provider.getSigner();
  let contract = new Contract(addresses.tokenNetwork.address, abis.netEmissionsTokenNetwork.abi, w3provider);
  let signed = await contract.connect(signer);
  let unregisterDealer_result;
  try {
    await signed.unregisterDealer(address, tokenTypeId);
    unregisterDealer_result = SUCCESS_MSG;
  } catch (error) {
    unregisterDealer_result = error.message;
  }
  return unregisterDealer_result;
}
