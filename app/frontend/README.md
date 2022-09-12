# Background

The React application is a dApp used to manage different participants in the [Emissions Tokens Network](https://wiki.hyperledger.org/display/CASIG/Emissions+Tokens+Network+Project) and the [DAO](https://wiki.hyperledger.org/display/CASIG/DAO+Project).  It could be used to issue, transfer, or retire CLM8 tokens for addition or reduction of Greenhouse Gas (GHG) emissions; create, vote, and execute proposals such as issuing emissions offsets; and manage members of the network and their roles.

While the CLM8 token is denominated in 1 kg per token, in the React application the displayed unit is in metric tons.  Therefore, quantities of the CLM8 tokens are
multiplied or divided by 1000.

This application was created using [create-eth-app](https://github.com/PaulRBerg/create-eth-app). The MetaMask browser extension is required to connect your accounts.

## Api Server

The api server provides all the endpoints for the React client.  It also synchronizes the blockchain network with a PostgreSQL database so that the UI could search and query the tokens and create dashboards.  See [api-server README](../api-server/README.md) on how to configure and start it. 

## Setting Up

The application connects to the contract of the address specified in `app/frontend/contracts/src/addresses.js`, which is by default set to the default address of deployment on the Hardhat Network. To instead connect to an Ethereum testnet (like Goerli), read *Starting the React application and connecting to Goerli testnet*, otherwise, read the instructions below.

 If you have a Google API key for mapping locations (used for calculating flight and shipping emissions), or you have custom endpoints for your API server or local Ethereum network, you can configure them by copying the file `app/frontend/react-app/.env.SAMPLE` to `app/frontend/react-app/.env` and put them there.  Otherwise, the dApp will use a random number for distance for testing purposes, and it'll use the default endpoints in `app/frontend/react-app/src/services/api.config.ts`.  

## With Hardhat Network local testnet

To run a testnet locally via Hardhat Network:

1. Start the React app in the root directory with

```bash
npm run frontend
```

2. In a separate terminal, start a local Hardhat Network in the root directory with:

```bash
npm run hardhat
```

In another terminal, setup default roles and some demo issued tokens by running:
```bash
npm run hardhat-setup
```

3. Import the private keys of the accounts from Hardhat in the terminal window after clicking the account icon then Import Account.

4. Within the settings for localhost in MetaMask, be sure that the Chain ID is set to 1337.

5. In the MetaMask extension after navigating to the interface in the browser, change the network from Ethereum Mainnet to _Localhost 8545_. Make sure Metamask says the account is "Connected" with a green dot.

6. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

7. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to your local testnet and be able to interact with contracts deployed on it through the React application.

_IMPORTANT NOTE: When restarting the Hardhat Network after interacting with the contracts through MetaMask, it is necessary to reset the account's transactions otherwise an "invalid nonce" error might occur due to the way Ethereum prevents double-counting transactions. To reset transaction history in MetaMask, click the account icon in the top right, go to Settings, Advanced, and Reset Account._

## With Goerli testnet

Goerli is a public Ethereum testnet. When interacting with the contracts on Goerli, access to the owner private key is needed to register dealers via the interface, and new wallets can be created via MetaMask (be sure to fund newly created wallets with Goerli ETH via a faucet or transferring funds for gas fees). Transactions can be viewed by anyone on [Etherscan](https://goerli.etherscan.io/) (to see the history of transactions, one can enter the current contract address at `app/frontend/contracts/src/addresses.js`). After deploying the contracts to Goerli (as also outlined in the docs), connect the interface with the following steps:

1. In `app/frontend/contracts/src/addresses.js` at the bottom of the file where it says `const addresses = networksAndAddresses.hardhat`, replace "hardhat" with "goerli" since the contract addresses are already defined in the same file.

2. Start the React app in the root directory with

```bash
npm run frontend
```

3. After navigating to `localhost:3000` in the browser, change the network from Ethereum Mainnet to _Goerli Test Network_. Make sure MetaMask says the account is "Connected" with a green dot.

4. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

5. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to the contracts in Goerli and be able to interact with contracts deployed on it through the React application.

## With BSC testnet

BSC testnet is a test environment for Binance Chain network, run by the Binance Chain development community, which is open to developers. Transactions can be viewed by anyone on [Bscscan](https://testnet.bscscan.com/) (to see the history of transactions, one can enter the current contract address at `app/frontend/contracts/src/addresses.js`). After deploying the contracts to BSC testnet (as also outlined in the docs), connect the interface with the following steps:

1. In `app/frontend/contracts/src/addresses.js` at the bottom of the file where it says `const addresses = networksAndAddresses.hardhat`, replace "hardhat" with "bsctestnet" since the contract addresses are already defined in the same file.

2. Start the React app in the root directory with

```bash
npm run frontend
```

3. After navigating to `localhost:3000` in the browser, change the network from Ethereum Mainnet to _Binance Test Network_. Make sure MetaMask says the account is "Connected" with a green dot.

4. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

5. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to the contracts in Binance and be able to interact with contracts deployed on it through the React application.

## With Optimism local testnet

Optimism is a layer-2 solution for EVM-based layer-1 chains. It runs in a separate repository and can be used to test deployment to Optimism.

1. Run a local Optimism testnet using the [`optimism-integration`](https://github.com/ethereum-optimism/optimism-integration) repository (see `using-the-contracts.md` for more information).

2. In a separate terminal, deploy the contracts in `hardhat/` with:

```bash
npx hardhat deploy --network ovm_localhost
```

3. In `app/frontend/contracts/src/addresses.js`, uncomment the Optimism localhost contract addresses already in the file and comment out the Hardhat Network contract addresses.

4. Start the React app in the root directory with

```bash
npm run frontend
```

5. After navigating to `localhost:3000` in the browser, add a new network to MetaMask by clicking the networking at the top and Custom RPC with these settings:

- Network Name: Optimism Localhost
- Chain ID: 31337
- RPC URL: http://localhost:9545

Refresh and make sure MetaMask says the account is "Connected" with a green dot.

6. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

7. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

The test accounts are different from Hardhat Network's test accounts. You can use these to import into MetaMask to test with:

```
Account #0: 0x023ffdc1530468eb8c8eebc3e38380b5bc19cc5d (10000 ETH) - deployer/owner address
Private Key: 0x754fde3f5e60ef2c7649061e06957c29017fe21032a8017132c0078e37f6193a
Account #1: 0x0e0e05cf14349469ee3b45dc2fce50e11b9449b8 (10000 ETH)
Private Key: 0xd2ab07f7c10ac88d5f86f1b4c1035d5195e81f27dbe62ad65e59cbf88205629b
Account #2: 0x432c38a44381668eda4a3152209abbfae065b44d (10000 ETH)
Private Key: 0x23d9aeeaa08ab710a57972eb56fc711d9ab13afdecc92c89586e0150bfa380a6
Account #3: 0x5eeabfdd0f31cebf32f8abf22da451fe46eac131 (10000 ETH)
Private Key: 0x5b1c2653250e5c580dcb4e51c2944455e144c57ebd6a0645bd359d2e69ca0f0c
Account #4: 0x640e7cc27b750144ed08ba09515f3416a988b6a3 (10000 ETH)
Private Key: 0xea8b000efb33c49d819e8d6452f681eed55cdf7de47d655887fc0e318906f2e7
```

Currently, `evm_mine` and `evm_increaseTime` are not supported on the node.

You should now be connected to the contracts in a local Optimism development environment and be able to interact with contracts deployed on it through the React application.
