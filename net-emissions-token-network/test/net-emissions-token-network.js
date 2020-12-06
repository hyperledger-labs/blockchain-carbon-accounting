const { expect } = require("chai");
const {
  tokenId,
  tokenTypeId,
  quantity,
  issuerId,
  recipientId,
  assetType,
  uom,
  dateStamp,
  metadata,
  manifest,
  description,
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

  it("should create a token with the arguments supplied", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let token = await contract.addCarbonToken(
      tokenId,
      tokenTypeId,
      quantity,
      issuerId,
      recipientId,
      assetType,
      uom,
      dateStamp,
      metadata,
      manifest,
      description
    );

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal(tokenTypeId);

    let mint = await contract.mint(tokenId, quantity, []);
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
  });

  // it("should fail to transfer a token because token has not been minted and dealers have not been registered", async function() {
  //   let contract = await deployContract();

  //   let address = contract.address;
  //   // let transfer = contract.transfer(1, address, )
  //   let mint = await contract.mint(tokenId, quantity, []);
  //   console.log(mint);

  //   // let name = await contract.getTokenName(1);

  //   expect(address).to.equal("test");
  // });
});

// let name = await contract.getTokenName(1);

// console.log(name);
