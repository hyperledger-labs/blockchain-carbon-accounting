// SPDX-License-Identifier: Apache-2.0
module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const {execute, deploy} = deployments;
  const { ethers, upgrades } = require("hardhat");
  const {deployer} = await getNamedAccounts();

  const netEmissionsTokenNetwork = await deployments.get('NetEmissionsTokenNetwork');

  console.log(`Deploying CarbonTracker with account: ${deployer}`);

  let carbonTracker = await deploy('CarbonTracker', {
    from: deployer,
    args: [ netEmissionsTokenNetwork.address, deployer, ],
    /*proxy: {
      owner: deployer,
      proxyContract: "OptimizedTransparentProxy",
      execute: {
        methodName: 'initialize',
        
      }
    },*/
  });


  console.log("CarbonTracker deployed to:", carbonTracker.address);

  await execute(
    'NetEmissionsTokenNetwork',
    { from: deployer },
    'registerIndustry',
    carbonTracker.address
  );

  console.log("Register carbon tracker as Industry");

};