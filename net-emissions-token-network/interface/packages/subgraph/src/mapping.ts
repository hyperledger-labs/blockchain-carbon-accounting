// SPDX-License-Identifier: Apache-2.0
import { BigInt } from "@graphprotocol/graph-ts"
import {
  NetEmissionsTokenNetwork,
  ApprovalForAll,
  RegisteredDealer,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TokenCreated,
  TokenRetired,
  TransferBatch,
  TransferSingle,
  URI,
  UnregisteredDealer
} from "../generated/NetEmissionsTokenNetwork/NetEmissionsTokenNetwork"
import { Holder, Token, TokenBalance } from "../generated/schema"

// export function handleApprovalForAll(event: ApprovalForAll): void {
//   // Entities can be loaded from the store using a string ID; this ID
//   // needs to be unique across all entities of the same type
//   let entity = ExampleEntity.load(event.transaction.from.toHex())

//   // Entities only exist after they have been saved to the store;
//   // `null` checks allow to create entities on demand
//   if (entity == null) {
//     entity = new ExampleEntity(event.transaction.from.toHex())

//     // Entity fields can be set using simple assignments
//     entity.count = BigInt.fromI32(0)
//   }

//   // BigInt and BigDecimal math are supported
//   entity.count = entity.count + BigInt.fromI32(1)

//   // Entity fields can be set based on event parameters
//   entity.account = event.params.account
//   entity.operator = event.params.operator

//   // Entities can be written to the store with `.save()`
//   entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.DEFAULT_ADMIN_ROLE(...)
  // - contract.REGISTERED_CONSUMER(...)
  // - contract.REGISTERED_DEALER(...)
  // - contract.REGISTERED_EMISSIONS_AUDITOR(...)
  // - contract.REGISTERED_OFFSET_DEALER(...)
  // - contract.REGISTERED_REC_DEALER(...)
  // - contract.balanceOf(...)
  // - contract.balanceOfBatch(...)
  // - contract.getAvailableAndRetired(...)
  // - contract.getIssuer(...)
  // - contract.getNumOfUniqueTokens(...)
  // - contract.getRoleAdmin(...)
  // - contract.getRoleMember(...)
  // - contract.getRoleMemberCount(...)
  // - contract.getRoles(...)
  // - contract.getTokenDetails(...)
  // - contract.getTokenRetiredAmount(...)
  // - contract.getTokenType(...)
  // - contract.hasRole(...)
  // - contract.isApprovedForAll(...)
  // - contract.isConsumerRegistered(...)
  // - contract.isDealerRegistered(...)
  // - contract.supportsInterface(...)
  // - contract.uri(...)
// }

export function handleRegisteredDealer(event: RegisteredDealer): void {}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {}

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleTokenCreated(event: TokenCreated): void {

  // get IDs of entities
  let tokenId = event.params.tokenId.toString();
  let holderId = event.params.issuee.toHexString()
  let tokenBalanceId = tokenId + '-' + holderId;

  // create token and metadata
  let token = new Token(tokenId);
  let tokenTypeId = event.params.tokenTypeId;
  switch (tokenTypeId) {
    case 1:
      token.type = "RenewableEnergyCertificate";
      break;
    case 2:
      token.type = "CarbonEmissionsOffset";
      break;
    case 3:
      token.type = "AuditedEmissions";
      break;
    default:
      break;
  }
  token.issuer = event.params.issuer;
  token.issuee = event.params.issuee;
  token.fromDate = event.params.fromDate;
  token.thruDate = event.params.thruDate;
  token.automaticRetireDate = event.params.automaticRetireDate;
  token.metadata = event.params.metadata;
  token.manifest = event.params.manifest;
  token.description = event.params.description;
  token.holders = [holderId];

  // update holder
  let holder = Holder.load(holderId);
  if (holder == null) { // create if necessary
    holder = new Holder(holderId);
    holder.address = event.params.issuee;
  }

  // update token balances
  let tokenBalance = TokenBalance.load(tokenBalanceId);
  if (tokenBalance == null) { // create if necessary
     tokenBalance = new TokenBalance(tokenBalanceId);
    tokenBalance.token = token.id;
    tokenBalance.holder = holder.id;
  }
  tokenBalance.available = tokenBalance.available.plus(event.params.availableBalance);
  tokenBalance.retired = tokenBalance.retired.plus(event.params.retiredBalance);

  // update holder's tokens
  holder.tokens.push(tokenBalance.id);

  // save all
  token.save();
  holder.save();
  tokenBalance.save();
}

export function handleTokenRetired(event: TokenRetired): void {

  // get ID of entity
  let tokenBalanceId = event.params.tokenId.toString() + '-' + event.params.account.toHexString();

  // load tokenBalance
  let tokenBalance = TokenBalance.load(tokenBalanceId);

  // update balances
  tokenBalance.available = tokenBalance.available.minus(event.params.amount);
  tokenBalance.retired = tokenBalance.retired.plus(event.params.amount);

  tokenBalance.save();
}

export function handleTransferBatch(event: TransferBatch): void {
  // @TODO implement
}

export function handleTransferSingle(event: TransferSingle): void {

  // get IDs of entities
  let receiver = event.params.to.toHexString();
  let sender = event.params.from.toHexString();
  let tokenId = event.params.id.toString();
  let tokenBalanceSenderId = tokenId + '-' + sender;
  let tokenBalanceReceiverId = tokenId + '-' + receiver;

  // load tokenBalances; create reciever tokenBalance if necessary
  let tokenBalanceSender = TokenBalance.load(tokenBalanceSenderId);
  let tokenBalanceReceiver = TokenBalance.load(tokenBalanceReceiverId);
  if (tokenBalanceReceiver == null) { // create if necessary
    tokenBalanceReceiver = new TokenBalance(tokenBalanceReceiverId);
    tokenBalanceReceiver.token = tokenId;
    tokenBalanceReceiver.holder = receiver;
  }

  // update balances
  tokenBalanceSender.available = tokenBalanceSender.available.minus(event.params.value);
  tokenBalanceReceiver.available = tokenBalanceSender.available.plus(event.params.value);

  // add recipient to token's holders
  let token = Token.load(tokenId);
  if (token.holders.includes(sender) === false) {
    token.holders.push(sender);
  }
  // remove sender from token holders if no available or retired balance
  if (tokenBalanceSender.available.isZero() && tokenBalanceSender.retired.isZero()) {
    let holderToRemove = token.holders.indexOf(receiver);
    token.holders.splice(holderToRemove, 1);
  }

  tokenBalanceSender.save();
  tokenBalanceReceiver.save();
}

export function handleURI(event: URI): void {}

export function handleUnregisteredDealer(event: UnregisteredDealer): void {}
