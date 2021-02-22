const { expect } = require("chai");
const {
  deployContract,
  deployDaoContracts,
  encodeParameters
} = require("./common.js");

describe("Climate DAO - Integration tests", function() {
  it("should allow DAO token holders to transfer around tokens", async function() {
    const contracts = await deployDaoContracts();

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

  it("should allow a user with enough DAO tokens and delegated tokens to submit a proposal", async function() {
    const contracts = await deployDaoContracts();
    const netEmissionsTokenNetwork = await deployContract("NetEmissionsTokenNetwork");

    let owner = contracts.addresses[0];

    // set-up parameters for proposal external contract call
    let proposalCallParams = {
      account: netEmissionsTokenNetwork.address,
      tokenTypeId: 0,
      quantity: 3000,
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
      values: [ "0" ], // number of wei sent with message, i.e. msg.value
      signatures: ["issue"], // function in contract to call
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

    // try making proposal from before delegation
    try {
      let failedProposal = await contracts.governor.connect(owner).propose(
        proposal.targets,
        proposal.values,
        proposal.signatures,
        proposal.calldatas,
        proposal.description
      );
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert GovernorAlpha::propose: proposer votes below proposal threshold"
      );
    }

    // delegate owner DAO tokens to self
    let delegate = await contracts.daoToken.connect(owner).delegate(owner.address);

    // make proposal
    let makeProposal = await contracts.governor.connect(owner).propose(
      proposal.targets,
      proposal.values,
      proposal.signatures,
      proposal.calldatas,
      proposal.description
    );

  });
});
