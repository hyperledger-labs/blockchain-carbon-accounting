# Net Emissions Tokens Network

The net emissions tokens network represents the net emissions of an entity, which could be an organization, a building, or even a person.  It is the sum of all the emissions from different channels such as the [utility emissions channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel), plus offsetting Renewable Energy Certificates and carbon offsets.  Each token represents either an emissions debt, which you incur through activities that emit greenhouse gases, or an emissions credit, which offset the debt by removing emissions from the atmosphere.

Read more on the [Hyperledger Climate Action SIG website](https://wiki.hyperledger.org/display/CASIG/Net+Emissions+Tokens+Network).

## Contracts

The net emissions token network is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts.

### Installation and use

- To install, clone this repository, navigate to the net-emissions-token-network directory, and run `npm install`
- To test, run `npx hardhat test`
- To compile, run `npx hardhat compile`
- To see all commands, run `npx hardhat`

## Interface

The interface is created using [create-eth-app](https://github.com/PaulRBerg/create-eth-app).

### Installation and use

- To install, clone this repository, navigate to the net-emissions-token-network/interface directory, and run `yarn install`
- To run on your local environment, run `yarn react-app:start`
- To build, run `yarn react-app:build`

### Connecting to local testnet

Hardhat implements its own Ethereum local testnet called Hardhat Network. In order to connect the interface to this local testnet:

1. Install the [MetaMask extension](https://metamask.io/)
2. Run the interface in `net-emissions-token-network/interface` with `yarn react-app:start`
3. In a separate terminal, run the Hardhat Network in `net-emissions-token-network` with `npx hardhat node`
3. Press *Connect* in the interface to connect to your MetaMask wallet
4. In the MetaMask extension, change the network from Ethereum Mainnet to *Localhost 8545*

You should now be connected to your local testnet and be able to interact with contracts deployed on it.
