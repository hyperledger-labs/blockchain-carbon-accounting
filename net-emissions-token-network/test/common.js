// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { upgrades } = require("hardhat");
const { ethers } = require("./ethers-provider");

exports.allTokenTypeId = [1, 2, 3];
exports.quantity = 10;
exports.transferAmount = 5;
exports.retireAmount = 3;
exports.issuerId = "issuer";
exports.recipientId = "recipient";
exports.fromDate = "1607463809";
exports.thruDate = "1607463909";
exports.metadata = "metaData";
exports.manifest = "manifest";
exports.description = "description";
exports.automaticRetireDate = "1607464809";

exports.proposalStates = {
  pending: 0,
  active: 1,
  canceled: 2,
  defeated: 3,
  succeeded: 4,
  queued: 5,
  expired: 6,
  executed: 7
}

exports.hoursToSeconds = function (hours) {
  return (hours * 60 * 60);
}

exports.hoursToBlocks = function (hours) {
  return (hours * 140); // assuming 15s blocks similar to Governor.sol
}

exports.encodeParameters = function (types, values) {
  let abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

exports.advanceBlocks = async function (blocks) {
  for (let i = 0; i <= blocks; i++) {
    ethers.provider.send("evm_mine");
  }
}

exports.advanceHours = async function (hours) {
  let seconds = exports.hoursToSeconds(hours);
  await ethers.provider.send("evm_increaseTime", [seconds]);
  ethers.provider.send("evm_mine"); // mine a block after
}

exports.createProposal = async function (params) {

  // set-up parameters for proposal external contract call
  let proposalCallParams = {
    account: params.deployer,
    proposer: params.proposer,
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
    signatures: ["issueOnBehalf(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)"], // function in contract to call
    calldatas: [exports.encodeParameters(
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
    .connect(await ethers.getSigner(params.proposer))
    .propose(
      proposal.targets,
      proposal.values,
      proposal.signatures,
      proposal.calldatas,
      proposal.description
    );

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
      expect(response).to.equal(exports.proposalStates.pending);
  });

  await exports.advanceBlocks(1);

  // get proposal state
  await params.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(exports.proposalStates.active);
    });

  return proposalId;

}

exports.executeProposalAndConfirmSuccess = async function (proposalId, params) {

  let numTokensBefore = await params.netEmissionsTokenNetwork.getNumOfUniqueTokens();

  await exports.advanceHours(48);

  // execute proposal
  let executeProposal = await params.governor.connect(params.deployer).execute(proposalId);
  expect(executeProposal);

  // check num of tokens
  await params.netEmissionsTokenNetwork.getNumOfUniqueTokens()
    .then((response) =>
      expect(response.toString()).to.equal(String(numTokensBefore+1))
    );

}
