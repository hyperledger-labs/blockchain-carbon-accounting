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
  it("should test contract owner", async function() {
    let contract = await deployContract();

    const [owner, addr1] = await ethers.getSigners();

    let isOwner = await contract.isOwner();
    expect(isOwner).to.equal(true);

    let isOwnerDifferentAddress = await contract.connect(addr1).isOwner();
    expect(isOwnerDifferentAddress).to.equal(false);
  });

  it("should define a Renewable Energy Certificate, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);

    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
        tokenId,
        allTokenTypeId[0],
        quantity,
        uom,
        fromDate,
        thruDate,
        metadata,
        manifest,
        automaticRetireDate,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    let balance = await contract.balanceOf(consumerAddress.address, tokenId);
    expect(balance);

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Renewable Energy Certificate");

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract.connect(ownerAddress).unregisterDealer(allAddresses[1].address);
    expect(unregisterDealer);

    // test to make sure token cannot be transferred without being a dealer
    try {
      let transfer = await contract.transfer(allAddresses[1].address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: caller is not owner nor approved"
      );
    }
  });

  it("should define a Carbon Emissions Offset, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);

    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
        tokenId,
        allTokenTypeId[1],
        quantity,
        uom,
        fromDate,
        thruDate,
        metadata,
        manifest,
        automaticRetireDate,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    let balance = await contract.balanceOf(consumerAddress.address, tokenId);
    expect(balance);

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Carbon Emissions Offset");

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract.connect(ownerAddress).unregisterDealer(allAddresses[1].address);
    expect(unregisterDealer);

    // test to make sure token cannot be transferred without being a dealer
    try {
      let transfer = await contract.transfer(allAddresses[1].address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: caller is not owner nor approved"
      );
    }
  });

  it("should define a Audited Emissions, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);

    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
        tokenId,
        allTokenTypeId[2],
        quantity,
        uom,
        fromDate,
        thruDate,
        metadata,
        manifest,
        automaticRetireDate,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    let balance = await contract.balanceOf(consumerAddress.address, tokenId);
    expect(balance);

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Audited Emissions");

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract.connect(ownerAddress).unregisterDealer(allAddresses[1].address);
    expect(unregisterDealer);

    // test to make sure token cannot be transferred without being a dealer
    try {
      let transfer = await contract.transfer(allAddresses[1].address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: caller is not owner nor approved"
      );
    }
  });
});
