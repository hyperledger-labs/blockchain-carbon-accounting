// SPDX-License-Identifier: Apache-2.0
module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  console.log(`Deploying with account: ${deployer}`);

  await deploy('NetEmissionsTokenNetwork', {
    from: deployer,
    gasLimit: 4500000,
    args: [
      deployer
    ],
  });
  console.log("Make sure to set the Timelock address with setTimelock() so that the DAO has permission to issue tokens with issueFromDAO().");
};
