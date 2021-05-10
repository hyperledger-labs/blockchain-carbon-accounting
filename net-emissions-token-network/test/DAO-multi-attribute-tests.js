// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  createMultiAttributeProposal,
  hoursToBlocks,
  proposalStates
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

    const { deployer, dealer1, dealer2, dealer3 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    let decimals = ethers.BigNumber.from("1000000000000000000");

    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, ethers.BigNumber.from("500000").mul(decimals));
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, ethers.BigNumber.from("500000").mul(decimals));
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer3, ethers.BigNumber.from("500000").mul(decimals));

    console.log("***** deployer = ", deployer);

    console.log("***** before voting *****")
    console.log(`Deployer dao token balance = ${(await daoToken.balanceOf(deployer)).div(decimals)}`);
    console.log(`Dealer1 dao token balance = ${(await daoToken.balanceOf(dealer1)).div(decimals)}`);
    console.log(`Dealer2 dao token balance = ${(await daoToken.balanceOf(dealer2)).div(decimals)}`);
    console.log(`Dealer3 dao token balance = ${(await daoToken.balanceOf(dealer3)).div(decimals)}`);

    // create a proposal
    let proposal = await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    console.log('createMultiAttributeProposal returned : ', proposal);

    console.log("***** after create proposal *****")
    console.log(`Deployer dao token balance = ${(await daoToken.balanceOf(deployer)).div(decimals)}`);

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
    // or 100,000 * decimals
    // split amongst all child proposals
    // note that accounts for 3*sqrt(100000/3) = 547.72 votes according to the current vote calculation
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      expect(response.rawVotes).to.equal("33333333333333333333333");
      expect(response.votes).to.equal("182574185835");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      expect(response.rawVotes).to.equal("33333333333333333333333");
      expect(response.votes).to.equal("182574185835");
    });
    await governor.getReceipt(4, deployer).then((response) => {
      expect(response.rawVotes).to.equal("33333333333333333333333");
      expect(response.votes).to.equal("182574185835");
    });

    // vote on parent proposal for 100 which gets split amongst all 3 child proposal
    // thus will account for 3*sqrt(100/3) = 17.32
    await governor
      .connect(await ethers.getSigner(dealer3))
      .castVote(1, true, ethers.BigNumber.from("100").mul(decimals)); // 1 is the parent proposal

    // Vote on 1st child proposal, will account for sqrt(1000) = 31.62
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(2, true, ethers.BigNumber.from("1000").mul(decimals)); // 2 is the first child proposal

    // Vote on 2nd child proposal, will account for sqrt(1000) = 31.62
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, true, ethers.BigNumber.from("1000").mul(decimals)); // 3 is the second child proposal

    console.log("***** after voting *****");
    console.log(`Deployer dao token balance = ${(await daoToken.balanceOf(deployer)).div(decimals)}`);
    console.log(`Dealer1 dao token balance = ${(await daoToken.balanceOf(dealer1)).div(decimals)}`);
    console.log(`Dealer2 dao token balance = ${(await daoToken.balanceOf(dealer2)).div(decimals)}`);
    console.log(`Dealer3 dao token balance = ${(await daoToken.balanceOf(dealer3)).div(decimals)}`);

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

    // dealer3's receipt: 100 voting tokens split evenly on 3 proposals, 0 voting tokens on parent proposal,
    // 33.33 voting tokens on each child (100/3), sqrt of which is 17.32 votes
    // - parent votes for Deployer are unchanged
    // - child votes increased by the split amount: 33333333333333333333
    // - quadratic vote : sqrt(33333333333333333333) = 5773502691
    await governor.getReceipt(1, dealer3).then((response) => {
      console.log(`1 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer3).then((response) => {
      console.log(`2 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("5773502691");
      expect(response.rawVotes).to.equal("33333333333333333333");
    });
    await governor.getReceipt(3, dealer3).then((response) => {
      console.log(`3 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("5773502691");
      expect(response.rawVotes).to.equal("33333333333333333333");
    });
    await governor.getReceipt(4, dealer3).then((response) => {
      console.log(`4 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.votes).to.equal("5773502691");
      expect(response.rawVotes).to.equal("33333333333333333333");
    });

    // dealer1 receipt: 1000 votes on proposal 2 which is the first child proposal, 0 votes on other proposals
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer1).then((response) => {
      expect(response.votes).to.equal("31622776601");
      expect(response.rawVotes).to.equal("1000000000000000000000");
    });
    await governor.getReceipt(3, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(4, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });

    // dealer2 receipt: 2000 voting tokens on proposal 3 which is the first child proposal, 0 voting tokens on other proposals
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(3, dealer2).then((response) => {
      expect(response.votes).to.equal("31622776601");
      expect(response.rawVotes).to.equal("1000000000000000000000");
    });
    await governor.getReceipt(4, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    console.log(`Parent proposal state ${await governor.state(1)}`); // Quorum Failed (3)
    console.log(`* Child 1 proposal state ${await governor.state(2)}`); // Succeed (5)
    console.log(`* Child 2 proposal state ${await governor.state(3)}`); // Succeed (5)
    console.log(`* Child 3 proposal state ${await governor.state(4)}`); // Succeed (5)

    // quorum should fail because
    // total votes is then 547.72 + 17.32 + 2*31.62 ~= 628 < 632
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });
    await governor.state(2)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });
    await governor.state(3)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });
    await governor.state(4)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });


    console.log('Refunding dealer2 proposal 3 ...');
    let dealer2Balance = (await daoToken.balanceOf(dealer2)).div(decimals);
    await governor.connect(await ethers.getSigner(dealer2)).refund(3);
    let dealer2BalanceAfterRefund = (await daoToken.balanceOf(dealer2)).div(decimals);
    expect(dealer2BalanceAfterRefund.sub(dealer2Balance)).to.equal("1000");

    console.log('Refunding dealer1 proposal 2 ...');
    let dealer1Balance = (await daoToken.balanceOf(dealer1)).div(decimals);
    await governor.connect(await ethers.getSigner(dealer1)).refund(2);
    let dealer1BalanceAfterRefund = (await daoToken.balanceOf(dealer1)).div(decimals);
    expect(dealer1BalanceAfterRefund.sub(dealer1Balance)).to.equal("1000");

    console.log('Refunding dealer3 proposal 3 ...');
    let dealer3Balance = (await daoToken.balanceOf(dealer3)).div(decimals);
    // refund only one of the child proposal for the 33 split amount
    await governor.connect(await ethers.getSigner(dealer3)).refund(3);
    let dealer3BalanceAfterRefund = (await daoToken.balanceOf(dealer3)).div(decimals);
    expect(dealer3BalanceAfterRefund.sub(dealer3Balance)).to.equal("33");
    // refund the other child proposals
    console.log('Refunding dealer3 proposal 2 ...');
    await governor.connect(await ethers.getSigner(dealer3)).refund(2);
    console.log('Refunding dealer3 proposal 4 ...');
    await governor.connect(await ethers.getSigner(dealer3)).refund(4);
    dealer3BalanceAfterRefund = (await daoToken.balanceOf(dealer3)).div(decimals);
    expect(dealer3BalanceAfterRefund.sub(dealer3Balance)).to.equal("100");

    console.log('Refunding deployer proposal 2 ...');
    let deployerBalance = (await daoToken.balanceOf(deployer)).div(decimals);
    // (100,000 * 0.75) / 3 for each child proposal = 25,000
    // Note: the refund is actually for 24999999999999999999999 so it will be "off by one"
    // also the current balance is actually off by one as well at 8400000000000000000000001
    console.log(`0 Deployer balance ${(await daoToken.balanceOf(deployer))}`)
    await governor.connect(await ethers.getSigner(deployer)).refund(2);
    console.log(`1 Deployer balance ${(await daoToken.balanceOf(deployer))}`)
    let deployerBalanceAfterRefund = (await daoToken.balanceOf(deployer)).div(decimals);
    expect(deployerBalanceAfterRefund.sub(deployerBalance)).to.equal("25000");
    await governor.connect(await ethers.getSigner(deployer)).refund(3);
    console.log(`2 Deployer balance ${(await daoToken.balanceOf(deployer))}`)
    deployerBalanceAfterRefund = (await daoToken.balanceOf(deployer)).div(decimals);
    expect(deployerBalanceAfterRefund.sub(deployerBalance)).to.equal("49999");
    await governor.connect(await ethers.getSigner(deployer)).refund(4);
    console.log(`3 Deployer balance ${(await daoToken.balanceOf(deployer))}`)
    deployerBalanceAfterRefund = (await daoToken.balanceOf(deployer)).div(decimals);
    expect(deployerBalanceAfterRefund.sub(deployerBalance)).to.equal("74999");
  });


  /* deployer makes a proposal with 2 children (eg: Socially Positive and Climate Positive).
    deployer has thresholdProposal (split 100k on each child proposal)
    dealer1 votes 200k tokens for the proposal (split 100k on each child proposal)
    dealer2 votes 500k tokens against one of the child proposal (Climate Positive) alone.

    Check votes:
    - PARENT 100k -> 316
    - P1 2*100k -> 632
    - P2 2*100k / 500k -> 632 / 707

    The proposal reaches quorum.
    The breakdown of the proposal is:
      P1 (Social)  632 votes for;
      P2 (Climate) 632 votes for, 707 votes against.
    As a result the proposal fails because P2 is rejected.
    All 3 voters' tokens are used up.
  */
  it("should reject proposal and should used up voters tokens if one child proposal is rejected and quorum is met", async function () {

    const { deployer, dealer1, dealer2 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    let decimals = ethers.BigNumber.from("1000000000000000000");

    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, ethers.BigNumber.from("500000").mul(decimals));
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, ethers.BigNumber.from("500000").mul(decimals));

    // create a proposal with 2 child proposal
    await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
      numChildren: 2
    });

    // vote on parent proposal
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(1, true, ethers.BigNumber.from("200000").mul(decimals)); // 2 is the first child proposal

    // vote against one child proposal
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, false, ethers.BigNumber.from("500000").mul(decimals)); // 3 is the second child proposal

    // check receipt of each vote, deployer has equals amount on each proposal
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.support).to.equal(false);
      expect(response.rawVotes).to.equal("0");
      expect(response.votes).to.equal("0");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("50000000000000000000000");
      expect(response.votes).to.equal("223606797749");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("50000000000000000000000");
      expect(response.votes).to.equal("223606797749");
    });
    // dealer1 voted for the whole proposal
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer1).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016");
    });
    await governor.getReceipt(3, dealer1).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016");
    });
    // dealer2 voted against the second only
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(3, dealer2).then((response) => {
      expect(response.support).to.equal(false);
      expect(response.rawVotes).to.equal("500000000000000000000000");
      expect(response.votes).to.equal("707106781186");
    });

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      expect(response.rawForVotes).to.equal("0");
      expect(response.forVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });
    await governor.proposals(2).then((response) => {
      expect(response.rawForVotes).to.equal("150000000000000000000000");
      expect(response.forVotes).to.equal("539834563765");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });
    await governor.proposals(3).then((response) => {
      expect(response.rawForVotes).to.equal("150000000000000000000000");
      expect(response.forVotes).to.equal("539834563765");
      expect(response.rawAgainstVotes).to.equal("500000000000000000000000");
      expect(response.againstVotes).to.equal("707106781186");
    });

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    console.log(`Parent proposal state ${await governor.state(1)}`);
    console.log(`* Child 1 proposal state ${await governor.state(2)}`);
    console.log(`* Child 2 proposal state ${await governor.state(3)}`);

    // proposal is rejected
    await governor.state(1)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });
    await governor.state(2)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });
    await governor.state(3)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });

  });

  /*
  deployer makes a proposal with 2 children (eg: Socially Positive and Climate Positive).
  deployer has thresholdProposal (100k) tokens split on each proposal
  dealer1 votes 50k for the first child (Climate Positive).
  dealer2 votes 50k for the second child (Socially Positive).

  This is not enough for the quorum.  The proposal is not enacted.
  deployer loses 1/4.
  The other two receive their tokens back.
  */
  it("should reject proposal and should have proposer be able to get 1/4 of tokens while other voters get 100% when the quorum is not met", async function () {

    const { deployer, dealer1, dealer2 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    let decimals = ethers.BigNumber.from("1000000000000000000");

    let dealersBalance =  ethers.BigNumber.from("500000").mul(decimals);

    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer1, dealersBalance);
    await daoToken.connect(await ethers.getSigner(deployer)).transfer(dealer2, dealersBalance);

    let deployerBalance = await daoToken.balanceOf(deployer);

    // create a proposal with 2 child proposal
    await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
      numChildren: 2
    });

    // vote on parent proposal
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(2, true, ethers.BigNumber.from("100").mul(decimals)); // 2 is the first child proposal

    // vote against one child proposal
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, true, ethers.BigNumber.from("100").mul(decimals)); // 3 is the second child proposal

    // check receipt of each vote, deployer has equals amount on each proposal
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.support).to.equal(false);
      expect(response.rawVotes).to.equal("0");
      expect(response.votes).to.equal("0");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("50000000000000000000000");
      expect(response.votes).to.equal("223606797749");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("50000000000000000000000");
      expect(response.votes).to.equal("223606797749");
    });
    // dealer1 voted for the first child proposal only
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer1).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000");
      expect(response.votes).to.equal("10000000000");
    });
    await governor.getReceipt(3, dealer1).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    // dealer2 voted for the second only
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(2, dealer2).then((response) => {
      expect(response.votes).to.equal("0");
      expect(response.rawVotes).to.equal("0");
    });
    await governor.getReceipt(3, dealer2).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000");
      expect(response.votes).to.equal("10000000000");
    });

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      expect(response.rawForVotes).to.equal("0");
      expect(response.forVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    await governor.proposals(2).then((response) => {
      expect(response.rawForVotes).to.equal("50100000000000000000000");
      // sqrt(50000000000000000000000) + sqrt(100000000000000000000)
      // = 223606797749 + 10000000000
      expect(response.forVotes).to.equal("233606797749");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    await governor.proposals(3).then((response) => {
      expect(response.rawForVotes).to.equal("50100000000000000000000");
      expect(response.forVotes).to.equal("233606797749");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    console.log(`Parent proposal state ${await governor.state(1)}`);
    console.log(`* Child 1 proposal state ${await governor.state(2)}`);
    console.log(`* Child 2 proposal state ${await governor.state(3)}`);

    // proposal is rejected because quorum failed
    await governor.state(1)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });
    await governor.state(2)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });
    await governor.state(3)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });

    // refund
    console.log("refund dealer 1 ...");
    await governor.connect(await ethers.getSigner(dealer1)).refund(2);
    console.log("refund dealer 2 ...");
    await governor.connect(await ethers.getSigner(dealer2)).refund(3);
    await daoToken
      .balanceOf(deployer)
      .then((response) => {
        console.log("deployer original balance", deployerBalance.toString());
        console.log("deployer current balance", response.toString());
        console.log("deployer balance diff", deployerBalance.sub(response).toString());
      });
    console.log("refund deployer 2 ...");
    await governor.connect(await ethers.getSigner(deployer)).refund(2);
    await daoToken
      .balanceOf(deployer)
      .then((response) => {
        console.log("deployer original balance", deployerBalance.toString());
        console.log("deployer current balance", response.toString());
        console.log("deployer balance diff", deployerBalance.sub(response).toString());
      });
    console.log("refund deployer 3 ...");
    await governor.connect(await ethers.getSigner(deployer)).refund(3);
    await daoToken
      .balanceOf(deployer)
      .then((response) => {
        console.log("deployer original balance", deployerBalance.toString());
        console.log("deployer current balance", response.toString());
        console.log("deployer balance diff", deployerBalance.sub(response).toString());
      });

    // dealer1 and 2 got refunded fully
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal(dealersBalance));
    await daoToken
      .balanceOf(dealer2)
      .then((response) => expect(response.toString()).to.equal(dealersBalance));
    // deployer lost 25k
    await daoToken
      .balanceOf(deployer)
      .then((response) => {
        console.log("deployer original balance", deployerBalance.toString());
        console.log("deployer current balance", response.toString());
        console.log("deployer balance diff", deployerBalance.sub(response).toString());
        expect(response.toString()).to.equal(deployerBalance.sub("25000000000000000000000"))
      });

  });

});
