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
