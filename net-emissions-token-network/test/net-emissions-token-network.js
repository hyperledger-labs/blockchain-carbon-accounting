const { expect } = require("chai");
const {
  tokenId,
  allTokenTypeId,
  quantity,
  issuerId,
  recipientId,
  fromDate,
  thruDate,
  uom,
  metadata,
  manifest,
  description,
  automaticRetireDate,
} = require("./constants.js");

async function deployContract() {
  const NetEmissions = await ethers.getContractFactory("NetEmissionsTokenNetwork");
  const netEmissions = await NetEmissions.deploy();
  await netEmissions.deployed();
  return netEmissions;
}

describe("Net Emissions Token Network", function() {
  it("should be owned only by the address that deployed the contract", async function() {
    let contract = await deployContract();

    const [owner, addr1] = await ethers.getSigners();

    let isOwner = await contract.isOwner();
    expect(isOwner).to.equal(true);

    let isOwnerDifferentAddress = await contract.connect(addr1).isOwner();
    expect(isOwnerDifferentAddress).to.equal(false);
  });

  it("should define a Renewable Energy Certificate token, verify issue/transfer logic, register/unregister consumer and dealer with tokenId", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let token = await contract.defineToken(tokenId, allTokenTypeId[0], description);

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Renewable Energy Certificate");

    let mint = await contract.issue(
      tokenId,
      quantity,
      issuerId,
      recipientId,
      uom,
      fromDate,
      thruDate,
      metadata,
      manifest,
      automaticRetireDate
    );
    // Check to be certain mint did not return errors
    expect(mint);

    // test to make sure token cannot be transferred without registered dealers
    try {
      let transfer = await contract.transfer(allAddresses[1].address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert eThaler: sender must be registered first"
      );
    }

    let registerDealer = await contract.registerDealer(allAddresses[1].address, tokenId);
    expect(registerDealer);

    let registerConsumer = await contract.registerConsumer(allAddresses[2].address, tokenId);
    expect(registerConsumer);

    let unregisterDealer = await contract.unregisterDealer(allAddresses[1].address, tokenId);
    expect(unregisterDealer);

    let unregisterConsumer = await contract.unregisterConsumer(allAddresses[2].address, tokenId);
    expect(unregisterConsumer);
  });

  it("should define a Renewable Energy Certificate token, verify issue/transfer logic, register/unregister consumer and dealer with tokenId", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let token = await contract.defineToken(tokenId, allTokenTypeId[1], description);

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Carbon Emissions Offset");

    let mint = await contract.issue(
      tokenId,
      quantity,
      issuerId,
      recipientId,
      uom,
      fromDate,
      thruDate,
      metadata,
      manifest,
      automaticRetireDate
    );
    // Check to be certain mint did not return errors
    expect(mint);

    // test to make sure token cannot be transferred without registered dealers
    try {
      let transfer = await contract.transfer(allAddresses[1].address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert eThaler: sender must be registered first"
      );
    }

    let registerDealer = await contract.registerDealer(allAddresses[1].address, tokenId);
    expect(registerDealer);

    let registerConsumer = await contract.registerConsumer(allAddresses[2].address, tokenId);
    expect(registerConsumer);

    let unregisterDealer = await contract.unregisterDealer(allAddresses[1].address, tokenId);
    expect(unregisterDealer);

    let unregisterConsumer = await contract.unregisterConsumer(allAddresses[2].address, tokenId);
    expect(unregisterConsumer);
  });

  it("should define an Audited Emissions token, verify issue/transfer logic, register/unregister consumer and dealer with tokenId", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let token = await contract.defineToken(tokenId, allTokenTypeId[2], description);

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Audited Emissions");

    let mint = await contract.issue(
      tokenId,
      quantity,
      issuerId,
      recipientId,
      uom,
      fromDate,
      thruDate,
      metadata,
      manifest,
      automaticRetireDate
    );
    // Check to be certain mint did not return errors
    expect(mint);

    // test to make sure token cannot be transferred without registered dealers
    try {
      let transfer = await contract.transfer(allAddresses[1].address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert eThaler: sender must be registered first"
      );
    }

    let registerDealer = await contract.registerDealer(allAddresses[1].address, tokenId);
    expect(registerDealer);

    let registerConsumer = await contract.registerConsumer(allAddresses[2].address, tokenId);
    expect(registerConsumer);

    let unregisterDealer = await contract.unregisterDealer(allAddresses[1].address, tokenId);
    expect(unregisterDealer);

    let unregisterConsumer = await contract.unregisterConsumer(allAddresses[2].address, tokenId);
    expect(unregisterConsumer);
  });
});
