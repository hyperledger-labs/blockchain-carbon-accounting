const { expect } = require("chai");
const {
  deployDaoContracts
} = require("./common.js");

describe("Climate DAO - Unit tests", function() {
  it("should deploy governor, DAO token, and timelock contracts successfully", async function() {
    const contracts = deployDaoContracts();
  });
});
