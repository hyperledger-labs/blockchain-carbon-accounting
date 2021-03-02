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
advanceBlocks = async function (blocks) {
  for (let i = 0; i <= blocks; i++) {
    await ethers.provider.send("evm_mine");
  }
}
advanceHours = async function (hours) {
  let seconds = hoursToSeconds(hours);
  await ethers.provider.send("evm_increaseTime", [seconds]);
  ethers.provider.send("evm_mine"); // mine a block after
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
  console.log("Delegated DAO token voting power to self.");

  // grant dealer role to Timelock contract
  const grantDealerRoleToTimelock1 = await netEmissionsTokenNetwork
  .connect(deployer)
  .registerDealer(timelock.address, 1);
  const grantDealerRoleToTimelock2 = await netEmissionsTokenNetwork
  .connect(deployer)
  .registerDealer(timelock.address, 2);
  const grantDealerRoleToTimelock3 = await netEmissionsTokenNetwork
  .connect(deployer)
  .registerDealer(timelock.address, 3);
  console.log("Granted all dealer roles to DAO.");

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

  await advanceHours(51);

  // execute setPendingAdmin on Timelock
  const executeTimelockAdminToGovernor = await timelock.connect(deployer).executeTransaction(
    timelockNewAdmin.target,
    timelockNewAdmin.value,
    timelockNewAdmin.signature,
    timelockNewAdmin.data,
    timelockNewAdmin.eta
  );
  console.log("Executed setPendingAdmin() on Timelock.");
  await advanceBlocks(1);

  // accept admin role from Governor contract
  const acceptAdmin = await governor.connect(deployer).__acceptAdmin();
  await advanceBlocks(1);

  let timelockAdmin = await timelock.admin();
  console.assert(timelockAdmin === governor.address);
  console.log("Executed __acceptAdmin() on Governor using deployer account. Timelock admin switched to Governor.")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
