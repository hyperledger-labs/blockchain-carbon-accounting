# Using the Contracts

NetEmissionsTokenNetwork.sol (the CLM8 contract) is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain and produces CLM8 tokens from issuers to consumers. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts. The DAO contracts (located in the `contracts/governance/` folder) are forked from Compound and interact with the CLM8 contract to issue tokens using dCLM8 ERC-20 tokens as a voting mechanism to determine influence.

This document describes compiling and deploying the contract with Hardhat.

## Installation and use

Clone this repository, navigate to the net-emissions-token-network directory, and run `npm install`

## Misc. contract commands

- To test, run `npx hardhat test` (and `npx hardhat test [filename] to run a specific test`)
- To compile, run `npx hardhat compile`
- To deploy to a given network (e.g. localhost), run `npx hardhat deploy --network localhost`
- To run a test network, run `npx hardhat node --show-accounts`
- To see all commands, run `npx hardhat`

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
     //
```

4. Deploy by via the deploy script (or replacing goerli with the network you want to deploy to):

```bash
npx hardhat deploy --network goerli
```

The addresses of the contracts (prefixed with 0x) will be returned once the contracts are finished deploying.

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

Limited mode enables:

- Only the admin can register roles
- Only the DAO's Timelock contract can issue tokens
- Tokens can only be issued to the admin
- Only the admin can transfer tokens

To turn on limited mode on a given network, run the task:

```bash
npx hardhat setLimitedMode --network localhost --contract 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 --value true
```
