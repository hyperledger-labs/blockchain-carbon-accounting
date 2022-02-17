# Background

This document describes the tokens of the [Emissions Tokens Network](https://wiki.hyperledger.org/display/CASIG/Emissions+Tokens+Network+Project) and the
[DAO](https://wiki.hyperledger.org/display/CASIG/DAO+Project).  Both types of tokens are in the `contracts/` sub-directory.

The emissions tokens network in `contracts/NetEmissionsTokenNetwork.sol` is an ERC-1155 multi-token standard smart contract
compatible on any EVM-compatible blockchain and produces CLM8 tokens from issuers to consumers.  Each CLM8 token is a record of addition or reduction of 
greenhouse gas (GHG) emissions.  The unit of the CLM8 token is 1 kg, so 1000 CLM8 tokens is a metric ton of emissions.

The DAO in `contracts/Governance` is customized from the 
[Compound Defi Protocol](https://github.com/compound-finance/compound-protocol) DAO to create an ERC-20 dCLM8 token that is used for voting on proposals.

# Using the Contracts

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

After deploying to hardhat locally, and you will see the addresses of the deployed contracts as well as 20 accounts available for testing:

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

You can then run this command to set up roles for some of those accounts:

```
$ npx hardhat setTestAccountRoles --network localhost --contract <NetEmissionsTokeNetwork address>
```

To test the DAO, use this command to give the DAO tokens to your test accounts:

```
$ npx hardhat giveDaoTokens --network localhost --contract <DaoToken address>
```

To check the balances of the test accounts, use this command:

```
$ npx hardhat showDaoTokenBalances --network localhost --contract <DaoToken address>
```

## Toggling limited mode

The limited mode is useful in production environments.  Once it is enabled:

- Only the admin can register roles
- Only the DAO's Timelock contract can issue carbon offsets and REC tokens.  
- Offset and REC tokens can only be issued to the admin.  
- Emissions audits tokens can be issued as usual by emissions auditors.
- Only the admin can transfer tokens
- Once transferred from the admin to a recipient, they are immediately retired in the recipient's account.

To turn on limited mode on a given network, run the task:

```bash
npx hardhat setLimitedMode --network localhost --contract <NetEmissionsTokenNetwork deployed address> --value true
```

You can turn it off with:

```bash
npx hardhat setLimitedMode --network localhost --contract <NetEmissionsTokenNetwork deployed address> --value false
```

## Setting/getting quorum value

By default, the quorum (minimum number of votes in order for a proposal to succeed) is 632 votes or about sqrt(4% of total supply). The guardian can set this value by running the task:

```bash
npx hardhat setQuorum --network localhost --contract <Governor deployed address> --value <votes>
```

To get the current quorum, run the similar task:

```bash
npx hardhat getQuorum --network localhost --contract <Governor deployed address> 
```

## Setting/getting proposal threshold

In the original Compound DAO design, the proposal threshold is the minimum amount of DAO tokens required to make a proposal. In our system, this amount of dCLM8 is locked with a proposal by being sent to the Governor contract for safekeeping until the proposal has passed or failed. If the proposal did not pass quorum, the proposer can refund for 3/4 of their staked tokens. The guardian can also set adjust this value if needed:

```bash
npx hardhat setProposalThreshold --network localhost --contract <Governor deployed address> --value 1000000000000000000000
```

This value represents a dCLM8 amount with no sqrt calculation, so 18 zeros must be padded to the end of the number. By default, it is set to 100,000 or 1% of the dCLM8 supply.

Similarly, you can easily see the value by running the similar task:

```bash
npx hardhat getProposalThreshold --network localhost --contract <Governor deployed address>
```

## Increasing the supply of DAO Tokens

The DAO token has an initial supply of 10 million.  It can be increased with

```bash
npx hardhat addToSupply --network localhost --contract <DAO Token deployed address> --amount 10000000000000000000000000
```

Note there must be 18 zeroes after the amount, so this is 10 million more tokens above.  The new DAO tokens will go to the same initial holder who can 
then transfer them to other holders.

To check the total supply, use

```bash
npx hardhat getTotalSupply --network localhost --contract <DAO Token deployed address>
```


## Upgrading CLM8 contract implementation

A Hardhat task `upgradeClm8Contract` is provided to upgrade the contract with new features while keeping the same address, as NetEmissionsTokenNetwork utilizes [OpenZeppelin upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/api-hardhat-upgrades) to create separate contracts for the implementation and the contract you call (like an API and its implementation.)  When the upgrade script is run, a new implementation contract is deployed that the current address will use. A test implementation of a new version of the contract is located in `contracts/NetEmissionsTokenNetworkV2.sol`. Upgrading is also tested in the unit tests.

To test upgrading contracts locally:

1. Deploy the first set of contracts (including `NetEmissionsTokenNetwork.sol`) with `npx hardhat node`.

2. Create some tokens on the contract by connecting through the React interface.

3. Run the command (after ensuring the `deployments/localhost` directory has your current implementation) to upgrade to `NetEmissionsTokenNetworkV2.sol`:

```bash
npx hardhat upgradeClm8Contract --network localhost
```

If successful, the script will return both the old implementation contract address and the new one, and the contract address to be called, which remains the same.  The state of the current variables will remain the same. The old implementation will automatically be made unusable, so there is no need to self-destruct it.

Upgrading contracts on a testnet is similar -- just make sure that the network and Ethereum config is in `hardhat.config.js` and that it isn't commented out. If upgrading on an network via an Infura URL (like Goerli), you'll need an Infura key too. See more information on using the config files at the top of this document.

## Upgrading Governor.sol and Timelock.sol without upgrading DAOToken.sol

In the case that new changes are made to the DAO (Governor.sol and/or its Timelock.sol) and we want to deploy a new version of it to a production environment but we also want to keep the same DAOToken.sol contract, we can utilize the hardhat-deploy plugin's tags/dependencies features to easily deploy some contracts individually while reusing others. To upgrade just the DAO:

1. Make sure the current addresses of the contracts you don't need to upgrade are correctly set in the .json files in `deployments/<network>/` after running `npx hardhat deploy --network <network>`

2. Rename or delete the current references in `deployments/<network>/` to the Governor and Timelock, which are `Governor.json` and `Timelock.json`

3. From `net-emissions-token-network/`, run `npx hardhat deploy --network <network>` again

Now instead of running the full deployment for every contract, the deployment script will reuse the current DAOToken and NetEmissionsTokenNetwork addresses on the network you're using and point it to the new DAO contracts.

## Analyzing with Slither

[Slither](https://github.com/crytic/slither) is a powerful Solidity static analysis framework written in Python.  To install and run the Slither static analysis on the Solidity contracts, first ensure Python 3.6+ and Pip 3 are installed.  Then from `net-emissions-token-network/` sub-directory, run the script with:

```bash
sh runSlither.sh
```

The results of the analysis will be outputted as JSON files to `SlitherResults/`. Those files can be viewed with [Slither printer](https://github.com/crytic/slither/wiki/Printer-documentation).
