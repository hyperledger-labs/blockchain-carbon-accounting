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

    console.log(proposal);
    // check for 1 parent proposal and 3 child proposals
    await governor
      .proposalCount()
      .then((response) => expect(response.toString()).to.equal("4"));

  });

  it("should split vote three ways to children when voting on a parent proposal and fail if quorum is not reached", async function () {

    const { deployer, dealer1, dealer2 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');
    
    let decimals = ethers.BigNumber.from("1000000000000000000");
    
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, ethers.BigNumber.from("500000").mul(decimals));
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, ethers.BigNumber.from("500000").mul(decimals));

    console.log("***** before voting *****")
    console.log(`Deployer dao token balance = ${(await daoToken.balanceOf(deployer)).div(decimals)}`);
    console.log(`Dealer1 dao token balance = ${(await daoToken.balanceOf(dealer1)).div(decimals)}`);
    console.log(`Dealer2 dao token balance = ${(await daoToken.balanceOf(dealer2)).div(decimals)}`);
    
    // create a proposal
    let proposal = await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    console.log('createMultiAttributeProposal returned : ', proposal);

    // total votes on parent and child proposals
    console.log(`1 forVotes    : ${(await governor.proposals(1)).forVotes.toString()}`);
    console.log(`1 rawForVotes : ${(await governor.proposals(1)).rawForVotes.toString()}`);
    console.log(`2 forVotes    : ${(await governor.proposals(2)).forVotes.toString()}`);
    console.log(`2 rawForVotes : ${(await governor.proposals(2)).rawForVotes.toString()}`);
    console.log(`3 forVotes    : ${(await governor.proposals(3)).forVotes.toString()}`);
    console.log(`3 rawForVotes : ${(await governor.proposals(3)).rawForVotes.toString()}`);
    console.log(`4 forVotes    : ${(await governor.proposals(4)).forVotes.toString()}`);
    console.log(`4 rawForVotes : ${(await governor.proposals(4)).rawForVotes.toString()}`);
    console.log(`quorumVotes : ${(await governor.quorumVotes()).toString()}`);
    
    // deployer's receipt: should have votes equal to the threshold (100000000000000000000000)
    // since this calls `propose` for each proposal this means each one including the parent
    // currently ends up with `threshold` votes ...
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.votes).to.equal("316227766016");
      expect(response.rawVotes).to.equal("100000000000000000000000");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      expect(response.votes).to.equal("316227766016");
      expect(response.rawVotes).to.equal("100000000000000000000000");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      expect(response.votes).to.equal("316227766016");
      expect(response.rawVotes).to.equal("100000000000000000000000");
    });
    await governor.getReceipt(4, deployer).then((response) => {
      expect(response.votes).to.equal("316227766016");
      expect(response.rawVotes).to.equal("100000000000000000000000");
    });

    // vote on parent proposal
    await governor
      .connect(await ethers.getSigner(deployer))
      .castVote(1, true, ethers.BigNumber.from("2500").mul(decimals)); // 1 is the parent proposal

    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(2, true, ethers.BigNumber.from("2000").mul(decimals)); // 2 is the first child proposal

    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, true, ethers.BigNumber.from("2000").mul(decimals)); // 3 is the second child proposal

    console.log("***** after voting *****");
    console.log(`Deployer dao token balance = ${(await daoToken.balanceOf(deployer)).div(decimals)}`);
    console.log(`Dealer1 dao token balance = ${(await daoToken.balanceOf(dealer1)).div(decimals)}`);
    console.log(`Dealer2 dao token balance = ${(await daoToken.balanceOf(dealer2)).div(decimals)}`);

    // total votes on parent and child proposals
    console.log(`1 forVotes    : ${(await governor.proposals(1)).forVotes.toString()}`);
    console.log(`1 rawForVotes : ${(await governor.proposals(1)).rawForVotes.toString()}`);
    console.log(`2 forVotes    : ${(await governor.proposals(2)).forVotes.toString()}`);
    console.log(`2 rawForVotes : ${(await governor.proposals(2)).rawForVotes.toString()}`);
    console.log(`3 forVotes    : ${(await governor.proposals(3)).forVotes.toString()}`);
    console.log(`3 rawForVotes : ${(await governor.proposals(3)).rawForVotes.toString()}`);
    console.log(`4 forVotes    : ${(await governor.proposals(4)).forVotes.toString()}`);
    console.log(`4 rawForVotes : ${(await governor.proposals(4)).rawForVotes.toString()}`);
    console.log(`quorumVotes : ${(await governor.quorumVotes()).toString()}`);
    
    // deployer's receipt: 2500 votes split evenly on 3 proposals, 0 votes on parent proposal, 833.33 votes on each child (2500/3), sqrt of which is 28.867
    // note this adds to the original threshold votes for deployer...
    // - parent votes for Deployer are unchanged
    // - child votes increased by the split amount: 100000000000000000000000 + 833333333333333333333 = 100833333333333333333333
    // - quadratic vote : sqrt(100833333333333333333333) = 317542648054

    await governor.getReceipt(1, deployer).then((response) => {
      console.log(`1 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("316227766016");
      expect(response.rawVotes).to.equal("100000000000000000000000");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      console.log(`2 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("317542648054");
      expect(response.rawVotes).to.equal("100833333333333333333333");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      console.log(`3 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("317542648054");
      expect(response.rawVotes).to.equal("100833333333333333333333");
    });
    await governor.getReceipt(4, deployer).then((response) => {
      console.log(`4 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("317542648054");
      expect(response.rawVotes).to.equal("100833333333333333333333");
    });
    
    // dealer1 receipt: 2000 votes on proposal 2 which is the first child proposal, 0 votes on other proposals 
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer1).then((response) => {
      expect(response.votes).to.equal("44721359549");
      expect(response.rawVotes).to.equal("2000000000000000000000");
    });
    await governor.getReceipt(3, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(4, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    
    // dealer2 receipt: 2000 votes on proposal 3 which is the first child proposal, 0 votes on other proposals
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(3, dealer2).then((response) => {
      expect(response.votes).to.equal("44721359549");
      expect(response.rawVotes).to.equal("2000000000000000000000");
    });
    await governor.getReceipt(4, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));
        
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });    
    
  });

});
