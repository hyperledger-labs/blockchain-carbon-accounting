// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  advanceHours,
  createSnapshot,
  applySnapshot,
  deployContract,
  deployDaoContracts,
  encodeParameters,
  setNextBlockTimestamp
} = require("./common.js");

describe("Climate DAO - Integration tests", function() {
  
  // increase time for tests
  this.timeout(60000);

  // initialize governance contracts and create snapshot
  let allAddresses;
  let contracts;
  let snapshot;
  let owner;
  let netEmissionsTokenNetwork;
  let numOfTokens = 0;

  before(async () => {
    contracts = await deployDaoContracts();
    allAddresses = contracts.addresses;
    owner = allAddresses[0];
    snapshot = await createSnapshot();
    netEmissionsTokenNetwork = await deployContract("NetEmissionsTokenNetwork", owner.address);
  });
  beforeEach(async () => {
    // reset state of network
    await applySnapshot(snapshot);
    snapshot = await createSnapshot(); // snapshots can only be used once
  });

  async function createProposal() {

    // change timelock address
    await netEmissionsTokenNetwork.setTimelock(contracts.timelock.address);

    // set-up parameters for proposal external contract call
    let proposalCallParams = {
      account: owner.address,
      proposer: owner.address,
      tokenTypeId: 1,
      quantity: 300,
      fromDate: 0,
      thruDate: 0,
      automaticRetireDate: 0,
      metadata: "metadata",
      manifest: "manifest",
      description: "description"
    }

    // set-up proposal parameters
    let proposal = {
      targets: [netEmissionsTokenNetwork.address], // contract to call
      values: [ 0 ], // number of wei sent with call, i.e. msg.value
      signatures: ["issueFromDAO(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)"], // function in contract to call
      calldatas: [encodeParameters(
        // types of params
        ['address', 'address', 'uint8', 'uint256', 'uint256', 'uint256', 'uint256', 'string', 'string', 'string'],
        // value of params
        [
          proposalCallParams.account,
          proposalCallParams.proposer,
          proposalCallParams.tokenTypeId,
          proposalCallParams.quantity,
          proposalCallParams.fromDate,
          proposalCallParams.thruDate,
          proposalCallParams.automaticRetireDate,
          proposalCallParams.metadata,
          proposalCallParams.manifest,
          proposalCallParams.description
        ])],
      description: "Test proposal" // description of proposal
    };

    // make proposal
    let makeProposal = await contracts.governor.connect(owner).propose(
      proposal.targets,
      proposal.values,
      proposal.signatures,
      proposal.calldatas,
      proposal.description
    );
    expect(makeProposal);

    // get ID of proposal just made
    let proposalTransactionReceipt = await makeProposal.wait(0);
    let proposalEvent = proposalTransactionReceipt.events.pop();
    let proposalId = proposalEvent.args[0].toNumber();

    // verify details of proposal
    await contracts.governor.getActions(proposalId)
    .then((response) => {
      expect(response.targets).to.deep.equal(proposal.targets);
      // @TODO: response.values seems to return a function rather than a value, so check this against proposal.values
      expect(response.signatures).to.deep.equal(proposal.signatures);
      expect(response.calldatas).to.deep.equal(proposal.calldatas);
    });

    // try to execute proposal before it's been passed
    try {
      await contracts.governor.connect(owner).execute(proposalId);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::execute: proposal can only be executed if it is queued"
      );
    }

    // get proposal state
    await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(0); // pending
    });

    await advanceBlocks(1);

    // get proposal state
    await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(1); // active
    });

    return proposalId;

  }

  async function executeProposalAndConfirmSuccess(proposalId) {

    await advanceHours(48);

    // execute proposal
    let executeProposal = await contracts.governor.connect(owner).execute(proposalId);
    expect(executeProposal);

    // check num of tokens
    await netEmissionsTokenNetwork.getNumOfUniqueTokens()
    .then((response) =>
      expect(response.toString()).to.equal(String(numOfTokens+1))
    );

    numOfTokens++;

  }

  it("should allow the owner to make and pass proposals to issue CLM8 tokens to self", async function() {

    let proposalId = createProposal();

    // cast vote for proposal by owner
    let castVote = await contracts.governor.connect(owner).castVote(proposalId, true);
    expect(castVote);

    // get proposal state after vote cast
    await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(4); // passed since all votes counted
    });

    // get receipt of vote
    await contracts.governor.getReceipt(proposalId, owner.address)
    .then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
    });

    // check for success
    await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(4); // success
    });

    // queue proposal after it's successful
    let queueProposal = await contracts.governor.connect(owner).queue(proposalId);
    expect(queueProposal);

    executeProposalAndConfirmSuccess(proposalId);

  });

  it("should pass if 3/4 of token holders vote yes on a proposal", async function() {

    let quarterOfSupply = (await contracts.daoToken.balanceOf(owner.address)).div(4);

    let holderOne = allAddresses[10];
    let holderTwo = allAddresses[11];
    let holderThree = allAddresses[12];
    let holderFour = allAddresses[13];

    // transfer DAO tokens to all holders
    await contracts.daoToken.connect(owner).transfer(holderOne.address, quarterOfSupply);
    await contracts.daoToken.connect(owner).transfer(holderTwo.address, quarterOfSupply);
    await contracts.daoToken.connect(owner).transfer(holderThree.address, quarterOfSupply);
    await contracts.daoToken.connect(owner).transfer(holderFour.address, quarterOfSupply);

    let ownerbal = await contracts.daoToken.balanceOf(owner.address);
    console.log(ownerbal.toString());

    let proposalId = createProposal();

    // cast two yes votes and one no vote
    await contracts.governor.connect(holderOne).castVote(proposalId, true);
    await contracts.governor.connect(holderTwo).castVote(proposalId, true);
    await contracts.governor.connect(holderThree).castVote(proposalId, true);
    await contracts.governor.connect(holderFour).castVote(proposalId, false);

    // check for success
    await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(4); // success
    });

    // queue proposal after it's successful
    let queueProposal = await contracts.governor.connect(owner).queue(proposalId);
    expect(queueProposal);

    executeProposalAndConfirmSuccess(proposalId);

  });

  it("should fail if 1/4 of token holders vote yes on a proposal", async function() {

    let quarterOfSupply = (await contracts.daoToken.balanceOf(owner.address)).div(4);

    let holderOne = allAddresses[10];
    let holderTwo = allAddresses[11];
    let holderThree = allAddresses[12];
    let holderFour = allAddresses[13];

    // transfer DAO tokens to all holders
    await contracts.daoToken.connect(owner).transfer(holderOne.address, quarterOfSupply);
    await contracts.daoToken.connect(owner).transfer(holderTwo.address, quarterOfSupply);
    await contracts.daoToken.connect(owner).transfer(holderThree.address, quarterOfSupply);
    await contracts.daoToken.connect(owner).transfer(holderFour.address, quarterOfSupply);

    let ownerbal = await contracts.daoToken.balanceOf(owner.address);
    console.log(ownerbal.toString());

    let proposalId = createProposal();

    // cast two yes votes and one no vote
    await contracts.governor.connect(holderOne).castVote(proposalId, true);
    await contracts.governor.connect(holderTwo).castVote(proposalId, false);
    await contracts.governor.connect(holderThree).castVote(proposalId, false);
    await contracts.governor.connect(holderFour).castVote(proposalId, false);

    // check for success
    await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(3); // defeated
    });

  });

});
