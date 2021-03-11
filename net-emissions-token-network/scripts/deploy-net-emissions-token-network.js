// SPDX-License-Identifier: Apache-2.0
const hre = require("hardhat");

async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
  const netEmissionsTokenNetwork = await hre.upgrades.deployProxy(NetEmissionsTokenNetwork, [deployer.address]);

  // Initialize contract admin
  await netEmissionsTokenNetwork.deployed();
  await netEmissionsTokenNetwork.connect(deployer).initialize(deployer.address);

  console.log("NetEmissionsTokenNetwork proxy deployed to:", netEmissionsTokenNetwork.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
