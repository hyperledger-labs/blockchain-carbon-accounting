const { expect } = require("chai");

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

});
