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
  // create token metadata
  let token = new Token(event.params.tokenId.toString());
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
  token.holders = [event.params.issuee.toString()];

  // update holder
  let holder = Holder.load(event.params.issuee.toString());
  if (holder == null) { // create if necessary
    holder = new Holder(event.params.issuee.toString());
    holder.address = event.params.issuee;
  }

  // update token balances
  let tokenBalance = TokenBalance.load(
    event.params.tokenId.toString() + event.params.issuee.toString()
  );
  if (tokenBalance == null) { // create if necessary
     tokenBalance = new TokenBalance(
       event.params.tokenId.toString() + event.params.issuee.toString()
     );
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
  let tokenBalance = TokenBalance.load(
    event.params.tokenId.toString() + event.params.account.toString()
  );
  tokenBalance.available = tokenBalance.available.minus(event.params.amount);
  tokenBalance.retired = tokenBalance.retired.plus(event.params.amount);
  tokenBalance.save();
}

export function handleTransferBatch(event: TransferBatch): void {
  // @TODO implement
}

export function handleTransferSingle(event: TransferSingle): void {
  let tokenBalanceSender = TokenBalance.load(
    event.params.id.toString() + event.params.from.toString()
  );
  let tokenBalanceReceiver = TokenBalance.load(
    event.params.id.toString() + event.params.to.toString()
  )
  if (tokenBalanceReceiver == null) { // create if necessary
     tokenBalanceReceiver = new TokenBalance(
       event.params.id.toString() + event.params.to.toString()
     );
    tokenBalanceReceiver.token = event.params.id.toString();
    tokenBalanceReceiver.holder = event.params.to.toString();
  }
  tokenBalanceSender.available = tokenBalanceSender.available.minus(event.params.value);
  tokenBalanceReceiver.available = tokenBalanceSender.available.plus(event.params.value);
  tokenBalanceSender.save();
}

export function handleURI(event: URI): void {}

export function handleUnregisteredDealer(event: UnregisteredDealer): void {}
