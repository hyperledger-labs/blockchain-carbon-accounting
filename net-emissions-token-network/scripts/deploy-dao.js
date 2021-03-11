// SPDX-License-Identifier: Apache-2.0
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

// helper functions
hoursToSeconds = function (hours) {
  return (hours * 60 * 60);
}
encodeParameters = function (types, values) {
  let abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

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

  // format transactions for Timelock to change admin to Governor
  let currentTime = Math.floor(Date.now() / 1000);
  let timelockNewAdmin = {
    //address target, uint value, string memory signature, bytes memory data, uint eta
    target: timelock.address,
    value: 0,
    signature: "setPendingAdmin(address)",
    data: encodeParameters(
      ['address'],[governor.address]
    ),
    eta: (currentTime + hoursToSeconds(50))
  }
  const queueTimelockAdminToGovernor = await timelock.connect(deployer).queueTransaction(
    timelockNewAdmin.target,
    timelockNewAdmin.value,
    timelockNewAdmin.signature,
    timelockNewAdmin.data,
    timelockNewAdmin.eta
  );
  console.log("Queued setPendingAdmin() on Timelock.");

  console.log("---");
  console.log("Please copy these values and call executeTransaction() on Timelock");
  console.log("when the ETA is reached from the deployer address with these args:");
  console.log("");
  console.log(`target : ${timelockNewAdmin.target}`);
  console.log(`value : ${timelockNewAdmin.value}`);
  console.log(`signature : ${timelockNewAdmin.signature}`);
  console.log(`data : ${timelockNewAdmin.data}`);
  console.log(`eta : ${timelockNewAdmin.eta}`);
  console.log("");
  console.log("Afterwards, do not forget to call __acceptAdmin() on Governor to");
  console.log("complete the admin switch.");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
