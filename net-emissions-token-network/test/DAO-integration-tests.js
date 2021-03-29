// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  advanceBlocks,
  advanceHours,
  encodeParameters,
} = require("./common.js");
const { getNamedAccounts } = require("hardhat");

async function createProposal(params) {

  // set-up parameters for proposal external contract call
  let proposalCallParams = {
    account: params.deployer,
    proposer: params.deployer,
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
    targets: [params.netEmissionsTokenNetwork.address], // contract to call
    values: [ 0 ], // number of wei sent with call, i.e. msg.value
    signatures: ["issueFromDAO(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)"], // function in contract to call
    calldatas: [encodeParameters(
      // types of params
      ['address','address','uint8','uint256','uint256','uint256','uint256','string','string','string'],
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
  let makeProposal = await params.governor
    .connect(await ethers.getSigner(params.deployer))
    .propose(
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
  await params.governor.getActions(proposalId)
    .then((response) => {
      expect(response.targets).to.deep.equal(proposal.targets);
      // @TODO: response.values seems to return a function rather than a value, so check this against proposal.values
      expect(response.signatures).to.deep.equal(proposal.signatures);
      expect(response.calldatas).to.deep.equal(proposal.calldatas);
    });

  // try to execute proposal before it's been passed
  try {
    await params.governor
      .connect(await ethers.getSigner(params.deployer))
      .execute(proposalId);
  } catch (err) {
    expect(err.toString()).to.equal(
      "Error: VM Exception while processing transaction: revert Governor::execute: proposal can only be executed if it is queued"
    );
  }

  // get proposal state
  await params.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(0); // pending
  });

  await advanceBlocks(1);

  // get proposal state
  await params.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(1); // active
    });

  return proposalId;

}

async function executeProposalAndConfirmSuccess(proposalId, params) {

  let numTokensBefore = await params.netEmissionsTokenNetwork.getNumOfUniqueTokens();

  await advanceHours(48);

  // execute proposal
  let executeProposal = await params.governor.connect(params.deployer).execute(proposalId);
  expect(executeProposal);

  // check num of tokens
  await params.netEmissionsTokenNetwork.getNumOfUniqueTokens()
    .then((response) =>
      expect(response.toString()).to.equal(String(numTokensBefore+1))
    );

}

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
  //     expect(response).to.equal(4); // passed since all votes counted
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
  //     expect(response).to.equal(4); // success
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

    // cast two yes votes and one no vote
    await governor.connect(await ethers.getSigner(dealer1)).castVote(proposal, true);
    await governor.connect(await ethers.getSigner(dealer2)).castVote(proposal, true);
    await governor.connect(await ethers.getSigner(dealer3)).castVote(proposal, true);
    await governor.connect(await ethers.getSigner(dealer4)).castVote(proposal, false);

    // check for success
    await governor.state(proposal)
    .then((response) => {
      expect(response).to.equal(4); // success
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
  //     expect(response).to.equal(3); // defeated
  //   });

  // });

});
