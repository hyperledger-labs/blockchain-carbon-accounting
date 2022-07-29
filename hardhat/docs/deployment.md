# Deployment with Hardhat and hardhat-deploy

This project utilizes [hardhat-deploy](https://hardhat.org/plugins/hardhat-deploy.html) for replicable deployments. It provides a few useful features, including:

- Automatic setup after deploying the contracts (including initializing the admin of the Timelock contract and granting cross-contract permissions)
- When `npx hardhat node` is run to start the Hardhat Network for testing contracts locally, the deployment process is automatically called
- The tests (run with `npx hardhat test`) run hardhat-deploy locally before they are called so that the deployment process doesn't have to replicated
- Deployment information is saved in the `deployments/` folder
- Contracts can be deployed individually using the `--tags` argument

## Under the hood

The deploy scripts are located in the `deploy/` folder.  All the contracts referenced in these files will be deployed.  If you do not want to deploy some of the contracts, move them out of the directory before running `npx hardhat deploy`

The contracts are deployed in this order:

1. DAOToken.sol
2. Timelock.sol
3. Governor.sol
4. NetEmissionsTokenNetwork.sol

During deployment, some contract functions are called to complete the initialization, like setting the admin of the Timelock and defining cross-contract references.

### Cross-contract dependencies

The deployment script runs in this particular order because some variables need to be set up on the latter contracts that point to the former contracts for correct permissioning (i.e. ensuring that only the Governor has permission to collect and burn DAO tokens). In `deploy/dao.js` (the script used to deploy Timelock and Governor), we can see at the bottom of the file:

```javascript
module.exports.tags = ['DAO'];
module.exports.dependencies = ['DAOToken'];
```

The tag 'DAO' is set so that the Timelock and Governor can be deployed individually with `npx hardhat deploy --tags DAO`. (The other tags are 'CLM8' for NetEmissionsTokenNetwork.sol and 'DAOToken' for DAOToken.sol.) We also see a dependency for the contract DAOToken, because the Governor takes an argument for the address of the DAOToken so it must be deployed first. If a tag is deployed individually and the dependency is not yet deployed or not located in the `deployments/` folder, the script will automatically deploy the dependency, otherwise it will reuse the already deployed contract defined in the `deployments/` folder. This use of dependencies and tags makes it easier to deploy contracts individually if ever necessary.

### hardhat-deploy

At the top of each deployment script, a few functions from hardhat-deploy are imported:

```javascript
const {deploy, execute, get} = deployments;
const {deployer} = await getNamedAccounts();
```

`deploy` allows us to deploy a given contract to the given network, for example:

```javascript
let timelock = await deploy('Timelock', {
  from: deployer,
  args: [
    deployer, // initial admin
    172800    // default time delay (2 days)
  ],
});
console.log("Timelock deployed to:", timelock.address);
```

`execute` allows us to execute functions on a contract, for example:

```javascript
await execute(
  'Timelock',                 // contract to call
  { from: deployer },         // options (e.g. from address)
  'queueTransaction',         // function on contract to call
  timelockNewAdmin.target,    // contract argument 1
  timelockNewAdmin.value,     // contract argument 2
  timelockNewAdmin.signature, // contract argument 3
  timelockNewAdmin.data,      // contract argument 4
  timelockNewAdmin.eta        // contract argument 5
);
console.log("Queued setPendingAdmin() on Timelock.");
```

`get` allows us to get a previously deployed contract of the given network defined in the `deployments/` folder, for example:

```javascript
daoToken = await get("DAOToken"); // required to deploy Timelock and Governor
```

Finally, `deployer` represents the deployer account defined in `hardhat.config.js` and `.ethereum-config.js`. See `using-the-contracts.md` for more information on setting the deployer account.

## Deploying contracts to a public testnet

If you'd like to deploy the contract (e.g. the Goerli testnet) for yourself, you will need a network URL and account to deploy with.

To connect to a common Ethereum testnet like Goerli, set up a developer account on [Infura.io](https://infura.io/) and create a free project under the Ethereum tab. You will need the project ID.

Next, create an account on MetaMask and connect to Goerli under the networks tab. This account will be used to deploy the contract -- so it needs to be loaded with free testnet ETH from a [Goerli faucet](https://faucet.goerli.mudit.blog) by copy and pasting your public key and waiting for the ETH to arrive to your wallet. 

Now follow these steps to deploy the contract to the Goerli testnet and update references to the address:

1. Create `.ethereum-config.js` by copying the template with 

```bash
cp .ethereum-config.js.template .ethereum-config.js
```

2.  Edit `.ethereum-config.ts` and set the private key for your Ethereum deployment address and Infura key.

3. Edit the file `hardhat.config.js` and uncomment these lines (or uncomment the network you want to deploy to):

```javascript
     const ethereumConfig = require("./.ethereum-config");
     ...
     goerli: {
       url: `https://goerli.infura.io/v3/${goerliConfig.INFURA_PROJECT_ID}`,
       accounts: [`0x${goerliConfig.GOERLI_CONTRACT_OWNER_PRIVATE_KEY}`]
     },
```

4. Deploy by via the deploy script (or replacing goerli with the network you want to deploy to):

```bash
npx hardhat deploy --network goerli
```

5. Make sure to copy and paste the timelock admin switch command to complete in two days (for example, here is an example from a particular deployment -- you will get your own):

```
Please copy and paste this command after Wed Apr 28 2021 11:27:38 GMT-0400 (Eastern Daylight Time) to complete the Timelock admin switch:

npx hardhat completeTimelockAdminSwitch --network goerli --timelock 0xE13Ec0c623e67486267B54dd28E172A94f72B527 --governor 0x7c385742B2332b65D536396bdcb10EE7Db821eA9 --target 0xE13Ec0c623e67486267B54dd28E172A94f72B527 --value 0 --signature "setPendingAdmin(address)" --data 0x0000000000000000000000007c385742b2332b65d536396bdcb10ee7db821ea9 --eta 1619623658
```

The addresses of the contracts (prefixed with 0x) will be returned once the contracts are finished deploying.  Copy this and run it again in two days.

This `completeTimelockAdminSwitch` task does two things: run `executeTransaction()` on the Timelock to call `setPendingAdmin()` to the Governor contract 
(since it is deployed after Timelock and must be set manually after deployment), and then call `acceptAdmin()` on Governor to complete the switch. 
Most of the parameters are for the first command:

```
timelock - address of Timelock
governor - address of Governor
target - target contract for executeTransaction() call, in this case the Timelock
value - amount of ETH to send with executeTransaction() call
signature - function to call on target contract for executeTransaction() call, in this case setPendingAdmin
data - encoded function arguments for executeTransaction() call, which is the encoded new admin address
eta - unix time when executeTransaction() can be called (must be 2 days in future)
```

Due to latency on the network, this task may return an error such as 

```
   ProviderError: execution reverted: Timelock::acceptAdmin: Call must come from pendingAdmin.
```

This means that `executeTransaction()` is still running when `acceptAdmin()` was called.  Try commenting out the block for`` executeTransaction()`` in `hardhat.config.js`
and submitting the request again.   

## Deploying to xDai

xDai is an EVM-compatible sidechain with low gas fees where the native token (used to pay gas for transactions) is pegged to the dollar. To deploy or interact with contracts on xDai, your wallet needs to hold some xDai; fortunately you can use a free [faucet](https://blockscout.com/xdai/mainnet/faucet) to get a cent of xDai by entering your wallet address and solving a CAPTCHA.

Connect to xDai via MetaMask by [importing the network through their instructions](https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup) to see your balances.

Be sure your `.ethereum-config.js` has the private key of your deployer address, uncomment out the "xdai" network in `hardhat.config.js` (similar to the steps above) and deploy with:

```bash
npx hardhat deploy --network xdai
```

Be sure to copy the command to complete the Timelock admin switch in two days from the time of deployment (example in the section above).

If any part of the deployment fails, you can run the command again and the deployment script will reuse the addresses previously automatically written to the `deployments` folder.

## Deploying to Binance Smart Chain testnet

BSC testnet is a test environment for Binance Chain network, run by the Binance Chain development community, which is open to developers.

Connect to BSC testnet via MetaMask by [Use MetaMask For Binance Smart Chain](https://docs.binance.org/smart-chain/wallet/metamask.html) to see your balances.

Be sure your `.ethereum-config.js` has the private key of your deployer address, uncomment out the "bsctestnet" network in `hardhat.config.js` (similar to the steps above) and deploy with:

```bash
npx hardhat deploy --reset --network bsctestnet
```

Be sure to copy the command to complete the Timelock admin switch in two days from the time of deployment (example in the section above).

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
npx hardhat deploy --network ovm_localhost
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

Don't forget to set the addresses in `app/frontend/contracts/src/addresses.js` to connect to them via the React interface and add the network to MetaMask. The default contract addresses on the local node after running the script `deploy-all.js` are all commented out in that file to switch from Hardhat Network -- see `using-the-react-application.md` for more information on using the React application.
