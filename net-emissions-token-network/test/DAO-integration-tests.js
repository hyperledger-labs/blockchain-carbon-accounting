const { expect } = require("chai");
const {
  deployContract,
  deployDaoContracts
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

  it("should allow a user with enough DAO tokens to submit a proposal", async function() {
    const contracts = await deployDaoContracts();
    const netEmissionsTokenNetwork = await deployContract("NetEmissionsTokenNetwork");

    let owner = contracts.addresses[0];
    let DAOuser = contracts.addresses[1];


    // let proposal = {
    //   targets: [netEmissionsTokenNetwork.address], // contract to call
    //   values: [
    //     owner.address, // address to issue to
    //     0, // tokenTypeId
    //     300, // quantity
    //     0, // fromDate
    //     0, // thruDate
    //     0, // automaticRetireDate
    //     "metadata", // metadata
    //     "manifest", // manifest
    //     "description" // description
    //   ],
    //   signatures: ["issue"], // function in contract to call
    //   calldatas: [],
    //   description: "Test proposal"
    // };

    let simpleProposal = {
      targets: [netEmissionsTokenNetwork.address], // contract to call
      values: [],
      signatures: ["getNumOfUniqueTokens"], // function in contract to call
      calldatas: [],
      description: "Test NetEmissionsTokenNetwork call for getNumOfUniqueTokens"
    };

    // try making proposal from DAOuser without enough tokens
    try {
      let failedProposal = await contracts.governor.connect(DAOuser).propose(
        simpleProposal.targets,
        simpleProposal.values,
        simpleProposal.signatures,
        simpleProposal.calldatas,
        simpleProposal.description
      );
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert GovernorAlpha::propose: proposer votes below proposal threshold"
      );
    }

    // send some DAO tokens from owner to DAOuser
    let transferTokensFromOwnerToDaoUser = await contracts.daoToken.connect(owner).transfer(DAOuser.address, 100000000000000);
    expect(transferTokensFromOwnerToDaoUser);
    let transferTokensFromOwnerToDaoUserReceipt = await transferTokensFromOwnerToDaoUser.wait(1);

    // let makeProposal = await contracts.governor.connect(owner).propose(
    //   simpleProposal.targets,
    //   simpleProposal.values,
    //   simpleProposal.signatures,
    //   simpleProposal.calldatas,
    //   simpleProposal.description
    // );

  });
});
