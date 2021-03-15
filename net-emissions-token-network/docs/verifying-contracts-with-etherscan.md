# Verifying Contracts with Etherscan

[Etherscan](https://etherscan.io/) is a popular block explorer for Ethereum networks that can be used to directly read and write transactions from smart contracts. In order for Etherscan to display the names of the contract functions after compiling and deploying, one must supply Etherscan with the contract code (and the same constructor arguments) for verification. Once the contract is verified, it is easier to view interactions with the contract as it deciphers the payloads.

These instructions will show verifying on Goerli, but any supported EVM chain on Etherscan will work as long as the config is set in `hardhat.config.js`.

To submit a contract for verification:

1. Go to [Etherscan](https://etherscan.io/) to sign up for an account.  Then go to API Keys and enter get an API key. 

2.  Create `.ethereum-config.js` by copying the template with 

```bash
cp .ethereum-config.js.template .ethereum-config.js
```

3. Populate your `ethereum-config.js` with your Etherscan API key.

4. Edit the file `hardhat.config.js` and uncomment these lines 

```bash
   // const ethereumConfig = require("./.ethereum-config");
    ...
   // apiKey: `${etherscanConfig.ETHERSCAN_API_KEY}`
```

Also make sure that the Goerli settings are uncommented (see above.)

5. Verify with the following command (replace DEPLOYED_CONTRACT_ADDRESS with the contract address and CONSTRUCTOR_ARGS with the arguments used to deploy the contract):

```bash
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```
You should see

```bash
Successfully verified contract NetEmissionsTokenNetwork on Etherscan
```

You can now go to https://goerli.etherscan.io/ to search for your contract and wallet addresses and see the transactions.  Click through to a particular transaction, and click on the button to "Decode Input Data".  You will now see all the fields of the transaction.
