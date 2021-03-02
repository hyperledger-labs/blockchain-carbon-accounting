const { expect } = require("chai");
const {
  advanceBlocks,
  advanceHours,
  createSnapshot,
  applySnapshot,
  deployContract,
  deployDaoContracts,
  encodeParameters
} = require("./common.js");

describe("Climate DAO - Integration tests", function() {
  
  // increase time for tests
  this.timeout(60000);

  // initialize governance contracts and create snapshot
  var contracts;
  var snapshot;

  before(async () => {
    contracts = await deployDaoContracts();
    snapshot = await createSnapshot();
  });

  beforeEach(async () => {
    // reset state of network
    applySnapshot(snapshot);
  });

  it("should allow DAO token holders to transfer around tokens", async function() {

    let owner = contracts.addresses[0];
    let DAOuser = contracts.addresses[1];

    // check balance of owner before transfer (right after deployment)
    let balanceOfOwnerBeforeTransfer = await contracts.daoToken
      .balanceOf(owner.address)
      .then((response) => expect(response.toString()).to.equal('10000000000000000000000000'));

    // check balance of DAOuser before transfer
    let balanceOfDaoUserBeforeTransfer = await contracts.daoToken
      .balanceOf(DAOuser.address)
      .then((response) => expect(response.toString()).to.equal('0'));

    // send some DAO tokens from owner to DAOuser
    let transferTokensFromOwnerToDaoUser = await contracts.daoToken.connect(owner).transfer(DAOuser.address, 1000000);
    expect(transferTokensFromOwnerToDaoUser);

    // check balance of owner after transfer
    let balanceOfOwnerAfterTransfer = await contracts.daoToken
      .balanceOf(owner.address)
      .then((response) => expect(response.toString()).to.equal('9999999999999999999000000'));

    // check balance of DAOuser after transfer
    let balanceOfDaoUserAfterTransfer = await contracts.daoToken
      .balanceOf(DAOuser.address)
      .then((response) => expect(response.toString()).to.equal('1000000'));

  });

  it("should allow the owner to make and vote on proposals without other users", async function() {
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
        "Error: VM Exception while processing transaction: revert GovernorAlpha::execute: proposal can only be executed if it is queued"
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
      expect(response).to.equal(1); // active
    });

    // get receipt of vote
    let getReceipt = await contracts.governor.getReceipt(proposalId, owner.address)
    .then((response) => {
      expect(response.hasVoted).to.equal(true);
      expect(response.support).to.equal(true);
    });

    console.log("Skipping blocks after creating and voting on proposal to call issue() on NetEmissionsTokenNetwork...")
    await advanceBlocks(20000);

    // get proposal state after advance blocks
    let proposalStateAfterAdvanceBlocks = await contracts.governor.state(proposalId)
    .then((response) => {
      expect(response).to.equal(4); // succeeded
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
