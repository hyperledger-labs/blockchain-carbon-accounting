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

  // 4) set admin of timelock contract to governor contract so it is controlled by the DAO
  let currentBlock = await ethers.provider.getBlockNumber();
  let currentTime = Math.floor(Date.now() / 1000);
  let timelockNewAdmin = {
    //address target, uint value, string memory signature, bytes memory data, uint eta
    target: timelock.address,
    value: 0,
    signature: "setPendingAdmin",
    data: exports.encodeParameters(
      ['address'],[governor.address]
    ),
    eta: (currentTime + exports.hoursToSeconds(50))
  }
  const setTimelockAdminToGovernor = await timelock.connect(owner).queueTransaction(
    timelockNewAdmin.target,
    timelockNewAdmin.value,
    timelockNewAdmin.signature,
    timelockNewAdmin.data,
    timelockNewAdmin.eta
  );

  // await exports.advanceHours(51);

  // const executeTimelockNewAdminTransaction = await timelock.connect(owner).executeTransaction(
  //   timelockNewAdmin.target,
  //   timelockNewAdmin.value,
  //   timelockNewAdmin.signature,
  //   timelockNewAdmin.data,
  //   timelockNewAdmin.eta
  // );

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
  ethers.provider.send("evm_increaseTime", [seconds]);
}
