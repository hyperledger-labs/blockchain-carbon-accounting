const { expect } = require("chai");
const {
  deployContract,
  hoursToSeconds
} = require("./common.js");

describe("Climate DAO - Unit tests", function() {
  it("should deploy governor, DAO token, and timelock contracts successfully", async function() {
    // get test addresses
    const allAddresses = await ethers.getSigners();
    let owner = allAddresses[0];

    // first, deploy timelock contract
    const timelock = await deployContract("Timelock", owner.address, hoursToSeconds(48));

    // second, deploy ERC-20 governance token
    const token = await deployContract("DAOToken", owner.address);

    // third, deploy governor contract
    const governor = await deployContract("Governor", timelock.address, token.address, owner.address);
  });
});
