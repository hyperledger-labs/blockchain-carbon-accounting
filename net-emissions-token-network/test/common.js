// SPDX-License-Identifier: Apache-2.0
const { upgrades } = require("hardhat");
const { ethers } = require("./ethers-provider");

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
