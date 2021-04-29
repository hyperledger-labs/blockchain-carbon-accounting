// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  createProposal,
  hoursToBlocks,
  proposalStates,
  executeProposalAndConfirmSuccess
} = require("./common.js");
const { getNamedAccounts } = require("hardhat");

describe("Climate DAO - Unit tests", function() {

  // increase time for tests (block skips can take a while)
  this.timeout(60000);
  const hoursToAdvanceBlocks = 74;

  beforeEach(async () => {
    await deployments.fixture();
  });

  it("DAO tokens can only be transferred from the initial holder and not by another party", async function() {

    const { deployer, consumer1, consumer2 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');

    // check balance of deployer before transfer (right after deployment)
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal('10000000000000000000000000'));

    // check balance of consumer1 before transfer
    await daoToken
      .balanceOf(consumer1)
      .then((response) => expect(response.toString()).to.equal('0'));

    // send some DAO tokens from owner to DAOuser
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(consumer1, 1000000);

    // check balance of owner after transfer
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal('9999999999999999999000000'));

    // check balance of DAOuser after transfer
    await daoToken
      .balanceOf(consumer1)
      .then((response) => expect(response.toString()).to.equal('1000000'));

    try {
        await daoToken
           .connect(await ethers.getSigner(consumer1))
           .transfer(consumer2, 1000000);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert dCLM8::transfer: sender must be initial holder or DAO governor"
      );
    }
  });

  it("should return quorum value of ~sqrt(4% of dCLM8)", async function() {

    const { deployer, consumer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');

    // check initial quorum (sqrt(400k) since no circulating supply)
    await governor
      .quorumVotes()
      .then((response) => expect(response.toString()).to.equal('632000000000'));

    // send tokens from deployer to DAO user
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(consumer1, '10000000000000000000000000')

    await governor
      .quorumVotes()
      .then((response) => expect(response.toString()).to.equal('632000000000'));

  });

  it("should burn staked dCLM8 tokens after a proposal is queued", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // transfer half of dCLM8 to dealer1
    let halfOfSupply = (await daoToken.balanceOf(deployer)).div(2);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(dealer1, halfOfSupply);

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // cast vote from dealer1
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, halfOfSupply);

    // check to see that dealer1 dCLM8 balance is zero
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal("0"));

    // check to see that governor dCLM8 balance is higher (plus proposal deposit)
    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response).to.equal("5100000000000000000000000"));

    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

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

    // check to see that governor dCLM8 balance is zero
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal("0"));

  });

  it("should allow one to refund their locked dCLM8 minus 5% on an active proposal", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // vote yes
    let halfOfSupply = fullSupply.div(2);
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, halfOfSupply);

    // check to see deployer dCLM8 balance is zero
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(halfOfSupply));

    // check receipt
    await governor.getReceipt(proposal, deployer)
    .then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("2224859546128"); // ~sqrt(halfOfSupply)
      expect(response.rawVotes).to.equal(halfOfSupply);
    });

    // refund locked dCLM8
    await governor.connect(await ethers.getSigner(deployer)).refund(1);

    // check to see deployer dCLM8 balance is full minus the deposit
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9652500000000000000000000"));

    // check receipt
    await governor.getReceipt(proposal, deployer)
    .then((response) => {
      expect(response.hasVoted).to.equal(false);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal(0);
      expect(response.rawVotes).to.equal(0);
    });

  });

  it("should allow only the guardian to set the quorum", async function () {
    const { deployer, dealer1 } = await getNamedAccounts();
    const governor = await ethers.getContract('Governor');

    // check initial quorum
    await governor
      .quorumVotes()
      .then((response) => {
        expect(response).to.equal(632000000000);
      });

    // try to set quorum from auditor
    try {
      await governor
        .connect(await ethers.getSigner(dealer1))
        .setQuorum(1000000);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::setQuorum: must be guardian"
      );
    }

    // set new quorum from deployer
    await governor
      .connect(await ethers.getSigner(deployer))
      .setQuorum(1000000);

    // check updated quorum
    await governor
      .quorumVotes()
      .then((response) => {
        expect(response).to.equal(1000000);
      });
  });

  it("should require users to lock dCLM8 when making a proposal", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // check to see deployer dCLM8 balance is decreased
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal("9900000000000000000000000"));

  });

  it("should allow users to top off a vote", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // initial vote
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, 100);

    // top off vote
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, 100);

    // try to vote with different support
    try {
      await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, false, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::_castVote: can only top off same vote without refunding"
      );
    }

    // check receipt
    await governor.getReceipt(proposal, deployer)
    .then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal(20);
      expect(response.rawVotes).to.equal(200);
    });

  });

  it("should give 3/4 of stake plus votes back after canceling proposal", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // initial vote
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, 100);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9899999999999999999999900"));

    // cancel
    await governor.connect(await ethers.getSigner(deployer)).cancel(proposal);

    // refund
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // check to see deployer dCLM8 balance is full minus 1/4 stake
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal("9974999999999999999999975"));

  });

  it("should allow a proposer to refund votes while active and then refund stake after canceled", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // initial vote
    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, voteAmount);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9700000000000000000000000"));

    // refund votes
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9890000000000000000000000"));

    // cancel
    await governor.connect(await ethers.getSigner(deployer)).cancel(proposal);

    // refund stake
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // check to see deployer dCLM8 balance is full minus 1/4 stake
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal("9965000000000000000000000"));

  });

  it("should allow a proposer to refund 150% of the stake if it succeeds", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    let deployerBalance = await daoToken.balanceOf(deployer)

    // initial vote
    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, voteAmount);
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("4700000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("3000000000000000000000000"));

    // time skip
    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });

    // refund
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // check to see deployer dCLM8 balance after refund 4,700,000 + ((100,000 + 200,000) * 1.5) = 5,150,000
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal("5150000000000000000000000"));

  });

  it("should not allow a proposer to refund anything if a vote fails", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("100000000000000000000000"));

    // initial vote
    let voteAmount = "400000000000000000000000" // 400,000
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, false, voteAmount);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9500000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("500000000000000000000000"));

    // time skip
    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for defeat
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });

    // try to refund
    try {
      await governor.connect(await ethers.getSigner(deployer)).refund(proposal);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::refund: not eligible for refund"
      );
    }

  });

  it("should allow a proposer to refund 3/4 stake if quorum fails", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);
    // should remove thresholdToStakeProposal which went into governor
    // -  100000000000000000000000
    // = 9900000000000000000000000
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9900000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("100000000000000000000000"));

    // initial vote
    let voteAmount = "300000000000000000000000" // 300,000
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, voteAmount);

    // check the balance
    // -  300000000000000000000000
    // -  100000000000000000000000
    // = 9600000000000000000000000
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9600000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("400000000000000000000000"));

    // time skip
    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for defeat
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });

    // refund
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // Refund 3/4 of 400k so balance should be -100k of the initial value
    // = 9900000000000000000000000
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9900000000000000000000000"));

  });


  it("should not allow a user to get their voted tokens back if a proposal is succeeded", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    let deployerBalance = await daoToken.balanceOf(deployer)

    // initial vote
    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, voteAmount);
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("4700000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("3000000000000000000000000"));

    // time skip
    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });


    // try to refund
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(proposal);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::refund: not eligible for refund"
      );
    }
  });

  it("should not allow a user to get their voted tokens back if a proposal is defeated", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    let deployerBalance = await daoToken.balanceOf(deployer)

    // initial vote
    let voteAmount = "400000000000000000000000" // 400,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, false, voteAmount);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("4900000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("3000000000000000000000000"));

    // time skip
    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });


    // try to refund
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(proposal);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::refund: not eligible for refund"
      );
    }
  });

  it("should allow a user to get their voted tokens back if a proposal is quorum failed", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    await daoToken
       .balanceOf(dealer1)
       .then((response) => expect(response.toString()).to.equal("2500000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    let deployerBalance = await daoToken.balanceOf(deployer)

    // initial vote
    let voteAmount = "100000000000000000000000" // 100,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);


    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2700000000000000000000000"));

    // time skip
    console.log("Advancing blocks...")
    advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });


    // refund
    await governor.connect(await ethers.getSigner(dealer1)).refund(proposal);

    await daoToken
       .balanceOf(dealer1)
       .then((response) => expect(response.toString()).to.equal("2500000000000000000000000"));

  });

});
