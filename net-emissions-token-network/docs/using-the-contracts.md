# Using the Contracts

NetEmissionsTokenNetwork.sol (the CLM8 contract) is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain and produces CLM8 tokens from issuers to consumers. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts. The DAO contracts (located in the `contracts/governance/` folder) are forked from Compound and interact with the CLM8 contract to issue tokens using dCLM8 ERC-20 tokens as a voting mechanism to determine influence.

This document describes compiling and deploying the contract with Hardhat.

## Installation and use

Clone this repository, navigate to the net-emissions-token-network directory, and run `npm install`

## Misc. contract commands

- To test, run `npx hardhat test` (and `npx hardhat test [filename] to run a specific test`)
- To compile, run `npx hardhat compile`
- To see all commands, run `npx hardhat`

## Deploying Net Emissions Token Network contract to Goerli

If you'd like to deploy the contract to the Goerli testnet for yourself, go to [Infura.io](https://infura.io/) to set up an account to connect to the network via the scripts, and start a project under the "Ethereum" tab. You will need the project ID.

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

You will get a result that says:

```bash
Net Emissions Token Network deployed to: 0x_________________________________
```

This is the deployed address for your contract. To update references on the React interface and Fabric API:

5. Update the deployed address for the interface in `net-emissions-token-network/interface/packages/contracts/src/addresses.js`. Also change the `network` attribute to "Goerli" so that it shows up in the navigation bar of the React interface.

6. Update the deployed address for the Fabric API in `../utility-emissions-channel/typescript_app/src/blockchain-gateway/net-emissions-token-network/networkConfig.ts`.

### Deploying Net Emissions Token Network contract to Kovan or xDai

Steps for deploying the contract to the Kovan testnet and xDai sidechain are similar as deploying to Goerli:

1. Populate `.ethereum-config.js` with private keys.

2. Edit `hardhat.config.js` and uncomment the network configuration you would like to deploy to under module.exports.networks.

3. Deploy with

```bash
npx hardhat run --network kovan scripts/deploy-net-emissions-token-network.js
```

or 

```bash
npx hardhat run --network xdai scripts/deploy-net-emissions-token-network.js
```

### Compiling with Optimism Virtual Machine

By default, Hardhat compiles to the EVM using the given Solidity version in `hardhat.config.js`. To instead compile to the [OVM](https://optimism.io/): 

1. Set the `OVM` environment variable:

```bash
export OVM=1
```

2. If build artifacts exist, run `npx hardhat clean`

2. Compile with `npx hardhat compile`
