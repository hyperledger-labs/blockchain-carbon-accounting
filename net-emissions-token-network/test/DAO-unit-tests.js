// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { getNamedAccounts, deployments } = require("hardhat");
const {
  advanceBlocks,
  createProposal,
  hoursToBlocks,
  proposalStates,
  revertError,
  ethers
} = require("./common.js");

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

    // send some DAO tokens from owner to DAO user
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(consumer1, 1000000);

    // check balance of owner after transfer
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal('9999999999999999999000000'));

    // check balance of DAO user after transfer
    await daoToken
      .balanceOf(consumer1)
      .then((response) => expect(response.toString()).to.equal('1000000'));

    try {
        await daoToken
           .connect(await ethers.getSigner(consumer1))
           .transfer(consumer2, 1000000);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("dCLM8::transfer: sender must be initial holder or DAO governor")
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
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

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

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

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
    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract("DAOToken");
    const governor = await ethers.getContract("Governor");
    const netEmissionsTokenNetwork = await ethers.getContract(
      "NetEmissionsTokenNetwork"
    );

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);  // 10,000k
    expect(fullSupply).to.equal("10000000000000000000000000");
    let halfOfSupply = fullSupply.div(2); // 5,000k
    expect(halfOfSupply).to.equal("5000000000000000000000000");

    // give half supply to dealer1
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, halfOfSupply);
    await daoToken
      .balanceOf(dealer1)
      .then((response) =>
        expect(response.toString()).to.equal(halfOfSupply)
      );

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    // check deployer balance after proposal is half supply minus threshold
    let supply2 = await daoToken.balanceOf(deployer);  // 4,900k
    expect(supply2).to.equal("4900000000000000000000000");

    // check with dealer1, since he is not the proposer the refund will result in all his votes
    // being canceled minus 5%

    // case vote for 200k
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(proposal, true, "200000000000000000000000");

    // check receipt
    await governor.getReceipt(proposal, dealer1).then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("447213595499");
      expect(response.rawVotes).to.equal("200000000000000000000000");
    });

    // refund
    await governor.connect(await ethers.getSigner(dealer1)).refund(1);
    // lost 5% so 10k and balance will be 4,990k
    await daoToken
      .balanceOf(dealer1)
      .then((response) =>
        expect(response.toString()).to.equal("4990000000000000000000000")
      );

    // check receipt, this one has 0 votes
    await governor.getReceipt(proposal, dealer1).then((response) => {
      expect(response.hasVoted).to.equal(false);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
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
    let error = null;
    try {
      await governor
        .connect(await ethers.getSigner(dealer1))
        .setQuorum(1000000);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::setQuorum: must be guardian")
    );

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
    expect(fullSupply).to.equal("10000000000000000000000000");

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    // check state
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.active);
    });

    // check to see deployer dCLM8 balance is decreased
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response).to.equal("9900000000000000000000000"));

  });

  it("should NOT allow users to top off a vote", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);  // 10,000k
    expect(fullSupply).to.equal("10000000000000000000000000");
    let halfOfSupply = fullSupply.div(2); // 5,000k
    expect(halfOfSupply).to.equal("5000000000000000000000000");

    // give half supply to dealer1
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, halfOfSupply);
    await daoToken
      .balanceOf(dealer1)
      .then((response) =>
        expect(response.toString()).to.equal(halfOfSupply)
      );

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    // initial vote is equal to the threshold
    await governor.getReceipt(proposal, deployer).then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016"); // ~sqrt(threshold)
    });

    // add similar vote from dealer1
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, "100000000000000000000000");
    await governor.getReceipt(proposal, dealer1).then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016"); // ~sqrt(threshold)
    });

    // top off vote
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, "100000000000000000000000");
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::_castVote: cannot top off same vote without refunding")
    );

    // try to vote with different support
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, false, 100);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::_castVote: cannot top off same vote without refunding")
    );

    // check receipt, should be unchanged from previously
    await governor.getReceipt(proposal, dealer1).then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016");
    });

  });

  it("should allow proposer to refund their votes back minus 5% after canceling proposal", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    expect(fullSupply).to.equal("10000000000000000000000000");

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("9900000000000000000000000"));

    // cancel
    await governor.connect(await ethers.getSigner(deployer)).cancel(proposal);

    // refund
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // check to see deployer dCLM8 balance is full minus 5%
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal("9995000000000000000000000"));

  });

  it("should allow a proposer to refund 150% of the stake if it succeeds", async function () {
    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract("DAOToken");
    const governor = await ethers.getContract("Governor");
    const netEmissionsTokenNetwork = await ethers.getContract(
      "NetEmissionsTokenNetwork"
    );

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response).to.equal(fullSupply));

    let quarterOfSupply = (await daoToken.balanceOf(deployer)).div(4);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(dealer1, quarterOfSupply);
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
      .balanceOf(governor.address)
      .then((response) =>
        expect(response.toString()).to.equal("2600000000000000000000000")
      );

    // initial vote
    let voteAmount = "200000000000000000000000"; // 200,000
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(proposal, true, voteAmount);

    await daoToken
      .balanceOf(deployer)
      .then((response) =>
        expect(response.toString()).to.equal("4900000000000000000000000")
      );
    await daoToken
      .balanceOf(dealer1)
      .then((response) =>
        expect(response.toString()).to.equal("2300000000000000000000000")
      );

    await daoToken
      .balanceOf(governor.address)
      .then((response) =>
        expect(response.toString()).to.equal("2800000000000000000000000")
      );

    // time skip
    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal).then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });

    // refund
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // check to see deployer dCLM8 balance after refund 4,900,000 + ((100,000) * 1.5) = 5,050,000
    await daoToken
      .balanceOf(deployer)
      .then((response) =>
        expect(response).to.equal("5050000000000000000000000")
      );
  });

  it("should not allow a proposer to refund anything if a vote fails", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);  // 10,000k
    expect(fullSupply).to.equal("10000000000000000000000000");
    let halfOfSupply = fullSupply.div(2); // 5,000k
    expect(halfOfSupply).to.equal("5000000000000000000000000");

    // give half supply to dealer1
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, halfOfSupply);
    await daoToken
      .balanceOf(dealer1)
      .then((response) =>
        expect(response.toString()).to.equal(halfOfSupply)
      );

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("100000000000000000000000"));

    // initial vote
    let voteAmount = "400000000000000000000000" // 400,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, false, voteAmount);

    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal("4900000000000000000000000"));
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal("4600000000000000000000000"));

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("500000000000000000000000"));

    // time skip
    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for defeat
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });

    // try to refund
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(deployer)).refund(proposal);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );

  });

  it("should not allow the proposer to top off vote", async function () {
    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);  // 10,000k
    expect(fullSupply).to.equal("10000000000000000000000000");

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);
    // the thresholdProposal was used as votes
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal("9900000000000000000000000"));

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("100000000000000000000000"));


    // try to add more votes
    let error = null;
    try {
      let voteAmount = "200000000000000000000000" // 200,000
      await governor.connect(await ethers.getSigner(deployer)).castVote(proposal, true, voteAmount);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::_castVote: proposer cannot top off vote")
    );
  });

  it("should allow a proposer to refund 3/4 stake if quorum fails", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);  // 10,000k
    expect(fullSupply).to.equal("10000000000000000000000000");
    let halfOfSupply = fullSupply.div(2); // 5,000k
    expect(halfOfSupply).to.equal("5000000000000000000000000");

    // give half supply to dealer1
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, halfOfSupply);
    await daoToken
      .balanceOf(dealer1)
      .then((response) =>
        expect(response.toString()).to.equal(halfOfSupply)
      );

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);
    // the thresholdProposal was used as votes
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal("4900000000000000000000000"));

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("100000000000000000000000"));

    // add votes from dealer1
    let voteAmount = "20000000000000000000000" // 20,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);

    // check the balances
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal("4900000000000000000000000"));
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal("4980000000000000000000000"));

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("120000000000000000000000"));

    // time skip
    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for quorum failed
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });

    // refund the original proposer
    await governor.connect(await ethers.getSigner(deployer)).refund(proposal);

    // Refund 3/4 of 100k so balance should be -25k of the initial value
    // = 4975000000000000000000000
    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal("4975000000000000000000000"));

  });


  it("should not allow a non-proposing voter to get their voted tokens back if a proposal is succeeded", async function () {

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
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    // initial vote
    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);

    await daoToken
      .balanceOf(deployer)
      .then((response) => expect(response.toString()).to.equal("4900000000000000000000000"));

    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response.toString()).to.equal("2800000000000000000000000"));

    // time skip
    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });


    // try to refund
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(proposal);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
  });

  it("should not allow a non-proposing voter to get their voted tokens back if a proposal is defeated", async function () {

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
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

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
    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });


    // try to refund
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(proposal);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
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
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
       .balanceOf(dealer1)
       .then((response) => expect(response.toString()).to.equal("2500000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    // initial dealer1 vote
    let voteAmount = "10000000000000000000000" // 10,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);


    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2610000000000000000000000"));

    // time skip
    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

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

  it("should not allow a user to get their voted tokens back after votes cancel period is ended", async function () {

    const { deployer, dealer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // check to see deployer dCLM8 balance is full
    let fullSupply = await daoToken.balanceOf(deployer);
    expect(fullSupply.toString()).to.equal("10000000000000000000000000");

    let quarterOfSupply = fullSupply.div(4);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2600000000000000000000000"));

    // initial vote
    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);

    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response.toString()).to.equal("4900000000000000000000000"));

    await daoToken
       .balanceOf(governor.address)
       .then((response) => expect(response.toString()).to.equal("2800000000000000000000000"));

    // time skip
    await advanceBlocks(hoursToBlocks(5));

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.active);
    });

    await daoToken
       .balanceOf(dealer1)
       .then((response) => expect(response.toString()).to.equal("2300000000000000000000000"));

    let refundError = null;
    // try to refund
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(proposal);
    } catch (err) {
      refundError = err.toString();
    }

    expect(refundError).to.equal(
      revertError("Governor::refund: not eligible for refund, votes cancel period is ended")
    );

    await daoToken
       .balanceOf(dealer1)
       .then((response) => expect(response.toString()).to.equal("2300000000000000000000000"));

  });

  it("should allow a proposer to cancel a proposal", async function () {

    const { deployer, dealer1, dealer2 } = await getNamedAccounts();
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
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = await createProposal({
      proposer: dealer1,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    let cancelError = null;
    try {
      await governor.connect(await ethers.getSigner(dealer2)).cancel(proposal);
    } catch (err) {
      cancelError = err.toString();
    }

    expect(cancelError).to.equal(
      revertError("Governor::cancel: you cannot cancel proposal")
    );

    await governor.connect(await ethers.getSigner(dealer1)).cancel(proposal);

    // check for canceled
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.canceled);
    });
  });

  it("should not allow a proposer to cancel a proposal after proposal cancel period is ended", async function () {

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
    let proposal = await createProposal({
      proposer: dealer1,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    // check state
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.active);
    });

    // time skip
    await advanceBlocks(hoursToBlocks(5));

    let cancelError = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).cancel(proposal);
    } catch (err) {
      cancelError = err.toString();
    }

    expect(cancelError).to.equal(
      revertError("Governor::cancel: you cannot cancel proposal, cancel period is ended")
    );

    // check state
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.active);
    });

  });

  it("should not allow a proposer to cancel a proposal if someone has voted", async function () {

    const { deployer, dealer1, dealer2 } = await getNamedAccounts();
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
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = await createProposal({
      proposer: dealer1,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, true, voteAmount);

    let cancelError = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).cancel(proposal);
    } catch (err) {
      cancelError = err.toString();
    }

    expect(cancelError).to.equal(
      revertError("Governor::cancel: you cannot cancel proposal with someone voted")
    );

  });

  it("votes and raw votes should be conformed", async function () {

    const { deployer, dealer1, dealer2 } = await getNamedAccounts();
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
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, quarterOfSupply);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(governor.address, quarterOfSupply);

    // create a proposal
    let proposal = await createProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    await advanceBlocks(2);

    // after create proposal : sqrt(100000000000000000000000) = 316227766016
    let forVotes = (await governor.proposals(proposal)).forVotes;
    let rawForVotes = (await governor.proposals(1)).rawForVotes;

    expect(rawForVotes).to.equal("100000000000000000000000");
    expect(forVotes).to.equal("316227766016");

    let voteAmount = "200000000000000000000000" // 200,000
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, voteAmount);

    // after first voting: sqrt(100000000000000000000000)
    //                   + sqrt(200000000000000000000000)
    //                   = 763441361515
    forVotes = (await governor.proposals(proposal)).forVotes;
    rawForVotes = (await governor.proposals(1)).rawForVotes;

    expect(rawForVotes).to.equal("300000000000000000000000");
    expect(forVotes).to.equal("763441361515");

    await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, true, voteAmount);

    // after second voting: sqrt(100000000000000000000000)
    //                    + sqrt(200000000000000000000000)
    //                    + sqrt(200000000000000000000000)
    //                    = 1210654957014
    forVotes = (await governor.proposals(proposal)).forVotes;
    rawForVotes = (await governor.proposals(1)).rawForVotes;

    expect(rawForVotes).to.equal("500000000000000000000000");
    expect(forVotes).to.equal("1210654957014");
  });

});
