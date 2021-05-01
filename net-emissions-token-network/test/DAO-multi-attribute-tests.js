// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  createMultiAttributeProposal,
  hoursToBlocks,
  proposalStates,
  executeProposalAndConfirmSuccess
} = require("./common.js");
const { getNamedAccounts } = require("hardhat");

describe("Climate DAO - Multi-attribute proposal tests", function() {

  // increase time for tests (block skips can take a while)
  this.timeout(60000);
  const hoursToAdvanceBlocks = 74;

  beforeEach(async () => {
    await deployments.fixture();
  });

  it("should allow a user to make a multi-attribute proposal", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // create a proposal
    let proposal = await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    // check for 1 parent proposal and 3 child proposals
    await governor
      .proposalCount()
      .then((response) => expect(response.toString()).to.equal("4"));

  });

  it("should split vote three ways to children when voting on a parent proposal", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // create a proposal
    let proposal = await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    console.log(proposal);
    // vote on parent proposal
    await governor
      .connect(await ethers.getSigner(deployer))
      .castVote(1, true, "1000000000000000000000"); // 1000 dCLM8

    // check receipts for each proposal
    console.log(`Proposal #1 receipt: ${(await governor.getReceipt(1, deployer))}`)
    console.log(`Proposal #2 receipt: ${(await governor.getReceipt(2, deployer))}`)
    console.log(`Proposal #3 receipt: ${(await governor.getReceipt(3, deployer))}`)
    console.log(`Proposal #4 receipt: ${(await governor.getReceipt(4, deployer))}`)
    console.log(`Proposal #1 details: ${(await governor.proposals(1))}`)

    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      expect(response.votes).to.equal("18257418583");
      expect(response.rawVotes).to.equal("333333333333333333333");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      expect(response.votes).to.equal("18257418583");
      expect(response.rawVotes).to.equal("333333333333333333333");
    });
    await governor.getReceipt(4, deployer).then((response) => {
      expect(response.votes).to.equal("18257418583");
      expect(response.rawVotes).to.equal("333333333333333333333");
    });

  });

});
