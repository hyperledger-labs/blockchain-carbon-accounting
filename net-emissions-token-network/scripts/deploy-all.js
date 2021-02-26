// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  // We get the contracts to deploy
  const NetEmissionsTokenNetwork = await hre.ethers.getContractFactory("NetEmissionsTokenNetwork");
  const netEmissionsTokenNetwork = await NetEmissionsTokenNetwork.deploy();
  await netEmissionsTokenNetwork.deployed();
  console.log("Net Emissions Token Network deployed to:", netEmissionsTokenNetwork.address);

  const Timelock = await hre.ethers.getContractFactory("Timelock");
  const timelock = await Timelock.deploy(deployer.address, 172800);
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);

  const DaoToken = await hre.ethers.getContractFactory("DAOToken");
  const daoToken = await DaoToken.deploy(deployer.address);
  await daoToken.deployed();
  console.log("DAO Token deployed to:", daoToken.address);

  const Governor = await hre.ethers.getContractFactory("Governor");
  const governor = await Governor.deploy(timelock.address, daoToken.address, deployer.address);
  await governor.deployed();
  console.log("Governor deployed to:", governor.address);

  // delegate voting power to self
  const delegateTokensToSelf = await daoToken.connect(deployer).delegate(deployer.address);
  console.log("Delegated DAO token voting power to self.")

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
