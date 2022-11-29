// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { upgrades } = require("hardhat");
const { ethers } = require("./ethers-provider");

exports.upgrades = upgrades;
exports.ethers = ethers;

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

exports.proposalStates = {
  pending: 0,
  active: 1,
  canceled: 2,
  quorumFailed: 3,
  defeated: 4,
  succeeded: 5,
  queued: 6,
  expired: 7,
  executed: 8
}

exports.revertError = function(err) {
  return "Error: VM Exception while processing transaction: reverted with reason string '" + err + "'";
  // return "Error: VM Exception while processing transaction: revert " + err;
}

exports.hoursToSeconds = function (hours) {
  return (hours * 60 * 60);
}

exports.hoursToBlocks = function (hours) {
  return (hours * 80); // assuming 5s blocks similar to Governor.sol
}

exports.encodeParameters = function (types, values) {
  let abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

exports.advanceBlocks = async function (blocks) {
  console.log(`Advancing blocks: ${blocks} ...`);
  for (let i = 0; i <= blocks; i++) {
    ethers.provider.send("evm_mine");
  }
}

exports.advanceHours = async function (hours) {
  let seconds = exports.hoursToSeconds(hours);
  await ethers.provider.send("evm_increaseTime", [seconds]);
  ethers.provider.send("evm_mine"); // mine a block after
}

exports.getProposalIdFromProposalTransactionReceipt = function (receipt) {
  for (let i = 0; i < receipt.events.length; i++) {
    let e = receipt.events[i];
    if (e.event == "ProposalCreated") return e.args[0].toNumber();
  }
  return null;
};

exports.createProposal = async function (params) {
  // set-up parameters for proposal external contract call
  let proposalCallParams = {
    accountBy: params.deployer,
    accountFrom: params.deployer,
    proposer: params.proposer,
    tokenTypeId: params.tokenTypeId || 1,
    quantity: 300,
    fromDate: 0,
    thruDate: 0,
    metadata: "metadata",
    manifest: "manifest",
    description: "description",
  };

  // set-up proposal parameters
  let proposal = {
    targets: [params.netEmissionsTokenNetwork.address], // contract to call
    values: [0], // number of wei sent with call, i.e. msg.value
    signatures: [
      "issueOnBehalf(address,uint160,address,uint8,uint256,uint256,uint256,string,string,string)",
    ], // function in contract to call
    calldatas: [
      exports.encodeParameters(
        // types of params
        [
          "address",
          "uint160",
          "address",
          "uint8",
          "uint256",
          "uint256",
          "uint256",
          "string",
          "string",
          "string",
        ],
        // value of params
        [
          proposalCallParams.accountBy,
          proposalCallParams.accountFrom,
          proposalCallParams.proposer,
          proposalCallParams.tokenTypeId,
          proposalCallParams.quantity,
          proposalCallParams.fromDate,
          proposalCallParams.thruDate,
          proposalCallParams.metadata,
          proposalCallParams.manifest,
          proposalCallParams.description,
        ]
      ),
    ],
    description: "Test proposal", // description of proposal
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

  // get ID of proposal just made, find the corresponding event
  let proposalTransactionReceipt = await makeProposal.wait(0);
  let proposalId = exports.getProposalIdFromProposalTransactionReceipt(proposalTransactionReceipt);

  // verify details of proposal
  await params.governor.getActions(proposalId).then((response) => {
    expect(response.targets).to.deep.equal(proposal.targets);
    // @TODO: response.values seems to return a function rather than a value, so check this against proposal.values
    expect(response.signatures).to.deep.equal(proposal.signatures);
    expect(response.calldatas).to.deep.equal(proposal.calldatas);
  });

  // try to execute proposal before it's been passed
  let errMsg = null;
  try {
    await params.governor
      .connect(await ethers.getSigner(params.deployer))
      .execute(proposalId);
  } catch (err) {
    errMsg = err.toString();
  }
  expect(errMsg).to.equal(
    exports.revertError("Governor::execute: proposal can only be executed if it is queued")
  );

  // get proposal state
  await params.governor.state(proposalId).then((response) => {
    expect(response).to.equal(exports.proposalStates.pending);
  });

  await exports.advanceBlocks(1);

  // get proposal state
  await params.governor.state(proposalId).then((response) => {
    expect(response).to.equal(exports.proposalStates.active);
  });

  return proposalId;
};

exports.createMultiAttributeProposal = async function (params) {

  // set-up parameters for proposal external contract call
  let proposalCallParams = {
    accountBy: params.deployer,
    accountFrom: params.deployer,
    proposer: params.proposer,
    tokenTypeId: 1,
    quantity: 300,
    fromDate: 0,
    thruDate: 0,
    metadata: "metadata",
    manifest: "manifest",
    description: "parent description"
  }

  // set-up child and parent proposal parameters (don't wrap any values in arrays yet)
  let proposalParent = {
    targets: params.netEmissionsTokenNetwork.address, // contract to call
    values: 0, // number of wei sent with call, i.e. msg.value
    signatures: "issueOnBehalf(address,uint160,address,uint8,uint256,uint256,uint256,string,string,string)", // function in contract to call
    calldatas: exports.encodeParameters(
      // types of params
      ['address','uint160','address','uint8','uint256','uint256','uint256','string','string','string'],
      // value of params
      [
        proposalCallParams.accountBy,
        proposalCallParams.accountFrom,
        proposalCallParams.proposer,
        proposalCallParams.tokenTypeId,
        proposalCallParams.quantity,
        proposalCallParams.fromDate,
        proposalCallParams.thruDate,
        proposalCallParams.metadata,
        proposalCallParams.manifest,
        proposalCallParams.description
      ]),
    description: "Parent test proposal" // description of proposal
  };
  // except for the description, it doesn't really matter what we put here since child proposals are never executed
  let proposalChild = {
    targets: "0x0000000000000000000000000000000000000000", // contract to call
    values: 0, // number of wei sent with call, i.e. msg.value
    signatures: "", // function in contract to call
    calldatas: "0x",
    description: "Child test proposal" // description of proposal
  };

  // format proposals (0 => parent, 1..n => children)
  // use 1 parent and 3 children (duplicated) for this test
  let numChildren = 3
  if (params.numChildren) {
    numChildren = params.numChildren;
  }
  let _targets = [proposalParent.targets];
  let _values = [proposalParent.values];
  let _signatures = [proposalParent.signatures];
  let _calldatas = [proposalParent.calldatas];
  let _description = [proposalParent.description];
  for (let i=0; i<numChildren; i++) {
    _targets.push(proposalChild.targets);
    _values.push(proposalChild.values);
    _signatures.push(proposalChild.signatures);
    _calldatas.push(proposalChild.calldatas);
    _description.push(proposalChild.description + " " + i);
  }
  let proposal = {
    targets: _targets,
    values: _values,
    signatures: _signatures,
    calldatas: _calldatas,
    descriptions: _description
  };

  // make proposal
  let makeProposal = await params.governor
    .connect(await ethers.getSigner(params.proposer))
    .proposeMultiAttribute(
      proposal.targets,
      proposal.values,
      proposal.signatures,
      proposal.calldatas,
      proposal.descriptions
    );

  // get ID of proposal just made
  let proposalTransactionReceipt = await makeProposal.wait(0);
  let proposalId = exports.getProposalIdFromProposalTransactionReceipt(proposalTransactionReceipt);

  await exports.advanceBlocks(1);

  // get proposal state
  await params.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(exports.proposalStates.active);
    });

  return proposalId;

}


exports.executeProposalAndConfirmSuccess = async function (proposalId, params) {

  let numTokensBefore = await params.netEmissionsTokenNetwork
    .connect(await ethers.getSigner(params.deployer))
    .getNumOfUniqueTokens();

  await exports.advanceHours(49);

  // execute proposal
  let executeProposal = await params.governor
    .connect(await ethers.getSigner(params.deployer))
    .execute(proposalId);
  expect(executeProposal);

  // check num of tokens
  await params.netEmissionsTokenNetwork
    .connect(await ethers.getSigner(params.deployer))
    .getNumOfUniqueTokens()
    .then((response) =>
      expect(response.toString()).to.equal(String(numTokensBefore.add(1)))
    );

}
