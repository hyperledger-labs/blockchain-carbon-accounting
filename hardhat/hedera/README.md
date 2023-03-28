# Using Hedera Hashgraph

## Setting Up

Go to the [Hedera Portal](https://portal.hedera.com/register) to sign up for a Hedera testnet account.  Once your sign up is successful, you will get a public key, private key, and testnet account ID.  

Copy the file `.env.SAMPLE` to .`env` and fill in your testnet account ID and private key.

### Etherum Wallet Setup

Thanks to the [Hedera JSON-RPC relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay) you can now connect to Hedera nodes using exisitng Ethereum tools like metamask. Here we explain how to use the [hashio community service](https://swirldslabs.com/hashio/). Alternatively, implement your own instance of the [open source relay](https://github.com/hashgraph/hedera-json-rpc-relay).


To import a Hedera network and add your private key generated above to metamask follow these (instructions)[https://hedera.com/blog/leveraging-ethereum-developer-tools-on-hedera#:~:text=over%20your%20account.-,Import,-Hedera%20Account%20into].

### Block explorer


Add the following block explorer to your wallet provider. [https://hashscan.io/](https://hashscan.io/)

Another testnet blockscan is at https://testnet.dragonglass.me/hedera/home

You can search, for example, for your contract ID to see it's been deployed.

### Hedera wallet

You can also interact with the network using a native [Hedera wallet](https://hedera.com/buying-guide). If you've not used a Hedera wallet before, you can install the Hashpack browser plugin.  Thevn, create an account, import your wallet, and enter the account ID and private key from your Hedera portal, and click on the "Testnet account" box. 

*TODO*:

The react-app UI needs to use HashConnect to connect to the Hedera wallet.  See [Hashpack Hashconnect demo](https://github.com/Hashpack/hashconnect)

*Recommend using [Ethereum Wallet Setup](#ethereum-wallet-setup) for metamask*

[Mirror nodes](https://hedera.com/blog/how-to-look-up-transaction-history-on-hedera-using-mirror-nodes-back-to-the-basics) can be used to search transactions like GraphQL.

See also reference [demo applications](https://docs.hedera.com/guides/resources/demo-applications)


## Deploying to Hedera

### Using hashgraph SDK

We can deploy the contracts using the [@hashgraph/sdk](https://github.com/hashgraph/hedera-sdk-js). See [Deploy Your First Contract](https://docs.hedera.com/hedera/tutorials/smart-contracts/deploy-your-first-smart-contract#3.-deploy-a-hedera-smart-contract) for background.

Install the dependencies in this directory

```
npm install
```

Run the deploy script to add the NetEmissionsToken and Carbon Tracker contract to the hedera testnet.
*TODO: include DAOToken, Timelock and Governon contracts* 

```
$ node deploy.js 
Deploy NetEmissionsTokenNetwork contract
Chunk 0 added.  The smart contract bytecode file ID is 0.0.34117678
Processing chunk 1
Chunk 1 appended with status SUCCESS
Processing chunk 2
Chunk 2 appended with status SUCCESS
...

The smart contract ID is 0.0.xxxxxxxx
The smart contract Solidity address is 000000000000000000000000000000000xxxxxxx
Deploy CarbonTracker contract
Chunk 0 added.  The smart contract bytecode file ID is 0.0.34117678
Processing chunk 1
Chunk 1 appended with status SUCCESS
Processing chunk 2
Chunk 2 appended with status SUCCESS
...

The smart contract ID is 0.0.xxxxxxxx
The smart contract Solidity address is 000000000000000000000000000000000xxxxxxx
```

## Hardhat deploy

The [Hedera JSON-RPC relay](https://docs.hedera.com/hedera/core-concepts/smart-contracts/json-rpc-relay) can also be used to deploy the contract using Hardhat.

However, this community relay fails to deploy larger contracts becasue of gas fee throttling. 
