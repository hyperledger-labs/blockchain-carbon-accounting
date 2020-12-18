# Net Emissions Tokens Network

The net emissions tokens network represents the net emissions of an entity, which could be an organization, a building, or even a person. It is the sum of all the emissions from different channels such as the [utility emissions channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel), plus offsetting Renewable Energy Certificates and carbon offsets. Each token represents either an emissions debt, which you incur through activities that emit greenhouse gases, or an emissions credit, which offset the debt by removing emissions from the atmosphere.

Read more on the [Hyperledger Climate Action SIG website](https://wiki.hyperledger.org/display/CASIG/Net+Emissions+Tokens+Network).

## Contracts

The net emissions token network is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts.

### Installation and use

- Clone this repository, navigate to the net-emissions-token-network directory, and run `npm install`
- To test, run `npx hardhat test`
- To compile, run `npx hardhat compile`
- To see all commands, run `npx hardhat`

You can also run the tests with no external dependencies other than docker with the script located in this directory:

```bash
sh runDockerTests.sh
```

## Interface

The interface is created using [create-eth-app](https://github.com/PaulRBerg/create-eth-app).

### Installation and use

- To install, clone this repository, navigate to the net-emissions-token-network/interface directory, and run `yarn install`
- To run on your local environment, run `yarn react-app:start`
- To build, run `yarn react-app:build`

### Connecting to local testnet with React application

Hardhat implements its own Ethereum local testnet called Hardhat Network. In order to connect the interface to this local testnet:

1. Install the [MetaMask extension](https://metamask.io/)
2. After installing `node_modules` with `yarn install`, run the interface in `net-emissions-token-network/interface` with

```bash
yarn react-app:start
```

3. In a separate terminal, start a local Hardhat Network in `net-emissions-token-network/` with:

```bash
npx hardhat node
```

4. In a separate terminal, deploy the contracts in `net-emissions-token-network/` to the local Hardhat Network with:

```bash
npx hardhat run --network localhost scripts/deploy.js
```

5. In the MetaMask extension, change the network from Ethereum Mainnet to _Localhost 8545_.
6. Within the settings for localhost in metamask, be sure that the Chain Id is set to 1337.
7. Back in the browser, navigate to `localhost:3000`.
8. Press _Connect Wallet_ in the interface to connect to your MetaMask wallet.

You should now be connected to your local testnet and be able to interact with contracts deployed on it through the React application.

_Note: When restarting the Hardhat Network after interacting with the contracts through MetaMask, it might be necessary to reset the account's transactions otherwise an error might occur due to the way Ethereum prevents double-counting transactions. To reset transaction history in MetaMask, click the account icon in the top right, go to Settings, Advanced, and Reset Account._

### Token User Flow

In the net-emissions-token-network contract, we currently support this functionality:

- Issuing tokens and verifying that its type is valid
- Registering/unregistering dealers
- Registering/unregistering consumers
- Transferring tokens
- Retiring tokens

#### An example of a user consuming these services would look similar to the following:

Using the contract owner, register a new dealer. The registerDealer function expects the following arguments:

```bash
function registerDealer( address account )
```

A dealer can consume all services within the contract. In order to allow a dealer's customers or consumers to be issued a token, they must be first registered. The registerConsumer function expects the following:

```bash
function registerConsumer( address account )
```

After registering a consumer, the dealer will be able to issue this consumer a token with the issue function:

```bash
function issue( address account, uint8 tokenTypeId, uint256 quantity, string memory uom, string memory fromDate, string memory thruDate, string memory automaticRetireDate, string memory metadata, string memory manifest, string memory description )
```

Tokens for carbon offsets and renewable energy certificates can be retired:

```bash
function retire(address account, uint256 tokenId, uint256 amount)
```

Audited emissions are considered retired as soon as they're issued.

The non-retired balance can be transferred:

```bash
function transfer(address to, uint256 tokenId, uint256 value)
```

You can get the balance for your tokens with:

```bash
function getBothBalanceByTokenId(uint8 tokenTypeId)
```

which returns a key-value pair like this:

    { "0": "uint256: 0", "1": "uint256: 100" }

The `0` index is the available balance, and the `1` index is the retired balance. You can also separately get available and retired balances with `getAvailableBalanceByTokenTypeId` and `getRetiredBalanceByTokenTypeId`.

Dealers and consumers may also be unregistered within the network. Only the contract owner can unregister a dealer:

```bash
function unregisterDealer( address account )
```

A dealer may unregister its consumers with the unregisterConsumer function:

```bash
function unregisterConsumer( address account )
```

#### Testing the contract in remix

For interacting with the contract in development, the current solution is to use the Remix IDE.

First, the remixd plugin must be installed globally via NPM to create a volume from your local machine to Remix in browser.

```bash
npm install -g remixd
```

Install the dependencies for the contract in the net-emissions-token-network directory:

```bash
npm install
```

To start the volume, run the following from the root directory of this repo:

```bash
remixd -s ./net-emissions-token-network --remix-ide https://remix.ethereum.org
```

After installing, navigate to https://remix.ethereum.org/ in the browser of your choice. (Currently only tested in Chrome)

Find the "plugins" tab on the left of the IDE user interface. Select remixd and connect. You will now see the entire net-emissions-token-network folder in the file explorer within remixd.

Under localhost -> contracts, select NetEmissionsTokenNetwork.sol in the file explorer.

Go to the compiler tab, change the compiler version to 0.6.2, check the box for "optimize", and compile the contract.

Next, select the "Deploy and run transactions tab", change the gas limit to "9999999", select "NetEmissionsTokenNetwork" from the drop down, and deploy the contract.

You can now interact with the contract's functions via the user interface in Remix.
