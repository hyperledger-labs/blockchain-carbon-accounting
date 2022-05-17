// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { getNamedAccounts, deployments } = require("hardhat");
const {
  advanceBlocks,
  createMultiAttributeProposal,
  hoursToBlocks,
  proposalStates,
  revertError,
  ethers
} = require("./common.js");

describe("Climate DAO - Multi-attribute proposal tests", function() {

  // increase time for tests (block skips can take a while)
  this.timeout(60000);
  const hoursToAdvanceBlocks = 74;

  beforeEach(async () => {
    await deployments.fixture();
  });

  it("should allow a user to make a multi-attribute proposal", async function () {

    const { deployer } = await getNamedAccounts();
    await ethers.getContract('DAOToken');
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
      // accounted votes of child proposals into the parent proposal as well
      // note the total is the sum of votes cast on the child proposals so adds up to that
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("99999999999999999999999");
      expect(response.votes).to.equal("316227766016");
    });
    await governor.getReceipt(2, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("33333333333333333333333");
      expect(response.votes).to.equal("182574185835");
    });
    await governor.getReceipt(3, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("33333333333333333333333");
      expect(response.votes).to.equal("182574185835");
    });
    await governor.getReceipt(4, deployer).then((response) => {
      expect(response.support).to.equal(true);
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
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("99999999999999999999");
      expect(response.votes).to.equal("9999999999");
    });
    await governor.getReceipt(2, dealer3).then((response) => {
      console.log(`2 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("5773502691");
      expect(response.rawVotes).to.equal("33333333333333333333");
    });
    await governor.getReceipt(3, dealer3).then((response) => {
      console.log(`3 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("5773502691");
      expect(response.rawVotes).to.equal("33333333333333333333");
    });
    await governor.getReceipt(4, dealer3).then((response) => {
      console.log(`4 Deployer receipt : votes =  ${response.votes} , rawVotes = ${response.rawVotes}`);
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("5773502691");
      expect(response.rawVotes).to.equal("33333333333333333333");
    });

    // dealer1 receipt: 1000 votes on proposal 2 which is the first child proposal, 0 votes on other proposals
    await governor.getReceipt(1, dealer1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.support).to.equal(true);
      expect(response.votes).to.equal("31622776601");
      expect(response.rawVotes).to.equal("1000000000000000000000");
    });
    await governor.getReceipt(2, dealer1).then((response) => {
      expect(response.support).to.equal(true);
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
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawVotes).to.equal("1000000000000000000000");
      expect(response.votes).to.equal("31622776601");
    });
    await governor.getReceipt(2, dealer2).then((response) => {
      expect(response.rawVotes).to.equal("0");
      expect(response.votes).to.equal("0");
    });
    await governor.getReceipt(3, dealer2).then((response) => {
      expect(response.rawVotes).to.equal("1000000000000000000000");
      expect(response.votes).to.equal("31622776601");
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

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounts for the total of child votes
      expect(response.rawForVotes).to.equal("100000000000000000000000");
      expect(response.forVotes).to.equal("316227766016");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });
    await governor.proposals(2).then((response) => {
      expect(response.rawForVotes).to.equal("50000000000000000000000");
      expect(response.forVotes).to.equal("223606797749");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });
    await governor.proposals(3).then((response) => {
      expect(response.rawForVotes).to.equal("50000000000000000000000");
      expect(response.forVotes).to.equal("223606797749");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });

    // vote on parent proposal
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(1, true, ethers.BigNumber.from("200000").mul(decimals)); // 2 is the first child proposal
    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounts for the total of child votes
      expect(response.rawForVotes).to.equal("300000000000000000000000");
      // sqrt(100000) + sqrt(200000)
      expect(response.forVotes).to.equal("763441361515");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });
    await governor.proposals(2).then((response) => {
      expect(response.rawForVotes).to.equal("150000000000000000000000");
      // sqrt(50000) + sqrt(100000)
      expect(response.forVotes).to.equal("539834563765");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });
    await governor.proposals(3).then((response) => {
      expect(response.rawForVotes).to.equal("150000000000000000000000");
      expect(response.forVotes).to.equal("539834563765");
      expect(response.rawAgainstVotes).to.equal("0");
      expect(response.againstVotes).to.equal("0");
    });

    // vote against one child proposal
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, false, ethers.BigNumber.from("500000").mul(decimals)); // 3 is the second child proposal
    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounts for the total of child votes
      expect(response.rawForVotes).to.equal("300000000000000000000000");
      // sqrt(100000) + sqrt(200000)
      expect(response.forVotes).to.equal("763441361515");
      expect(response.rawAgainstVotes).to.equal("500000000000000000000000");
      expect(response.againstVotes).to.equal("707106781186");
    });
    await governor.proposals(2).then((response) => {
      expect(response.rawForVotes).to.equal("150000000000000000000000");
      // sqrt(50000) + sqrt(100000)
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

    // check receipt of each vote, deployer has equals amount on each proposal
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016");
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
      // accounted votes of child proposals into the parent proposal as well
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("200000000000000000000000");
      expect(response.votes).to.equal("447213595499");
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
      // accounted votes of child proposals into the parent proposal as well
      expect(response.support).to.equal(false);
      expect(response.rawVotes).to.equal("500000000000000000000000");
      expect(response.votes).to.equal("707106781186");
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
      // accounts for the total of child votes
      expect(response.rawForVotes).to.equal("300000000000000000000000");
      // sqrt(100000) + sqrt(200000)
      expect(response.forVotes).to.equal("763441361515");
      expect(response.rawAgainstVotes).to.equal("500000000000000000000000");
      expect(response.againstVotes).to.equal("707106781186");
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
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000000");
      expect(response.votes).to.equal("316227766016");
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
      // accounted votes of child proposals into the parent proposal as well
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000");
      expect(response.votes).to.equal("10000000000");
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
      // accounted votes of child proposals into the parent proposal as well
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("100000000000000000000");
      expect(response.votes).to.equal("10000000000");
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
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("100200000000000000000000");
      //sqrt(100000)+sqrt(100)+sqrt(100)
      expect(response.forVotes).to.equal("336227766016");
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


  it("should not meet quorum just because the proposer votes are split into enough child proposals, refund on the parent should refund all children", async function () {

    const { deployer } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');
    const netEmissionsTokenNetwork = await ethers.getContract('NetEmissionsTokenNetwork');

    // create a proposal with 2 child proposal
    await createMultiAttributeProposal({
      proposer: deployer,
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
      numChildren: 10
    });

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("100000000000000000000000");
      expect(response.forVotes).to.equal("316227766016");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    for (let i=1; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("10000000000000000000000");
        expect(response.forVotes).to.equal("100000000000");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // proposal is rejected because quorum failed
    await governor.state(1)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });
    for (let i=1; i<=10; i++) {
      await governor.state(1+i)
      .then((response) => {
        expect(response).to.equal(proposalStates.succeeded);
      });
    }

    // Refund on the parent should refund all child proposals as well
    // here 75% is refunded since Quorum failed
    let currentBalance = (await daoToken.balanceOf(deployer));
    expect(currentBalance).to.equal("9900000000000000000000000");
    await governor.connect(await ethers.getSigner(deployer)).refund(1);
    let balanceAfterRefund = (await daoToken.balanceOf(deployer));
    // refund amount should be 100000000000000000000000 * 0.75
    expect(balanceAfterRefund.sub(currentBalance)).to.equal("75000000000000000000000");
  });

  it("should allow refund on child proposal or parent proposal which refund all child proposals, for succeeded proposal", async function () {

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
      numChildren: 10
    });

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("100000000000000000000000");
      expect(response.forVotes).to.equal("316227766016");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    for (let i=1; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("10000000000000000000000");
        expect(response.forVotes).to.equal("100000000000");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    // dealer1 votes 200k on the whole proposal (parent)
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(1, true, ethers.BigNumber.from("200000").mul(decimals));
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("200000000000000000000000");
      expect(response.votes).to.equal("447213595499");
    });
    for (let i=1; i<=10; i++) {
      await governor.getReceipt(1+i, dealer1).then((response) => {
        expect(response.support).to.equal(true);
        expect(response.rawVotes).to.equal("20000000000000000000000");
        expect(response.votes).to.equal("141421356237");
      });
    }
    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("300000000000000000000000");
      // 200k + 100k -> 447213595499 + 316227766016
      expect(response.forVotes).to.equal("763441361515");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    for (let i=1; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("30000000000000000000000");
        // 20k + 10k -> 141421356237 + 100000000000
        expect(response.forVotes).to.equal("241421356237");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    // dealer2 votes 20k on the child 2 and 3
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(2, true, ethers.BigNumber.from("20000").mul(decimals));
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, true, ethers.BigNumber.from("20000").mul(decimals));
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("40000000000000000000000");
      expect(response.votes).to.equal("200000000000");
    });
    // first 2 child
    for (let i=1; i<=2; i++) {
      await governor.getReceipt(1+i, dealer2).then((response) => {
        expect(response.support).to.equal(true);
        expect(response.rawVotes).to.equal("20000000000000000000000");
        expect(response.votes).to.equal("141421356237");
      });
    }
    // rest
    for (let i=3; i<=10; i++) {
      await governor.getReceipt(1+i, dealer2).then((response) => {
        expect(response.rawVotes).to.equal("0");
        expect(response.votes).to.equal("0");
      });
    }
    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("340000000000000000000000");
      // 200k + 100k + 40k -> 447213595499 + 316227766016 + 200000000000
      expect(response.forVotes).to.equal("963441361515");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    // first 2 child
    for (let i=1; i<=2; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("50000000000000000000000");
        // 20k + 10k + 20k -> 141421356237 + 100000000000 + 141421356237
        expect(response.forVotes).to.equal("382842712474");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }
    // rest unchanged
    for (let i=3; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("30000000000000000000000");
        // 20k + 10k -> 141421356237 + 100000000000
        expect(response.forVotes).to.equal("241421356237");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // proposal succeeds because 963441361515 > quorum threshold
    await governor.state(1)
    .then((response) => {
      expect(response).to.equal(proposalStates.succeeded);
    });
    for (let i=1; i<=10; i++) {
      await governor.state(1+i)
      .then((response) => {
        expect(response).to.equal(proposalStates.succeeded);
      });
    }

    // proposer refund, since proposal succeeded should refund 150%
    console.log("Start deployer refund ...");
    let currentBalance = (await daoToken.balanceOf(deployer));
    // current balance Full balance - 100k - 1,000k distributed to dealers
    expect(currentBalance).to.equal("8900000000000000000000000");
    // first try refunding one child (10)
    await governor.connect(await ethers.getSigner(deployer)).refund(10);
    let balanceAfterRefund = (await daoToken.balanceOf(deployer));
    // refund amount should be 10000000000000000000000 * 1.5
    expect(balanceAfterRefund.sub(currentBalance)).to.equal("15000000000000000000000");
    // check the refund has been properly accounted in the receipt and proposal votes
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.support).to.equal(true);
      // initial 100k minus the 10k refund (bonus does not count)
      expect(response.rawVotes).to.equal("90000000000000000000000");
      expect(response.votes).to.equal("300000000000");
    });
    await governor.getReceipt(10, deployer).then((response) => {
      expect(response.rawVotes).to.equal("0");
      expect(response.votes).to.equal("0");
    });
    for (let i=2; i<=11; i++) {
      await governor.getReceipt(i, deployer).then((response) => {
        if (i != 10) {
          // unchanged
          expect(response.support).to.equal(true);
          expect(response.rawVotes).to.equal("10000000000000000000000");
          expect(response.votes).to.equal("100000000000");
        }
      });
    }

    // refund on the main proposal should refund the rest
    await governor.connect(await ethers.getSigner(deployer)).refund(1);
    balanceAfterRefund = (await daoToken.balanceOf(deployer));
    expect(balanceAfterRefund.sub(currentBalance)).to.equal("150000000000000000000000");
    // trying to refund another child should fail
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(deployer)).refund(5);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: already refunded this proposal")
    );
    console.log("Done deployer refunds.");

    // dealer1 refund the parent directly, should fail because proposal succeeded and dealer1 is not the proposer
    // so nothing to refund
    console.log("Start dealer1 refund ...");
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(1);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
    console.log("Done dealer1 refunds.");

    // dealer2 refund child 2, same error should occur
    console.log("Start dealer2 refund ...");
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer2)).refund(2);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
    console.log("Done dealer2 refunds.");

  });

  it("should allow refund on child proposal or parent proposal which refund all child proposals, for quorum failed proposal", async function () {

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
      numChildren: 10
    });

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("100000000000000000000000");
      expect(response.forVotes).to.equal("316227766016");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    for (let i=1; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("10000000000000000000000");
        expect(response.forVotes).to.equal("100000000000");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    // dealer1 votes 20k on the whole proposal (parent)
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(1, true, ethers.BigNumber.from("20000").mul(decimals));
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("20000000000000000000000");
      expect(response.votes).to.equal("141421356237");
    });
    for (let i=1; i<=10; i++) {
      await governor.getReceipt(1+i, dealer1).then((response) => {
        expect(response.support).to.equal(true);
        expect(response.rawVotes).to.equal("2000000000000000000000");
        expect(response.votes).to.equal("44721359549");
      });
    }
    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("120000000000000000000000");
      // 20k + 100k -> 141421356237 + 316227766016
      expect(response.forVotes).to.equal("457649122253");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    for (let i=1; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("12000000000000000000000");
        // 2k + 10k -> 44721359549 + 100000000000
        expect(response.forVotes).to.equal("144721359549");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    // dealer2 votes 15k on the child 2 and 3
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(2, true, ethers.BigNumber.from("15000").mul(decimals));
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, true, ethers.BigNumber.from("15000").mul(decimals));
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.support).to.equal(true);
      expect(response.rawVotes).to.equal("30000000000000000000000");
      expect(response.votes).to.equal("173205080756");
    });
    // first 2 child
    for (let i=1; i<=2; i++) {
      await governor.getReceipt(1+i, dealer2).then((response) => {
        expect(response.support).to.equal(true);
        expect(response.rawVotes).to.equal("15000000000000000000000");
        expect(response.votes).to.equal("122474487139");
      });
    }
    // rest
    for (let i=3; i<=10; i++) {
      await governor.getReceipt(1+i, dealer2).then((response) => {
        expect(response.rawVotes).to.equal("0");
        expect(response.votes).to.equal("0");
      });
    }
    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("150000000000000000000000");
      // 20k + 100k + 30k -> 141421356237 + 316227766016 + 173205080756
      expect(response.forVotes).to.equal("630854203009");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    // first 2 child
    for (let i=1; i<=2; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("27000000000000000000000");
        // 2k + 10k + 15k -> 44721359549 + 100000000000 + 122474487139
        expect(response.forVotes).to.equal("267195846688");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }
    // rest unchanged
    for (let i=3; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("12000000000000000000000");
        // 2k + 10k -> 44721359549 + 100000000000
        expect(response.forVotes).to.equal("144721359549");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // proposal succeeds because 630854203009 < quorum threshold
    await governor.state(1)
    .then((response) => {
      expect(response).to.equal(proposalStates.quorumFailed);
    });
    for (let i=1; i<=10; i++) {
      await governor.state(1+i)
      .then((response) => {
        expect(response).to.equal(proposalStates.succeeded);
      });
    }

    // proposer refund, since proposal succeeded should refund 150%
    console.log("Start deployer refund ...");
    let currentBalance = (await daoToken.balanceOf(deployer));
    // current balance Full balance - 100k - 1,000k distributed to dealers
    expect(currentBalance).to.equal("8900000000000000000000000");
    // first try refunding one child (10)
    await governor.connect(await ethers.getSigner(deployer)).refund(10);
    let balanceAfterRefund = (await daoToken.balanceOf(deployer));
    // refund amount should be 10000000000000000000000 * 0.75
    expect(balanceAfterRefund.sub(currentBalance)).to.equal("7500000000000000000000");
    // check the refund has been properly accounted in the receipt and proposal votes
    await governor.getReceipt(1, deployer).then((response) => {
      expect(response.support).to.equal(true);
      // initial 100k minus the 10k refund=ed before (malus does not count)
      expect(response.rawVotes).to.equal("90000000000000000000000");
      expect(response.votes).to.equal("300000000000");
    });
    await governor.getReceipt(10, deployer).then((response) => {
      expect(response.rawVotes).to.equal("0");
      expect(response.votes).to.equal("0");
    });
    for (let i=2; i<=11; i++) {
      await governor.getReceipt(i, deployer).then((response) => {
        if (i != 10) {
          // unchanged
          expect(response.support).to.equal(true);
          expect(response.rawVotes).to.equal("10000000000000000000000");
          expect(response.votes).to.equal("100000000000");
        }
      });
    }

    // refund on the main proposal should refund the rest
    await governor.connect(await ethers.getSigner(deployer)).refund(1);
    balanceAfterRefund = (await daoToken.balanceOf(deployer));
    expect(balanceAfterRefund.sub(currentBalance)).to.equal("75000000000000000000000");
    // trying to refund another child should fail
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(deployer)).refund(5);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: already refunded this proposal")
    );
    console.log("Done deployer refunds.");

    // dealer1 refund the parent directly
    console.log("Start dealer1 refund ...");
    await governor.connect(await ethers.getSigner(dealer1)).refund(1);
    // all receipts should be refunded
    for (let i=1; i<=11; i++) {
      await governor.getReceipt(i, dealer1).then((response) => {
        expect(response.rawVotes).to.equal("0");
        expect(response.votes).to.equal("0");
      });
    }
    // trying to refund the parent again should fail
    console.log("Start dealer1 refund try again ?...");
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(1);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: already refunded this proposal")
    );
    console.log("Done dealer1 refunds.");

    // dealer2 refund both child 2 and 3
    console.log("Start dealer2 refund ...");
    await governor.connect(await ethers.getSigner(dealer2)).refund(2);
    await governor.connect(await ethers.getSigner(dealer2)).refund(3);
    // all receipts should be refunded
    for (let i=1; i<=11; i++) {
      await governor.getReceipt(i, dealer2).then((response) => {
        expect(response.rawVotes).to.equal("0");
        expect(response.votes).to.equal("0");
      });
    }
    // trying to refund the parent should fail
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer2)).refund(1);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: already refunded this proposal")
    );
    console.log("Done dealer2 refunds.");

  });

  it("should not allow refund on child proposal or parent proposal, for defeated proposal", async function () {

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
      numChildren: 10
    });

    // check the proposal votes
    await governor.proposals(1).then((response) => {
      // accounted votes of child proposals into the parent proposal as well
      expect(response.rawForVotes).to.equal("100000000000000000000000");
      expect(response.forVotes).to.equal("316227766016");
      expect(response.againstVotes).to.equal("0");
      expect(response.rawAgainstVotes).to.equal("0");
    });
    for (let i=1; i<=10; i++) {
      await governor.proposals(1+i).then((response) => {
        expect(response.rawForVotes).to.equal("10000000000000000000000");
        expect(response.forVotes).to.equal("100000000000");
        expect(response.againstVotes).to.equal("0");
        expect(response.rawAgainstVotes).to.equal("0");
      });
    }

    // dealer1 votes 200k against on the whole proposal (parent)
    await governor
      .connect(await ethers.getSigner(dealer1))
      .castVote(1, false, ethers.BigNumber.from("200000").mul(decimals));
    await governor.getReceipt(1, dealer1).then((response) => {
      expect(response.support).to.equal(false);
      expect(response.rawVotes).to.equal("200000000000000000000000");
      expect(response.votes).to.equal("447213595499");
    });
    for (let i=1; i<=10; i++) {
      await governor.getReceipt(1+i, dealer1).then((response) => {
        expect(response.support).to.equal(false);
        expect(response.rawVotes).to.equal("20000000000000000000000");
        expect(response.votes).to.equal("141421356237");
      });
    }

    // dealer2 votes 20k against on the child 2 and 3
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(2, false, ethers.BigNumber.from("20000").mul(decimals));
    await governor
      .connect(await ethers.getSigner(dealer2))
      .castVote(3, false, ethers.BigNumber.from("20000").mul(decimals));
    await governor.getReceipt(1, dealer2).then((response) => {
      expect(response.support).to.equal(false);
      expect(response.rawVotes).to.equal("40000000000000000000000");
      expect(response.votes).to.equal("200000000000");
    });
    // first 2 child
    for (let i=1; i<=2; i++) {
      await governor.getReceipt(1+i, dealer2).then((response) => {
        expect(response.support).to.equal(false);
        expect(response.rawVotes).to.equal("20000000000000000000000");
        expect(response.votes).to.equal("141421356237");
      });
    }

    await advanceBlocks(hoursToBlocks(hoursToAdvanceBlocks));

    // proposal defeated
    await governor.state(1)
    .then((response) => {
      expect(response).to.equal(proposalStates.defeated);
    });

    // attempt to refund on the parent proposal
    let error = null;
    try {
      await governor.connect(await ethers.getSigner(deployer)).refund(1);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer1)).refund(1);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );

    // attempts to refund on children
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer2)).refund(2);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
    error = null;
    try {
      await governor.connect(await ethers.getSigner(dealer2)).refund(3);
    } catch (err) {
      error = err.toString();
    }
    expect(error).to.equal(
      revertError("Governor::refund: not eligible for refund")
    );
  });
});
