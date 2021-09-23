# DataLock Chaincode

Fabric chaincode for locking fabric data, while transactions related to the locked data are executed on different ledger/dataSource. Use of MVCC (Multiversion concurrency control) makes fabric a perfect blockchain for locking data. In fabric, MVCC is used for the solving double spending problem. DataLock uses the same facts, such that a single process with a unique id can only acquire lock.

DataLock also allow application to support reentrancy with transaction which require connecting with multiple ledgers/dataSource, by keeping track of all the state change happing on different ledgers/dataSource during the execution the the transaction.

DataLock chaincode can be used in following ways

1. To keep track of state changes happing on different ledgers/dataSource while a business logic is being performed.
2. To Lock/Unlock data maintained by a fabric chaincode deployed in the channel as DataLock chaincode.
3. Or, combination of both

![cc-lock](docs/img/cc-lock.png)

When locking the data present on different chaincode, rather then application invoking chaincode and chaincode having logic to interact with other chaincode. Now application can simply invoke to **DataLock** chaincode and with actual business logic implemented in the data chaincode. When application tries to lock a data maintained by a chaincode, **DataLock** chaincode invoke the required business logic on that chaincode, so that number of request to fabric network be minimized.

- [DataLock Chaincode](#datalock-chaincode)
- [Examples](#examples)
  - [Record Audited Emissions Token](#record-audited-emissions-token)

# Examples

## Record Audited Emissions Token

**Problem** : To mint a token on ethereum corresponding to a given emissions record data present on HL Fabric, and then update the emissions record with the minted tokenId.

![auditedEmissions](docs/img/auditedEmissions.png)