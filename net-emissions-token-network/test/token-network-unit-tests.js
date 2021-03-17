// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const {
  allTokenTypeId,
  quantity,
  retireAmount,
  transferAmount,
  fromDate,
  thruDate,
  automaticRetireDate,
  metadata,
  manifest,
  description,
  deployContract,
  createSnapshot,
  applySnapshot
} = require("./common.js");
const { ethers } = require("./ethers-provider");

describe("Net Emissions Token Network - Unit tests", function() {

  let allAddresses;
  let snapshot;
  let contract;
  before(async () => {
    allAddresses = await ethers.getSigners();
    contract = await deployContract("NetEmissionsTokenNetwork", allAddresses[0].address);
    snapshot = await createSnapshot();
  });
  beforeEach(async () => {
    await applySnapshot(snapshot);
    snapshot = await createSnapshot(); // snapshots can only be used once
  })

  it("should auto-increment tokenId on two subsequent issuances, fail on incorrect issue calls", async function() {

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealer.address, allTokenTypeId[1]);
    expect(registerDealer);
    let registerDealerTwo = await contract.registerDealer(dealer.address, allTokenTypeId[2]);
    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);

    // check number of unique tokens before issuance
    let numUniqueTokensBefore = await contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(0));

    // try issuing with wrong tokenTypeId 
    try {
      let issueFail = await contract.connect(dealer).issue(
        consumer.address,
        "4",
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
        );
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::_issue: tokenTypeId is invalid"
      );
    }

    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[1],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);
    let issue2 = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[2],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue2);

    // check number of unique tokens after issuance
    let numUniqueTokensAfter = await contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(2));

    // Get ID of first issued token
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[2].toNumber();
    expect(tokenId).to.equal(1);

    // Get ID of second issued token
    let transactionReceipt2 = await issue2.wait(0);
    let issueEvent2 = transactionReceipt2.events.pop();
    let tokenId2 = issueEvent2.args[2].toNumber();
    expect(tokenId2).to.equal(2);

    // try getting tokenTypeId 
    try {
      let getTokenTypeFail = await contract.getTokenType((tokenId2 + 1));
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::getTokenType: tokenId does not exist"
      );
    }
  });

  it("should return the correct roles after owner assigns them", async function() {

    let owner = allAddresses[0];
    let recDealer = allAddresses[1];
    let ceoDealer = allAddresses[2];
    let aeDealer = allAddresses[3];
    let consumer = allAddresses[4];
    let unregistered = allAddresses[5];

    // register roles
    let registerRecdealer = await contract.registerDealer(recDealer.address, allTokenTypeId[0]);
    let registerCeodealer = await contract.registerDealer(ceoDealer.address, allTokenTypeId[1]);
    let registerAedealer = await contract.registerDealer(aeDealer.address, allTokenTypeId[2]);
    let registerconsumer = await contract.registerConsumer(consumer.address);
    expect(registerRecdealer);
    expect(registerCeodealer);
    expect(registerAedealer);
    expect(registerconsumer);

    // @TODO: Remove owner role from dealers
    let ownerRoles = await contract
      .getRoles(owner.address)
      .then((response) => expect(response).to.deep.equal([true, true, true, true, false]));
    let recDealerRoles = await contract
      .getRoles(recDealer.address)
      .then((response) => expect(response).to.deep.equal([false, true, false, false, false]));
    let ceoDealerRoles = await contract
      .getRoles(ceoDealer.address)
      .then((response) => expect(response).to.deep.equal([false, false, true, false, false]));
    let aeDealerRoles = await contract
      .getRoles(aeDealer.address)
      .then((response) => expect(response).to.deep.equal([false, false, false, true, false]));
    let consumerRoles = await contract
      .getRoles(consumer.address)
      .then((response) => expect(response).to.deep.equal([false, false, false, false, true]));
    let unregisteredRoles = await contract
      .getRoles(unregistered.address)
      .then((response) => expect(response).to.deep.equal([false, false, false, false, false]));

    // check assigning another dealer role to recDealer
    let registerRecdealerTwo = await contract.registerDealer(recDealer.address, allTokenTypeId[1]);
    expect(registerRecdealerTwo);
    let recDealerRolesTwo = await contract
      .getRoles(recDealer.address)
      .then((response) => expect(response).to.deep.equal([false, true, true, false, false]));

    // check unregistering that role from recDealer
    let unregisterRecdealer = await contract.unregisterDealer(recDealer.address, allTokenTypeId[1]);
    let recDealerRolesThree = await contract
      .getRoles(recDealer.address)
      .then((response) => expect(response).to.deep.equal([false, true, false, false, false]));

    // check if recDealer is dealer
    let isRecDealerDealer = await contract
      .isDealerRegistered(recDealer.address)
      .then((response) => expect(response).to.equal(true));

    // check if unregistered is dealer
    let isUnregisteredDealer = await contract
      .isDealerRegistered(unregistered.address)
      .then((response) => expect(response).to.equal(false));

  });

  it("should only allow the contract owner to register dealers", async function() {

    let owner = allAddresses[0];
    let dealer = allAddresses[1];
    let unregistered = allAddresses[2];

    // register dealer
    let registerDealer = await contract.connect(owner).registerDealer(dealer.address, allTokenTypeId[0]);
    expect(registerDealer);

    // try registering dealer of invalid tokenTypeId
    try {
      let registerInvalidTokenTypeId = await contract.connect(owner).registerDealer(unregistered.address, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::registerDealer: tokenTypeId does not exist"
      );
    }

    // try unregistering dealer of invalid tokenTypeId
    try {
      let unregisterInvalidTokenTypeId = await contract.connect(owner).unregisterDealer(unregistered.address, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::unregisterDealer: tokenTypeId does not exist"
      );
    }

    // try registering another dealer from dealer account
    try {
      let registerDealerFromDealerFail = await contract.connect(dealer).registerDealer(unregistered.address, allTokenTypeId[0]);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::onlyAdmin: msg.sender not the admin"
      );
    }

    // try registering dealer from unregistered account
    try {
      let unregisterFail = await contract.connect(unregistered).registerDealer(unregistered.address, allTokenTypeId[0]);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::onlyAdmin: msg.sender not the admin"
      );
    }

    // try unregistering self
    try {
      let unregisterSelfFail = await contract.connect(dealer).unregisterDealer(dealer.address, allTokenTypeId[0]);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::onlyAdmin: msg.sender not the admin"
      );
    }

  });

  it("should return all token details correctly", async function() {

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealer.address, allTokenTypeId[1]);
    expect(registerDealer);

    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);

    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[1],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    // Get ID of first issued token
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[2].toNumber();
    expect(tokenId).to.equal(1);

    let getTokenDetails = await contract.getTokenDetails(tokenId).then((response) => {
      // console.log(response)
      expect(response.tokenId.toNumber()).to.equal(tokenId);
      expect(response.issuer).to.equal(dealer.address);
      expect(response.issuee).to.equal(consumer.address);
      expect(response.tokenTypeId).to.equal(allTokenTypeId[1]);
      expect(response.fromDate.toNumber()).to.equal(Number(fromDate));
      expect(response.thruDate.toNumber()).to.equal(Number(thruDate));
      expect(response.automaticRetireDate.toNumber()).to.equal(Number(automaticRetireDate));
      expect(response.metadata).to.equal(metadata);
      expect(response.manifest).to.equal(manifest);
      expect(response.description).to.equal(description);
    });

    let getIssuer = await contract.getIssuer(tokenId).then((response) => {
      expect(response).to.equal(dealer.address);
    });

    // try to get token details of token that does not exist
    try {
      let getDetailsFail = await contract.connect(consumer).getTokenDetails(100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert tokenId does not exist"
      );
    }

    // try to get issuer of token that does not exist
    try {
      let getIssuerFail = await contract.connect(consumer).getIssuer(100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert tokenId does not exist"
      );
    }

  });

  it("should retire audited emissions tokens on issuance; disallow transfers", async function() {

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];

    let registerDealer = await contract.registerDealer(dealer.address, allTokenTypeId[2]);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealer).registerConsumer(consumerTwo.address);
    expect(registerConsumerTwo);

    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[2],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    // Get ID of first issued token
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[2].toNumber();
    expect(tokenId).to.equal(1);

    // Get balances of both available and retired
    let expectedAvailable = "0";
    let expectedRetire = quantity.toString();
    let afterIssuance = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailable},${expectedRetire}`));

    // Try to transfer
    try {
      let transferFail = await contract.connect(consumer).transfer(consumerTwo.address, tokenId, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

  });

  it("should fail when retire is called incorrectly", async function() {

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];
    let unregistered = allAddresses[4];

    let registerDealer = await contract.registerDealer(dealer.address, allTokenTypeId[1]);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealer).registerConsumer(consumerTwo.address);
    expect(registerConsumerTwo);

    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[1],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    // Get ID of first issued token
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[2].toNumber();
    expect(tokenId).to.equal(1);

    // retire token that does not exist
    try {
      let retireFail = await contract.connect(consumer).retire((tokenId+1), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::retire: tokenId does not exist"
      );
    }

    // retire from wrong account
    try {
      let retireFail = await contract.connect(consumerTwo).retire((tokenId), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::retire: not enough available balance to retire"
      );
    }

    // retire from unregistered account
    try {
      let retireFail = await contract.connect(unregistered).retire((tokenId), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::consumerOrDealer: msg.sender not a consumer or a dealer"
      );
    }

    // retire more than available balance
    try {
      let retireFail = await contract.connect(consumer).retire((tokenId), (quantity + 100));
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::retire: not enough available balance to retire"
      );
    }

    // retire correctly
    let beforeRetireBalances = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${quantity},${0}`));
    
    let retire = await contract.connect(consumer).retire(tokenId, retireAmount);

    let afterTransferBalances = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${(quantity - retireAmount)},${retireAmount}`));

    // get token retired amount of tokenID that does not exist
    try {
      let getRetiredFail = await contract.connect(consumer).getTokenRetiredAmount(consumer.address, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::getTokenRetiredAmount: tokenId does not exist"
      );
    }    

  });

  it("should fail when transfer is called incorrectly", async function() {

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];
    let unregistered = allAddresses[4];

    let registerDealer = await contract.registerDealer(dealer.address, allTokenTypeId[1]);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealer).registerConsumer(consumerTwo.address);
    expect(registerConsumerTwo);

    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[1],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    // Get ID of first issued token
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[2].toNumber();
    expect(tokenId).to.equal(1);

    // try transfer of token that does not exist
    try {
      let transferFail = await contract.connect(consumer).transfer(consumerTwo.address, 100, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::transfer: tokenId does not exist"
      );
    }

    // try to transfer to unregistered recipient
    try {
      let transferFail = await contract.connect(consumer).transfer(unregistered.address, tokenId, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Recipient must be consumer or dealer"
      );
    }

    // try to transfer to self
    try {
      let transferFail = await contract.connect(consumer).transfer(consumer.address, tokenId, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::transfer: sender and receiver cannot be the same"
      );
    }

  });

});
