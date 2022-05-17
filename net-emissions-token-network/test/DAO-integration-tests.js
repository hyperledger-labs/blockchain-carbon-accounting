// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { getNamedAccounts, deployments } = require("hardhat");
const {
  advanceBlocks,
  hoursToBlocks,
  createProposal,
  executeProposalAndConfirmSuccess,
  proposalStates,
  ethers
} = require("./common.js");

describe("Climate DAO - Integration tests", function() {

  // increase time for tests (block skips can take a while)
  this.timeout(60000);
  const hoursToAdvanceBlocks = 74;

  beforeEach(async () => {
    await deployments.fixture();
  });

  // it("should allow the owner to make and pass proposals to issue CLM8 tokens to self", async function() {

  //   const { deployer } = await getNamedAccounts();
  //   const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');
  //   const governor = await ethers.getContract('Governor');

  //   let proposal = await createProposal({
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
    const {
      deployer,
      dealer1,
      dealer2,
      dealer3,
      dealer4,
    } = await getNamedAccounts();
    const daoToken = await ethers.getContract("DAOToken");
    const governor = await ethers.getContract("Governor");
    const netEmissionsTokenNetwork = await ethers.getContract(
      "NetEmissionsTokenNetwork"
    );

    // transfer DAO tokens to all holders
    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(dealer1, quarterOfSupply);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(dealer2, quarterOfSupply);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(dealer3, quarterOfSupply);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(dealer4, quarterOfSupply);

    // for the proposal to work for the specified token type, the issuer must be a REC dealer
    await netEmissionsTokenNetwork
      .connect(await ethers.getSigner(deployer))
      .registerDealer(dealer1, 1);  // REC dealer

    let proposal = await createProposal({
      proposer: dealer1,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
      tokenTypeId: 1
    });

    advanceBlocks(2);

    // check for active
    await governor.state(proposal).then((response) => {
      expect(response).to.equal(proposalStates.active);
    });

    // check the proposal already has a yes vote from the proposer equal to the proposal threshold
    // raw: 100000000000000000000000 or 100000 voting tokens
    await governor.getReceipt(proposal, dealer1).then((response) => {
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal(
        Math.floor(Math.sqrt(100000000000000000000000))
      );
    });

    // cast two more yes votes and one no vote
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(proposal, true, quarterOfSupply);
    await governor
      .connect(await ethers.getSigner(dealer3))
      .castVote(proposal, true, quarterOfSupply);
    await governor
      .connect(await ethers.getSigner(dealer4))
      .castVote(proposal, false, quarterOfSupply);

    // check dclm8 balances after vote
    await daoToken.balanceOf(dealer1).then((response) => {
      // quarterSupply minus 100k
      expect(response).to.equal("2400000000000000000000000");
    });
    await daoToken.balanceOf(dealer2).then((response) => {
      expect(response).to.equal("0");
    });
    await daoToken.balanceOf(dealer3).then((response) => {
      expect(response).to.equal("0");
    });
    await daoToken.balanceOf(dealer4).then((response) => {
      expect(response).to.equal("0");
    });

    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal).then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });

    // queue proposal after it's successful
    let queueProposal = await governor
      .connect(await ethers.getSigner(deployer))
      .queue(proposal);
    expect(queueProposal);

    await executeProposalAndConfirmSuccess(proposal, {
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });
  });

  it("should fail quorum if total of votes for and against is below quorum", async function() {

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

    let proposal = await createProposal({
      proposer: dealer1,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, true, "1000000000000000000000");  // 1000 voting tokens
    await governor.connect(await ethers.getSigner(dealer3)).castVote(proposal, false, "1000000000000000000000");

    console.log(`quorumVotes : ${(await governor.quorumVotes()).toString()}`);
    console.log(`forVotes    : ${(await governor.proposals(1)).forVotes.toString()}`);
    console.log(`againstVotes: ${(await governor.proposals(1)).againstVotes.toString()}`);

    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // quorum fails because dealer1 votes 100000 by making proposal, dealer2 1000, dealer3 1000
    // so total is 316.227766016 + 31.622776601 + 31.622776601 < 632

    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });
  });

  it("should fail if 1/4 vote for and 2*1/10 vote against due to quadratic voting", async function() {

    const { deployer, dealer1, dealer2, dealer3, dealer4 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    let tenthOfSupply = (await daoToken.balanceOf(deployer)).div(10);

    // transfer DAO tokens to holders
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer3, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer4, quarterOfSupply);

    let proposal = await createProposal({
      proposer: dealer1,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // cast 1/4 of votes for and 2 1/10 against.  In quadratic voting this is like casting sqrt(25) for and 2*sqrt(10) against, which is 5 votes for and 6.66 votes against.
    await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, true, quarterOfSupply);
    await governor.connect(await ethers.getSigner(dealer3)).castVote(proposal, false, tenthOfSupply);
    await governor.connect(await ethers.getSigner(dealer4)).castVote(proposal, false, tenthOfSupply);

    console.log(`quorumVotes : ${(await governor.quorumVotes()).toString()}`);
    console.log(`forVotes    : ${(await governor.proposals(1)).forVotes.toString()}`);
    console.log(`againstVotes: ${(await governor.proposals(1)).againstVotes.toString()}`);

    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for defeat
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });
  });

});
