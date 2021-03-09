import { BigInt } from "@graphprotocol/graph-ts"
import {
  NetEmissionsTokenNetwork,
  ApprovalForAll,
  RegisteredDealer,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TokenCreated,
  TransferBatch,
  TransferSingle,
  URI,
  UnregisteredDealer
} from "../generated/NetEmissionsTokenNetwork/NetEmissionsTokenNetwork"
import { Token } from "../generated/schema"

export function handleApprovalForAll(event: ApprovalForAll): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.account = event.params.account
  entity.operator = event.params.operator

  // Entities can be written to the store with `.save()`
  entity.save()

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
}

export function handleIssue(event: TokenCreated): void {
  let token = new Token(event.params.tokenId);
  token.count = event.params.availableBalance;

  let tokenTypeId = event.params.tokenTypeId;
  switch (tokenTypeId) {
    case 1:
      token.tokenType = "RenewableEnergyCertificate";
      break;
    case 2:
      token.tokenType = "CarbonEmissionsOffset";
      break;
    case 3:
      token.tokenType = "AuditedEmissions";
      break;
    default:
      console.error("Invalid tokenTypeId");
  }

  token.issuer = event.params.issuer;
  token.issuee = event.params.issuee;
  token.fromDate = event.params.fromDate;
  token.thruDate = event.params.thruDate;
  token.automaticRetireDate = event.params.automaticRetireDate;
  token.metadata = event.params.metadata;
  token.manifest = event.params.manifest;
  token.description = event.params.description;
  // token.holders = [event.params._tokenDetails.issuee];
  token.save()
}

export function handleRegisteredDealer(event: RegisteredDealer): void {}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {}

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleTokenCreated(event: TokenCreated): void {}

export function handleTransferBatch(event: TransferBatch): void {}

export function handleTransferSingle(event: TransferSingle): void {}

export function handleURI(event: URI): void {}

export function handleUnregisteredDealer(event: UnregisteredDealer): void {}
