# Deployment with Hardhat and hardhat-deploy

This project utilizes [hardhat-deploy](https://hardhat.org/plugins/hardhat-deploy.html) for replicable deployments. It provides a few useful features, including:

- Automatic setup after deploying the contracts (including initializing the admin of the Timelock contract and granting cross-contract permissions)
- When `npx hardhat node` is run to start the Hardhat Network for testing contracts locally, the deployment process is automatically called
- The tests (run with `npx hardhat test`) run hardhat-deploy locally before they are called so that the deployment process doesn't have to replicated
- Deployment information is saved in the `deployments` folder
- Contracts can be deployed individually using the `--tags` argument

## How the deployment works

The contracts are deployed in this order:

1. DAOToken.sol
2. Timelock.sol
3. Governor.sol
4. NetEmissionsTokenNetwork.sol

