# Net Emissions Tokens Network

The net emissions tokens network represents the net emissions of an entity, which could be an organization, a building, or even a person. It is the sum of all the emissions from different channels such as the [utility emissions channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel), plus offsetting Renewable Energy Certificates and carbon offsets. Each token represents either an emissions debt, which you incur through activities that emit greenhouse gases, or an emissions credit, which offset the debt by removing emissions from the atmosphere.

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
4. In another separate terminal, deploy the contracts to the local Hardhat Network with `npx hardhat run --network localhost scripts/sample-script.js`
5. Back in the interface, press _Connect Wallet_ to connect to your MetaMask wallet
6. In the MetaMask extension, change the network from Ethereum Mainnet to _Localhost 8545_

You should now be connected to your local testnet and be able to interact with contracts deployed on it.

### Token User Flow

In the net-emissions-token-network contract, we currently support this functionality:

- Defining a new token
- Minting this token and verifying that it's type is valid
- Registering/unregistering dealers
- Registering/unregistering consumers
- Transferring tokens
- Retiring tokens

#### An example of a user consuming these services would look similar to the following:

1. Registering a token definiton by calling defineToken. This function expects the following arguments:

```bash
function defineToken( uint256 tokenId, string memory tokenTypeId, string memory description)
```

The tokenTypeId argument must be one of the valid token types defined in the contract:

```bash
string[] _validTokenTypeIds = ["Renewable Energy Certificate", "Carbon Emissions Offset", "Audited Emissions"];
```

2. Issue the token. The issue function expects the following arguments:

```bash
function issue( uint256 tokenId, uint256 quantity, string memory issuerId, string memory recipientId, string memory uom, string memory fromDate, string memory thruDate, string memory metadata, string memory manifest, string memory automaticRetireDate )
```

3. Register two addresses as dealers. This is required in order for the parties to be able to transfer tokens. The registerDealer function expects the following arguments:

```bash
   function registerDealer( address account, uint256 tokenId )
```

4. After a the parties are registered, a transfer is allowed through the transfer function:

```bash
    function transfer(address to, uint256 tokenId, uint256 value)
```

5. Retiring a token. When a token is marked as "retired," it is counted towards the emissions reduction of the retiring organization and cannot be transferred again. The retire function requires the following arguments:

```bash
function retire( uint256 tokenId, uint256 amount)
```
