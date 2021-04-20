# Deployment with Hardhat and hardhat-deploy

This project utilizes [hardhat-deploy](https://hardhat.org/plugins/hardhat-deploy.html) for replicable deployments. It provides a few useful features, including:

- Automatic setup after deploying the contracts (including initializing the admin of the Timelock contract and granting cross-contract permissions)
- When `npx hardhat node` is run to start the Hardhat Network for testing contracts locally, the deployment process is automatically called
- The tests (run with `npx hardhat test`) run hardhat-deploy locally before they are called so that the deployment process doesn't have to replicated
- Deployment information is saved in the `deployments` folder
- Contracts can be deployed individually using the `--tags` argument

## Under the hood

The deploy scripts are located in the `deploy/` folder.

The contracts are deployed in this order:

1. DAOToken.sol
2. Timelock.sol
3. Governor.sol
4. NetEmissionsTokenNetwork.sol

During deployment, some contract functions are called to complete the initialization, like setting the admin of the Timelock and defining cross-contract references.

### Cross-contract dependencies

The deployment script runs in this particular order because some variables need to be set up on the latter contracts that point to the former contracts for correct permissioning (i.e. ensuring that only the Governor has permission to collect and burn DAO tokens). In `deploy/dao.js` (the script used to deploy Timelock and Governor), we can see at the bottom of the file:

```js
module.exports.tags = ['DAO'];
module.exports.dependencies = ['DAOToken'];
```

The tag 'DAO' is set so that the Timelock and Governor can be deployed individually with `npx hardhat deploy --tags DAO`. There is also a dependency for the DAOToken, because the Governor takes an argument for the address of the DAOToken. Fortunately, the deploy script takes care of this automatically, but it gives us flexibility to deploy contracts individually.

### hardhat-deploy

At the top of each deployment script, a few functions from hardhat-deploy are imported:

```js
const {deploy, execute, get} = deployments;
const {deployer} = await getNamedAccounts();
```

`deploy` allows us to deploy a given contract to the given network, for example:

```js
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

```js
await execute(
  'Timelock',
  { from: deployer },
  'queueTransaction',
  timelockNewAdmin.target,
  timelockNewAdmin.value,
  timelockNewAdmin.signature,
  timelockNewAdmin.data,
  timelockNewAdmin.eta
);
console.log("Queued setPendingAdmin() on Timelock.");
```

`get` allows us to get a previously deployed contract of the given network defined in the `deployments/` folder, for example:

```js
daoToken = await get("DAOToken"); // required to deploy Timelock and Governor
```

Finally, `deployer` represents the deployer account defined in `hardhat.config.js` and `.ethereum-config.js`. See `using-the-contracts.md` for more information on setting the deployer account.
