# Using Hedera Hashgraph

## Setting Up

Go to the [Hedera Portal](https://portal.hedera.com/register) to sign up for a Hedera testnet account.  Once your sign up is successful, you will get a public key, private key, and testnet account ID.  

Get a [Hedera wallet](https://hedera.com/buying-guide)  If you've not used a Hedera wallet before, you can install the Hashpack browser plugin.  Then, create an account, import your wallet, and enter the account ID and private key from your Hedera portal, and click on the "Testnet account" box. 

Copy the file `.env.SAMPLE` to .`env` and fill in your testnet account ID and private key.

## Deploying to Hedera

Install the dependencies in this directory

```
npm install
```

Then run the deploy script

```
$ node deploy.js 
Chunk 0 added.  The smart contract bytecode file ID is 0.0.34117678
Processing chunk 1
Chunk 1 appended with status SUCCESS
Processing chunk 2
Chunk 2 appended with status SUCCESS
Processing chunk 3
Chunk 3 appended with status SUCCESS
Processing chunk 4
Chunk 4 appended with status SUCCESS
Processing chunk 5
Chunk 5 appended with status SUCCESS
Processing chunk 6
Chunk 6 appended with status SUCCESS
Processing chunk 7
Chunk 7 appended with status SUCCESS
Processing chunk 8
Chunk 8 appended with status SUCCESS
The smart contract ID is 0.0.34117679
The smart contract Solidity address is 000000000000000000000000000000000208982f
```

## Block Explorer

The testnet blockscan is at https://testnet.dragonglass.me/hedera/home

You can search, for example, for your contract ID to see it's been deployed.

## TODO

The react-app UI needs to use HashConnect to connect to the Hedera wallet.  See [Hashpack Hashconnect demo](https://github.com/Hashpack/hashconnect)

[Mirror nodes](https://hedera.com/blog/how-to-look-up-transaction-history-on-hedera-using-mirror-nodes-back-to-the-basics) can be used to search transactions like GraphQL.

See also reference [demo applications](https://docs.hedera.com/guides/resources/demo-applications)