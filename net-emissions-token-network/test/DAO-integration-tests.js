// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  advanceHours,
  hoursToBlocks,
  createProposal,
  executeProposalAndConfirmSuccess,
  proposalStates
} = require("./common.js");
const { getNamedAccounts } = require("hardhat");

describe("Climate DAO - Integration tests", function() {
  
  // increase time for tests (block skips can take a while)
  this.timeout(60000);

  beforeEach(async () => {
    await deployments.fixture();
  });

  // it("should allow the owner to make and pass proposals to issue CLM8 tokens to self", async function() {

  //   const { deployer } = await getNamedAccounts();
  //   const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');
  //   const governor = await ethers.getContract('Governor');

  //   let proposal = createProposal({
  //     deployer: deployer,
  //     governor: governor,
  //     netEmissionsTokenNetwork: netEmissionsTokenNetwork,
  //   });

  //   // cast vote for proposal by owner
  //   let castVote = await governor
  //     .connect(await ethers.getSigner(deployer))
  //     .castVote(proposal, true);
  //   expect(castVote);

  //   // get proposal state after vote cast
  //   await governor.state(proposal)
  //   .then((response) => {
  //     expect(response).to.equal(proposalStates.succeeded); // passed since all votes counted
  //   });

  //   // get receipt of vote
  //   await governor.getReceipt(proposal, deployer)
  //   .then((response) => {
  //     expect(response.hasVoted).to.equal(true);
  //     expect(response.support).to.equal(true);
  //   });

  //   // check for success
  //   await governor.state(proposal)
  //   .then((response) => {
  //     expect(response).to.equal(proposalStates.succeeded);
  //   });

  //   // queue proposal after it's successful
  //   let queueProposal = await governor
  //     .connect(await ethers.getSigner(deployer))
  //     .queue(proposal);
  //   expect(queueProposal);

  //   executeProposalAndConfirmSuccess(proposal,
  //   {
  //     deployer: deployer,
  //     governor: governor,
  //     netEmissionsTokenNetwork: netEmissionsTokenNetwork
  //   });

  // });

  it("should pass if 3/4 of token holders vote yes on a proposal", async function() {

    const { deployer, dealer1, dealer2, dealer3, dealer4 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // transfer DAO tokens to all holders
    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer3, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer4, quarterOfSupply);

    let proposal = createProposal({
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // check for active
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.active);
    });
    
    // cast a yes votes and test if vote is equal to sqrt
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, 100);

    await governor.getReceipt(proposal, dealer1)
      .then((response) => {
        expect(response.votes).to.equal(10);
      });

    // cast two more yes votes and one no vote
    await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, true, quarterOfSupply);
    await governor.connect(await ethers.getSigner(dealer3)).castVote(proposal, true, quarterOfSupply);
    await governor.connect(await ethers.getSigner(dealer4)).castVote(proposal, false, quarterOfSupply);

    // check dclm8 balance of dealer1 after vote
    await daoToken.balanceOf(dealer1)
    .then((response) => {
      expect(response).to.equal(
        quarterOfSupply.sub(ethers.BigNumber.from(100))
      );
    });

    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(150));
    
    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });

    // queue proposal after it's successful
    let queueProposal = await governor
      .connect(await ethers.getSigner(deployer))
      .queue(proposal);
    expect(queueProposal);

    executeProposalAndConfirmSuccess(proposal, {
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork
    });

  });

  // it("should fail if only 1/4 of token holders vote yes on a proposal", async function() {

  //   const { deployer, dealer1, dealer2, dealer3, dealer4 } = await getNamedAccounts();
  //   const daoToken = await ethers.getContract('DAOToken');
  //   const governor = await ethers.getContract('Governor');
  //   const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

  //   // transfer DAO tokens to all holders
  //   let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
  //   await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
  //   await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, quarterOfSupply);
  //   await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer3, quarterOfSupply);
  //   await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer4, quarterOfSupply);

  //   let proposal = createProposal({
  //     deployer: deployer,
  //     governor: governor,
  //     netEmissionsTokenNetwork: netEmissionsTokenNetwork,
  //   });

  //   advanceBlocks(2);

  //   // cast one yes votes and three no votes
  //   await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true);
  //   await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, false);
  //   await governor.connect(await ethers.getSigner(dealer3)).castVote(proposal, false);
  //   await governor.connect(await ethers.getSigner(dealer4)).castVote(proposal, false);

  //   // check for defeat
  //   await governor.state(proposal)
  //   .then((response) => {
  //     expect(response).to.equal(proposalStates.defeated);
  //   });

  // });

});
