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
  let contracts;
  let snapshot;
  let initialState;

  before(async () => {
    contracts = await deployDaoContracts();
    snapshot = await createSnapshot();
    initialState = snapshot;
  });
  beforeEach(async () => {
    // reset state of network
    await applySnapshot(snapshot);
    snapshot = await createSnapshot(); // snapshots can only be used once
  });

  it("should allow the owner to make and pass proposals to issue net emissions tokens to self", async function() {
    // deploy NetEmissionsTokenNetwork
    const netEmissionsTokenNetwork = await deployContract("NetEmissionsTokenNetwork");

    let owner = contracts.addresses[0];

    // grant role of dealer to Timelock contract
    const grantDealerRoleToTimelock = await netEmissionsTokenNetwork.connect(owner).registerDealer(contracts.timelock.address,1);
    expect(grantDealerRoleToTimelock);

    // set-up parameters for proposal external contract call
    let proposalCallParams = {
      account: owner.address,
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
      signatures: ["issue(address,uint8,uint256,uint256,uint256,uint256,string,string,string)"], // function in contract to call
      calldatas: [encodeParameters(
        // types of params
        ['address', 'uint8', 'uint256', 'uint256', 'uint256', 'uint256', 'string', 'string', 'string'],
        // value of params
        [
          proposalCallParams.account,
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
    let getActions = await contracts.governor.getActions(proposalId)
    .then((response) => {
      expect(response.targets).to.deep.equal(proposal.targets);
      // @TODO: response.values seems to return a function rather than a value, so check this against proposal.values
      expect(response.signatures).to.deep.equal(proposal.signatures);
      expect(response.calldatas).to.deep.equal(proposal.calldatas);
    });

    // try to execute proposal before it's been passed
    try {
      let failedProposalExecute = await contracts.governor.connect(owner).execute(proposalId);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Governor::execute: proposal can only be executed if it is queued"
      );
    }

    // get proposal state
    let proposalStateBefore = await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(0); // pending
    });

    // cast vote for proposal by owner
    await advanceBlocks(1);
    let castVote = await contracts.governor.connect(owner).castVote(proposalId, true);
    expect(castVote);

    // get proposal state after vote cast
    let proposalStateAfterVote = await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(4); // passed since all votes counted
    });

    // get receipt of vote
    let getReceipt = await contracts.governor.getReceipt(proposalId, owner.address)
    .then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
    });

    // queue proposal after it's successful
    let queueProposal = await contracts.governor.connect(owner).queue(proposalId);
    expect(queueProposal);

    await advanceHours(48);
    const numOfNetEmissionsTokensBeforeProposalExecution = await netEmissionsTokenNetwork.getNumOfUniqueTokens()
    .then((response) =>
      expect(response.toString()).to.equal('0')
    );
    let executeProposal = await contracts.governor.connect(owner).execute(proposalId);
    expect(executeProposal);
    const numOfNetEmissionsTokensAfterProposalExecution = await netEmissionsTokenNetwork.getNumOfUniqueTokens()
    .then((response) =>
      expect(response.toString()).to.equal('1')
    );

  });

});
