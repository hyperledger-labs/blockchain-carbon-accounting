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

  return {
    timelock: timelock,
    daoToken: daoToken,
    governor: governor,
    addresses: allAddresses
  }
}
