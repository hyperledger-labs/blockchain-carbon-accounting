# Net Emissions Tokens Network

The (net) emissions tokens network is a blockchain network for recording and trading the emissions from different channels such as the [utility emissions channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel), plus offsetting Renewable Energy Certificates and carbon offsets. Each token represents either an emissions debt, which you incur through activities that emit greenhouse gases, or an emissions credit, which offset the debt by removing emissions from the atmosphere.

Read more on the [Hyperledger Emissions Tokens Network Wiki page](https://wiki.hyperledger.org/display/CASIG/Emissions+Tokens+Network).

To see how it works, check out [this video](https://youtu.be/C-cUjQLDGJw).

## Contracts

The net emissions token network is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts.

### Installation and use

Clone this repository, navigate to the net-emissions-token-network directory, and run `npm install`

#### Misc. contract commands

- To test, run `npx hardhat test`
- To compile, run `npx hardhat compile`
- To export ABIs after recompiling contract, run `sh exportAbis.sh`
- To see all commands, run `npx hardhat`

## Interface

The interface for interacting with the contract is created using [create-eth-app](https://github.com/PaulRBerg/create-eth-app). The MetaMask browser extension is required for testing.

The application connects to the contract of the address specified in `net-emissions-token-network/interface/packages/contracts/src/addresses.js`, which is by default set to the default address of deployment on the Hardhat Network. To instead connect to an Ethereum testnet on Goerli, read *Starting the React application and connecting to Goerli testnet*, otherwise, read the instructions below.

### Starting the React application and connecting to local Hardhat Network

To run a testnet locally via Hardhat Network:

1. From the `net-emissions-token-network/interface` directory, install the necessary packages and start the React app with

```bash
yarn install
yarn react-app:start
```

2. In a separate terminal, start a local Hardhat Network in `net-emissions-token-network/` with:

```bash
npx hardhat node
```

3. In a separate terminal, deploy the contracts in `net-emissions-token-network/` to the local Hardhat Network with:

```bash
npx hardhat run --network localhost scripts/deploy-all.js
```

The address of the NetEmissionsTokenNetwork contract should end with `0aa3`. `deploy-all.js` is used for deploying the governance contracts in addition to the NetEmissionsTokenNetwork contract.

4. Import the private keys of the accounts from Hardhat in the terminal window after clicking the account icon then Import Account.

5. Within the settings for localhost in MetaMask, be sure that the Chain ID is set to 1337.

6. In the MetaMask extension after navigating to the interface in the browser, change the network from Ethereum Mainnet to _Localhost 8545_. Make sure Metamask says the account is "Connected" with a green dot.

7. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

8. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to your local testnet and be able to interact with contracts deployed on it through the React application.

_Note: When restarting the Hardhat Network after interacting with the contracts through MetaMask, it might be necessary to reset the account's transactions otherwise an "invalid nonce" error might occur due to the way Ethereum prevents double-counting transactions. To reset transaction history in MetaMask, click the account icon in the top right, go to Settings, Advanced, and Reset Account._

### Starting the React application and connecting to Goerli testnet

Goerli is a public Ethereum testnet. When interacting with the contract on Goerli, access to the owner private key is needed to register dealers via the interface, and new wallets can be created via MetaMask (be sure to fund newly created wallets with Goerli ETH via a faucet or transferring funds for gas fees). Transactions can be viewed by anyone on [Etherscan](https://goerli.etherscan.io/) (to see the history of transactions, one can enter the current contract address at `net-emissions-token-network/interface/packages/contracts/src/addresses.js`). After deploying the contract to Goerli (as outlined under the section Deploying contract to Goerli), connect the interface with the following steps:

1. In `net-emissions-token-network/interface/packages/contracts/src/addresses.js`, replace the contract address deployed to the Hardhat Network (ending in `0aa3`) with the address of the Goerli contract you'd like to connect to.

2. From the `net-emissions-token-network/interface` directory, install the necessary packages and start the React app with

```bash
yarn install
yarn react-app:start
```

3. After navigating to `localhost:3000` in the browser, change the network from Ethereum Mainnet to _Goerli Test Network_. Make sure MetaMask says the account is "Connected" with a green dot.

4. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

5. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to the contract in Goerli and be able to interact with contracts deployed on it through the React application.

---

### Deploying Net Emissions Token Network contract to Goerli

If you'd like to deploy the contract to the Goerli testnet yourself, go to [Infura.io](https://infura.io/) to set up an account.  Then start a project under the "Ethereum" tab.  You will need the project ID.

Next, connect your Metamask wallet to the Goerli Test Network and create an account on it.  This will be used as the account for deploying your contract.  Copy the private key for the new account.  Go to a [Goerli faucet](https://faucet.goerli.mudit.blog) to get some test ETH for your account 

Now follow these steps to deploy the contract to the Goerli testnet and update references to the address:

1. Create `.ethereum-config.js` by copying the template with 

```bash
cp .ethereum-config.js.template .ethereum-config.js
```

2.  Edit `.ethereum-config.js` and set the private key for your Ethereum deployment address and Infura key.

3. Edit the file `hardhat.config.js` and uncomment these lines

```bash
     // const ethereumConfig = require("./.ethereum-config");
     ...
     // goerli: {
     //   url: `https://goerli.infura.io/v3/${goerliConfig.INFURA_PROJECT_ID}`,
     //   accounts: [`0x${goerliConfig.GOERLI_CONTRACT_OWNER_PRIVATE_KEY}`]
     //
```

4. Deploy by via the deploy script with the following command:

```bash
npx hardhat run --network goerli scripts/deploy-net-emissions-token-network.js
```
You will get a result that says

```bash
Net Emissions Token Network deployed to: 0x_________________________________
```

This is the deployed address for your contract. To update references on the React interface and Fabric API:

5. Update the deployed address for the interface in `net-emissions-token-network/interface/packages/contracts/src/addresses.js`.  You can also change the `network` attribute to "Goerli" so that it shows up in the react app later.

6. Update the deployed address for the Fabric API in `../utility-emissions-channel/typescript_app/src/blockchain-gateway/net-emissions-token-network/networkConfig.ts`.

### Deploying Net Emissions Token Network contract to Kovan or xDai

Steps for deploying the contract to the Kovan testnet and xDai sidechain are similar as deploying to Goerli:

1. Populate `.ethereum-config.js` with private keys.

2. Edit `hardhat.config.js` and uncomment the network configuration you would like to deploy to under module.exports.networks.

3. Deploy with

```bash
npx hardhat run --network kovan scripts/deploy.js
```

or 

```bash
npx hardhat run --network xdai scripts/deploy.js
```

### Verifying contracts on Etherscan

[Etherscan](https://etherscan.io/) is a popular block explorer for Ethereum networks. In order for Etherscan to display the names of the contract functions after compiling and deploying, one must supply Etherscan with the contract code for verification. Once the contract is verified, it is easier to view interactions with the contract as it deciphers the payloads. 

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

5. Verify with the following command (replace DEPLOYED_CONTRACT_ADDRESS with the contract address):

```bash
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS
```
You should see

```bash
Successfully verified contract NetEmissionsTokenNetwork on Etherscan
```

You can now go to https://goerli.etherscan.io/ to search for your contract and wallet addresses and see the transactions.  Click through to a particular transaction, and click on the button to "Decode Input Data".  You will now see all the fields of the transaction.

### Compiling with Optimism Virtual Machine

By default, Hardhat compiles to the EVM using the given Solidity version in `hardhat.config.js`. To instead compile to the [OVM](https://optimism.io/): 

1. Uncomment the line in `hardhat.config.js`:

```js
// require("@eth-optimism/plugins/hardhat/compiler");
```

2. If build artifacts exist, run `npx hardhat clean`

2. Compile with `npx hardhat compile`

### Testing the contract in Remix

For interacting with the contract in development, the current solution is to use the Remix IDE.

First, the remixd plugin must be installed globally via NPM to create a volume from your local machine to Remix in browser.

```bash
npm install -g @remix-project/remixd
```

Install the dependencies for the contract in the net-emissions-token-network directory:

```bash
npm install
```

To start the volume, run the following replacing `/path/to/repo` with the absolute path of this folder on your machine:

```bash
remixd -s /path/to/repo/blockchain-carbon-accounting/net-emissions-token-network --remix-ide https://remix.ethereum.org
```

After installing, navigate to https://remix.ethereum.org/ in the browser of your choice. (Currently only tested in Chrome)

Find the "plugins" tab on the left of the IDE user interface. Select remixd and connect. You will now see the entire net-emissions-token-network folder in the file explorer within remixd.

Under localhost -> contracts, select NetEmissionsTokenNetwork.sol in the file explorer.

Go to the compiler tab, change the compiler version to the same as the Solidity version at the beginning of the contract.  Check the box for "optimize" and compile the contract.

Next, select the "Deploy and run transactions tab", change the gas limit to "9999999", select "NetEmissionsTokenNetwork" from the drop down, and deploy the contract.

You can now interact with the contract's functions via the user interface in Remix.

### Running Slither static code analysis
Prerequsites
Python 3.6 or above

Installing Slither Code Analysis
```
pip3 install slither-analyzer
```

Running Slither Code Analysis
```
slither . --json slitherlog.json --print human-summary
```

You can also do all the steps by doing
```
sh runSlither.sh
```

Slither prints a nicely formatted table that looks like this
```
Compiled with Builder
Number of lines: 374 (+ 0 in dependencies, + 0 in tests)
Number of assembly lines: 1
Number of contracts: 3 (+ 0 in dependencies, + 0 tests) 

Number of optimization issues: 13
Number of informational issues: 9
Number of low issues: 8
Number of medium issues: 5
Number of high issues: 1

+-------------------+-------------+------+------------+--------------+--------------+
|        Name       | # functions | ERCS | ERC20 info | Complex code |   Features   |
+-------------------+-------------+------+------------+--------------+--------------+
|      Governor     |      26     |      |            |     Yes      | Receive ETH  |
|                   |             |      |            |              |   Send ETH   |
|                   |             |      |            |              |  Ecrecover   |
|                   |             |      |            |              | AbiEncoderV2 |
|                   |             |      |            |              |   Assembly   |
| TimelockInterface |      7      |      |            |      No      | Receive ETH  |
|                   |             |      |            |              | AbiEncoderV2 |
|   DaotInterface   |      2      |      |            |      No      | AbiEncoderV2 |
+-------------------+-------------+------+------------+--------------+--------------+
. analyzed (3 contracts)
```

You can also parse through the JSON file that is generated for more
detailed information in slitherlog.json.

To look for High Impact issues, search the JSON file for `"impact": "High"`.
