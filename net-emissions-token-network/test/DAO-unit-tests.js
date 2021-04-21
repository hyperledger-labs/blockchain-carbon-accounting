// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  createProposal,
  hoursToBlocks,
  proposalStates
} = require("./common.js");
const { getNamedAccounts } = require("hardhat");

describe("Climate DAO - Unit tests", function() {

  // increase time for tests (block skips can take a while)
  this.timeout(60000);

  beforeEach(async () => {
    await deployments.fixture();
  });

  it("should allow DAO token holders to transfer around tokens", async function() {

    const { deployer, consumer1 } = await getNamedAccounts();
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
  });

  it("should return quorum value of ~sqrt(4% of dCLM8)", async function() {

    const { deployer, consumer1 } = await getNamedAccounts();
    const daoToken = await ethers.getContract('DAOToken');
    const governor = await ethers.getContract('Governor');

    // check initial quorum (sqrt(400k) since no circulating supply)
    await governor
      .quorumVotes()
      .then((response) => expect(response.toString()).to.equal('632455532033'));

    // send tokens from deployer to DAO user
    await daoToken
      .connect(await ethers.getSigner(deployer))
      .transfer(consumer1, '10000000000000000000000000')

    await governor
      .quorumVotes()
      .then((response) => expect(response.toString()).to.equal('632455532033'));

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

    // check to see that governor dCLM8 balance is zero
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal("0"));

  });

  it("should allow one to refund their locked dCLM8 on an active proposal", async function () {

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
    await governor.refund(1, halfOfSupply);

    // check to see deployer dCLM8 balance is full
    await daoToken
       .balanceOf(deployer)
       .then((response) => expect(response).to.equal(fullSupply));

    // check receipt
    await governor.getReceipt(proposal, deployer)
    .then((response) => {
      expect(response.hasVoted).to.equal(true);
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
        expect(response).to.equal(632455532033);
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

});
