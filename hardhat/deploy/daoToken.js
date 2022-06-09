// SPDX-License-Identifier: Apache-2.0
const {
  hoursToSeconds,
  advanceHours,
  advanceBlocks,
  encodeParameters
} = require("../test/common");

module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  console.log(`Deploying DAOToken with account: ${deployer}`);

  let daoToken = await deploy('DAOToken', {
    from: deployer,
    args: [
      deployer // inital token holder
    ],
  });
  console.log("DAO Token deployed to:", daoToken.address);

  if (!hre.network.live) {
    // delegate owner voting power to self
    await execute(
      'DAOToken',
      { from: deployer },
      'delegate',
      deployer
    );
    console.log("Delegated voting power of deployer to self.")
  }

};

module.exports.tags = ['DAOToken'];
