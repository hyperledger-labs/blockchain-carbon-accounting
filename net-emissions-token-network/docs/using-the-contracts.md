# Using the Contracts

NetEmissionsTokenNetwork.sol (the CLM8 contract) is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain and produces CLM8 tokens from issuers to consumers. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts. The DAO contracts (located in the `contracts/governance/` folder) are forked from Compound and interact with the CLM8 contract to issue tokens using dCLM8 ERC-20 tokens as a voting mechanism to determine influence.

This document describes compiling and deploying the contract with Hardhat.

## Installation and use

After cloning this repository, navigate to the `net-emissions-token-network` directory, and run `npm install`

## Testing with Hardhat

[Hardhat](https://hardhat.org/) is an Ethereum development and testing environment which is great for deploying and testing the contracts locally.  Again from the `net-emissions-token-network` directory:

- To see all commands, run `npx hardhat`
- To compile, run `npx hardhat compile`
- To test, run `npx hardhat test` (and `npx hardhat test [filename] to run a specific test`)
- To run a local test network without deploying the contracts, run `npx hardhat node --no-deploy --show-accounts`
- To run a local test network that automatically deploys all of the contracts locally, run `npx hardhat node --show-accounts`
- To deploy to a given network (e.g. goerli), run `npx hardhat deploy --network goerli`

After deploying to hardhat locally, you will see the addresse of the deployed contracts:

```
$ npx hardhat node --show-accounts
Nothing to compile
Deploying DAO with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Timelock deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAO Token deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Governor deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Initialized Governor address on DAOToken.
Queued setPendingAdmin() on Timelock.
Executed setPendingAdmin() on Timelock.
Called __acceptAdmin() on Governor.
Delegated voting power of deployer to self.
Done performing Timelock admin switch.
Deploying NetEmissionsTokenNetwork with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NetEmissionsTokenNetwork deployed to: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
Timelock address set so that the DAO has permission to issue tokens with issueFromDAO().
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

## Deploying contracts to a public testnet

If you'd like to deploy the contract (e.g. the Goerli testnet) for yourself, you will need a network URL and account to deploy with.

To connect to a common Ethereum testnet like Goerli, set up a developer account on [Infura.io](https://infura.io/) and create a free project under the Ethereum tab. You will need the project ID.

Next, create an account on MetaMask and connect to Goerli under the networks tab. This account will be used to deploy the contract -- so it needs to be loaded with free testnet ETH from a [Goerli faucet](https://faucet.goerli.mudit.blog) by copy and pasting your public key and waiting for the ETH to arrive to your wallet. 

Now follow these steps to deploy the contract to the Goerli testnet and update references to the address:

1. Create `.ethereum-config.js` by copying the template with 

```bash
cp .ethereum-config.js.template .ethereum-config.js
```

2.  Edit `.ethereum-config.js` and set the private key for your Ethereum deployment address and Infura key.

3. Edit the file `hardhat.config.js` and uncomment these lines (or uncomment the network you want to deploy to):

```bash
     // const ethereumConfig = require("./.ethereum-config");
     ...
     // goerli: {
     //   url: `https://goerli.infura.io/v3/${goerliConfig.INFURA_PROJECT_ID}`,
     //   accounts: [`0x${goerliConfig.GOERLI_CONTRACT_OWNER_PRIVATE_KEY}`]
     // },
```

4. Deploy by via the deploy script (or replacing goerli with the network you want to deploy to):

```bash
npx hardhat deploy --network goerli
```

The addresses of the contracts (prefixed with 0x) will be returned once the contracts are finished deploying.

## Deploying to xDai

xDai is an EVM-compatible sidechain with low gas fees where the native token (used to pay gas for transactions) is pegged to the dollar. To deploy or interact with contracts on xDai, your wallet needs to hold some xDai; fortunately you can use a free [faucet](https://blockscout.com/xdai/mainnet/faucet) to get a cent of xDai by entering your wallet address and solving a CAPTCHA.

Connect to xDai via MetaMask by [importing the network through their instructions](https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup) to see your balances.

Be sure your `.ethereum-config.js` has the private key of your deployer address, uncomment out the "xdai" network in `hardhat.config.js` (similar to the steps above) and deploy with:

```bash
npx hardhat deploy --network xdai
```

If any part of the deployment fails, you can run the command again and the deployment script will reuse the addresses previously automatically written to the `deployments` folder.

## Using Optimism

### Compiling to Optimism Virtual Machine (OVM)

By default, Hardhat compiles to the EVM using the given Solidity version in `hardhat.config.js`. To instead compile to the [OVM](https://optimism.io/): 

1. Set the `OVM` environment variable:

```bash
export OVM=1
```

2. If build artifacts exist, run `npx hardhat clean`

2. Compile with `npx hardhat compile`

### Testing and Deploying on OVM

Some incompatibilities exist between Hardhat and Optimism, so the current recommended way to test is to use [Optimism Integration](https://github.com/ethereum-optimism/optimism-integration) to run a local Optimistic Ethereum environment.  Follow the directions under "Usage" in their [README](https://github.com/ethereum-optimism/optimism-integration#usage) and use `make up` to start their docker image.  (You can skip the tests step.) 

To deploy contracts to a local Optimism development node after following starting your local Optimism Ethereum environment, run:

```bash
$ npx hardhat deploy --network ovm_localhost
```

Use the test addresses for testing on the interface and elsewhere:
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

Don't forget to set the addresses in `net-emissions-token-network/interface/packages/contracts/src/addresses.js` to connect to them via the React interface and add the network to MetaMask. The default contract addresses on the local node after running the script `deploy-all.js` are all commented out in that file to switch from Hardhat Network -- see `using-the-react-application.md` for more information on using the React application.

## Destroying the contract

A `selfDestruct` function is provided only by use for the admin to delete the contract on a given network. This action cannot be undone. To destroy a CLM8 contract on Hardhat Network, run:

```bash
npx hardhat destroyClm8Contract --network localhost --contract 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
```

Destroying contracts on other testnets and networks works similarily -- just make sure your `hardhat.config.js` has your wallet and network settings.

## Toggling limited mode

The limited mode is useful in production environments.  Once it is enabled:

- Only the admin can register roles
- Only the DAO's Timelock contract can issue tokens
- Tokens can only be issued to the admin
- Only the admin can transfer tokens

To turn on limited mode on a given network, run the task:

```bash
npx hardhat setLimitedMode --network localhost --contract <NetEmissionsTokenNetwork deployed address> --value true
```

## Analyzing with Slither

[Slither](https://github.com/crytic/slither) is a powerful Solidity static analysis framework written in Python.  To install and run the Slither static analysis on the Solidity contracts, first ensure Python 3.6+ and Pip 3 are installed.  Then from `net-emissions-token-network/` sub-directory, run the script with:

```bash
sh runSlither.sh
```

The results of the analysis will be outputted as JSON files to `SlitherResults/`. Those files can be viewed with [Slither printer](https://github.com/crytic/slither/wiki/Printer-documentation).
