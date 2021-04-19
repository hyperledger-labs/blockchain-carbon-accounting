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

  it("should return quorum value of 4% of votes not held by owner", async function() {

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
      deployer: deployer,
      governor: governor,
      netEmissionsTokenNetwork: netEmissionsTokenNetwork,
    });

    advanceBlocks(2);

    // @TODO: implement staking when a proposal is made
    // check to see that deployer dCLM8 balance is lower
    // check to see that governor dCLM8 balance is higher

    // cast vote from dealer1
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true, halfOfSupply);

    // check to see that dealer1 dCLM8 balance is zero
    await daoToken
      .balanceOf(dealer1)
      .then((response) => expect(response.toString()).to.equal("0"));

    // check to see that governor dCLM8 balance is higher
    await daoToken
      .balanceOf(governor.address)
      .then((response) => expect(response).to.equal(halfOfSupply));

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

});
