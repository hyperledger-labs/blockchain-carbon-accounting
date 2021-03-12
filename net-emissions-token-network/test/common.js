// SPDX-License-Identifier: Apache-2.0
const { upgrades } = require("hardhat");

exports.allTokenTypeId = [1, 2, 3];
exports.quantity = 10;
exports.transferAmount = 5;
exports.retireAmount = 3;
exports.issuerId = "issuer";
exports.recipientId = "recipient";
exports.fromDate = "1607463809";
exports.thruDate = "1607463909";
exports.metadata = "metaData";
exports.manifest = "manifest";
exports.description = "description";
exports.automaticRetireDate = "1607464809";

exports.deployContract = async function (contractName, param1, param2, param3) {
  const Contract = await ethers.getContractFactory(contractName);

  // pass up to three params to the contract if they exist
  let contract;
  if (param3) {
    contract = await Contract.deploy(param1, param2, param3);
  } else if (param2) {
    contract = await Contract.deploy(param1, param2);
  } else if (param1) {
    contract = await Contract.deploy(param1);
  } else {
    contract = await Contract.deploy();
  }

  await contract.deployed();
  return contract;
}

exports.deployUpgradeableContract = async function (contractName) {
  const Contract = await ethers.getContractFactory(contractName);
  let allAddresses = await ethers.getSigners();
  let admin = allAddresses[0];
  let contract = await upgrades.deployProxy(Contract, [admin.address]);
  await contract.deployed();
  return contract;
}

exports.hoursToSeconds = function (hours) {
  return (hours * 60 * 60);
}

exports.hoursToBlocks = function (hours) {
  return (hours * 140); // assuming 15s blocks similar to Governor.sol
}

exports.encodeParameters = function (types, values) {
  let abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

exports.deployDaoContracts = async function () {

  const allAddresses = await ethers.getSigners();
  const owner = allAddresses[0];
  console.log("deployDaoContracts() : Deploying Timelock, DAO token, and Governor contracts...");

  // 1) deploy timelock contract
  //      param1 - admin address
  //      param2 - delay in unix time
  const timelock = await exports.deployContract("Timelock", owner.address, exports.hoursToSeconds(48));

  // 2) deploy ERC-20 governance token
  //      param1 - initial holder of all tokens
  const daoToken = await exports.deployContract("DAOToken", owner.address);

  // 3) deploy governor contract
  //      param1 - timelock address
  //      param2 - governance token address
  //      param3 - guardian address
  const governor = await exports.deployContract("Governor", timelock.address, daoToken.address, owner.address);

  // 4) setPendingAdmin in timelock contract to governor contract so it will controlled by the DAO
  console.log("deployDaoContracts() : Setting admin in Timelock to Governor contract...");

  // format transactions for Timelock to change admin to Governor
  let currentTime = Math.floor(Date.now() / 1000);
  let timelockNewAdmin = {
    //address target, uint value, string memory signature, bytes memory data, uint eta
    target: timelock.address,
    value: 0,
    signature: "setPendingAdmin(address)",
    data: exports.encodeParameters(
      ['address'],[governor.address]
    ),
    eta: (currentTime + exports.hoursToSeconds(50))
  }
  const queueTimelockAdminToGovernor = await timelock.connect(owner).queueTransaction(
    timelockNewAdmin.target,
    timelockNewAdmin.value,
    timelockNewAdmin.signature,
    timelockNewAdmin.data,
    timelockNewAdmin.eta
  );
  console.log("deployDaoContracts() : Queued setPendingAdmin() on Timelock.");

  await exports.advanceHours(51);

  // execute setPendingAdmin on Timelock
  const executeTimelockAdminToGovernor = await timelock.connect(owner).executeTransaction(
    timelockNewAdmin.target,
    timelockNewAdmin.value,
    timelockNewAdmin.signature,
    timelockNewAdmin.data,
    timelockNewAdmin.eta
  );
  console.log("deployDaoContracts() : Executed setPendingAdmin() on Timelock.");
  await exports.advanceBlocks(1);

  // accept admin role from Governor contract
  const acceptAdmin = governor.connect(owner).__acceptAdmin();
  await exports.advanceBlocks(1);

  console.log("deployDaoContracts() : Called __acceptAdmin() on Governor.");

  // delegate owner voting power to self
  const delegateTokensToOwner = await daoToken.connect(owner).delegate(owner.address);

  return {
    timelock: timelock,
    daoToken: daoToken,
    governor: governor,
    addresses: allAddresses
  }
}

exports.advanceBlocks = async function (blocks) {
  for (let i = 0; i <= blocks; i++) {
    ethers.provider.send("evm_mine");
  }
}

exports.advanceHours = async function (hours) {
  let seconds = exports.hoursToSeconds(hours);
  await ethers.provider.send("evm_increaseTime", [seconds]);
  ethers.provider.send("evm_mine"); // mine a block after
}

exports.createSnapshot = async function () {
  return ethers.provider.send("evm_snapshot");
}

exports.applySnapshot = async function (snapshot) {
  await ethers.provider.send("evm_revert", [snapshot]);
}
