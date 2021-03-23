// SPDX-License-Identifier: Apache-2.0
const hre = require("hardhat");

async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
  const netEmissionsTokenNetwork = await NetEmissionsTokenNetwork.deploy(deployer.address);
  await netEmissionsTokenNetwork.deployed();

  console.log("NetEmissionsTokenNetwork deployed to:", netEmissionsTokenNetwork.address);

  console.log("Make sure to set the Timelock address with setTimelock() so that the DAO has permission to issue tokens with issueFromDAO().");
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
