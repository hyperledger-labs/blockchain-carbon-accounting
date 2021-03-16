# Using the React Application

We use a React application for interacting with the NetEmissionsTokenNetwork.sol and DAO contracts. The interface was created using [create-eth-app](https://github.com/PaulRBerg/create-eth-app). The MetaMask browser extension is required for testing.

The application connects to the contract of the address specified in `net-emissions-token-network/interface/packages/contracts/src/addresses.js`, which is by default set to the default address of deployment on the Hardhat Network. To instead connect to an Ethereum testnet (like Goerli), read *Starting the React application and connecting to Goerli testnet*, otherwise, read the instructions below.

## Starting the React application and connecting to local Hardhat Network

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

`deploy-all.js` is used for deploying the governance contracts in addition to the NetEmissionsTokenNetwork contract.

4. Import the private keys of the accounts from Hardhat in the terminal window after clicking the account icon then Import Account.

5. Within the settings for localhost in MetaMask, be sure that the Chain ID is set to 1337.

6. In the MetaMask extension after navigating to the interface in the browser, change the network from Ethereum Mainnet to _Localhost 8545_. Make sure Metamask says the account is "Connected" with a green dot.

7. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

8. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to your local testnet and be able to interact with contracts deployed on it through the React application.

_IMPORTANT NOTE: When restarting the Hardhat Network after interacting with the contracts through MetaMask, it is necessary to reset the account's transactions otherwise an "invalid nonce" error might occur due to the way Ethereum prevents double-counting transactions. To reset transaction history in MetaMask, click the account icon in the top right, go to Settings, Advanced, and Reset Account._

## Starting the React application and connecting to Goerli testnet

Goerli is a public Ethereum testnet. When interacting with the contracts on Goerli, access to the owner private key is needed to register dealers via the interface, and new wallets can be created via MetaMask (be sure to fund newly created wallets with Goerli ETH via a faucet or transferring funds for gas fees). Transactions can be viewed by anyone on [Etherscan](https://goerli.etherscan.io/) (to see the history of transactions, one can enter the current contract address at `net-emissions-token-network/interface/packages/contracts/src/addresses.js`). After deploying the contracts to Goerli (as also outlined in the docs), connect the interface with the following steps:

1. In `net-emissions-token-network/interface/packages/contracts/src/addresses.js`, replace the contract addresses deployed to the Hardhat Network with the addresses of the Goerli contracts you'd like to connect to.

2. From the `net-emissions-token-network/interface` directory, install the necessary packages and start the React app with

```bash
yarn install
yarn react-app:start
```

3. After navigating to `localhost:3000` in the browser, change the network from Ethereum Mainnet to _Goerli Test Network_. Make sure MetaMask says the account is "Connected" with a green dot.

4. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

5. To test with different accounts, click on the account icon in MetaMask and then click on another account and refresh your browser. The navigation bar should display the new account and its role.

You should now be connected to the contracts in Goerli and be able to interact with contracts deployed on it through the React application.


