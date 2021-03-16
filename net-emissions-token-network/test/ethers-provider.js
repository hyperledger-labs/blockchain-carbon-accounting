exports.ethers = process.env.OVM
  ? require("hardhat").l2ethers
  : require("hardhat").ethers;
