// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { getNamedAccounts } = require("hardhat");
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
} = require("./common.js");
const { ethers } = require("./ethers-provider");

describe("Net Emissions Token Network - Unit tests", function() {

  let contract;
  beforeEach(async () => {
    await deployments.fixture();
    contract = await ethers.getContract('NetEmissionsTokenNetwork');
  });

  it("should auto-increment tokenId on two subsequent issuances, fail on incorrect issue calls", async function() {

    const { dealer1, consumer1 } = await getNamedAccounts();

    await contract.registerDealer(dealer1, allTokenTypeId[1]);
    await contract.registerDealer(dealer1, allTokenTypeId[2]);
    let registerConsumer = await contract
      .connect(await ethers.getSigner(dealer1))
      .registerConsumer(consumer1);
    expect(registerConsumer);

    // check number of unique tokens before issuance
    await contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(0));

    // try issuing with wrong tokenTypeId 
    try {
      await contract
        .connect(await ethers.getSigner(dealer1))
        .issue(
          consumer1,
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
      .connect(await ethers.getSigner(dealer1))
      .issue(
        consumer1,
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
      .connect(await ethers.getSigner(dealer1))
      .issue(
        consumer1,
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
    await contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(2));

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
      await contract.getTokenType((tokenId2 + 1));
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::getTokenType: tokenId does not exist"
      );
    }
  });

  it("should return the correct roles after owner assigns them", async function() {

    const { deployer, dealer1, dealer2, dealer3, consumer1, unregistered } = await getNamedAccounts();

    // register roles
    let registerRecdealer = await contract.registerDealer(dealer1, allTokenTypeId[0]);
    let registerCeodealer = await contract.registerDealer(dealer2, allTokenTypeId[1]);
    let registerAedealer = await contract.registerDealer(dealer3, allTokenTypeId[2]);
    let registerconsumer = await contract.registerConsumer(consumer1);
    expect(registerRecdealer);
    expect(registerCeodealer);
    expect(registerAedealer);
    expect(registerconsumer);

    // @TODO: Remove owner role from dealers
    await contract
      .getRoles(deployer)
      .then((response) => expect(response).to.deep.equal([true, true, true, true, false]));
    await contract
      .getRoles(dealer1)
      .then((response) => expect(response).to.deep.equal([false, true, false, false, false]));
    await contract
      .getRoles(dealer2)
      .then((response) => expect(response).to.deep.equal([false, false, true, false, false]));
    await contract
      .getRoles(dealer3)
      .then((response) => expect(response).to.deep.equal([false, false, false, true, false]));
    await contract
      .getRoles(consumer1)
      .then((response) => expect(response).to.deep.equal([false, false, false, false, true]));
    await contract
      .getRoles(unregistered)
      .then((response) => expect(response).to.deep.equal([false, false, false, false, false]));

    // check assigning another dealer role to recDealer
    let registerRecdealerTwo = await contract.registerDealer(dealer1, allTokenTypeId[1]);
    expect(registerRecdealerTwo);
    await contract
      .getRoles(dealer1)
      .then((response) => expect(response).to.deep.equal([false, true, true, false, false]));

    // check unregistering that role from recDealer
    await contract.unregisterDealer(dealer1, allTokenTypeId[1]);
    await contract
      .getRoles(dealer1)
      .then((response) => expect(response).to.deep.equal([false, true, false, false, false]));

    // check if recDealer is dealer
    await contract
      .isDealerRegistered(dealer1)
      .then((response) => expect(response).to.equal(true));

    // check if unregistered is dealer
    await contract
      .isDealerRegistered(unregistered)
      .then((response) => expect(response).to.equal(false));

  });

  it("should only allow the contract owner to register dealers", async function() {

    const { deployer, dealer1, unregistered } = await getNamedAccounts();

    // register dealer
    let registerDealer = await contract.connect(await ethers.getSigner(deployer)).registerDealer(dealer1, allTokenTypeId[0]);
    expect(registerDealer);

    // try registering dealer of invalid tokenTypeId
    try {
      await contract.connect(await ethers.getSigner(deployer)).registerDealer(unregistered, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::registerDealer: tokenTypeId does not exist"
      );
    }

    // try unregistering dealer of invalid tokenTypeId
    try {
      await contract.connect(await ethers.getSigner(deployer)).unregisterDealer(unregistered, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::unregisterDealer: tokenTypeId does not exist"
      );
    }

    // try registering another dealer from dealer account
    try {
      await contract.connect(await ethers.getSigner(dealer1)).registerDealer(unregistered, allTokenTypeId[0]);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::onlyAdmin: msg.sender not the admin"
      );
    }

    // try registering dealer from unregistered account
    try {
      await contract.connect(await ethers.getSigner(unregistered)).registerDealer(unregistered, allTokenTypeId[0]);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::onlyAdmin: msg.sender not the admin"
      );
    }

    // try unregistering self
    try {
      await contract.connect(await ethers.getSigner(dealer1)).unregisterDealer(dealer1, allTokenTypeId[0]);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::onlyAdmin: msg.sender not the admin"
      );
    }

  });

  it("should return all token details correctly", async function() {

    const { dealer1, consumer1 } = await getNamedAccounts();

    let registerDealer = await contract.registerDealer(dealer1, allTokenTypeId[1]);
    expect(registerDealer);

    let registerConsumer = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer1);
    expect(registerConsumer);

    let issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        consumer1,
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

    await contract.getTokenDetails(tokenId).then((response) => {
      expect(response.tokenId.toNumber()).to.equal(tokenId);
      expect(response.issuer).to.equal(dealer1);
      expect(response.issuee).to.equal(consumer1);
      expect(response.tokenTypeId).to.equal(allTokenTypeId[1]);
      expect(response.fromDate.toNumber()).to.equal(Number(fromDate));
      expect(response.thruDate.toNumber()).to.equal(Number(thruDate));
      expect(response.automaticRetireDate.toNumber()).to.equal(Number(automaticRetireDate));
      expect(response.metadata).to.equal(metadata);
      expect(response.manifest).to.equal(manifest);
      expect(response.description).to.equal(description);
    });

    await contract.getIssuer(tokenId).then((response) => {
      expect(response).to.equal(dealer1);
    });

    // try to get token details of token that does not exist
    try {
      await contract.connect(await ethers.getSigner(consumer1)).getTokenDetails(100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert tokenId does not exist"
      );
    }

    // try to get issuer of token that does not exist
    try {
      await contract.connect(await ethers.getSigner(consumer1)).getIssuer(100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert tokenId does not exist"
      );
    }

  });

  it("should retire audited emissions tokens on issuance; disallow transfers", async function() {

    const { dealer1, consumer1, consumer2 } = await getNamedAccounts();

    let registerDealer = await contract.registerDealer(dealer1, allTokenTypeId[2]);
    expect(registerDealer);
    let registerConsumer = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer1);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer2);
    expect(registerConsumerTwo);

    let issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        consumer1,
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
    await contract
      .getAvailableAndRetired(consumer1, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailable},${expectedRetire}`));

    // Try to transfer
    try {
      await contract.connect(await ethers.getSigner(consumer1)).transfer(consumer2, tokenId, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

  });

  it("should fail when retire is called incorrectly", async function() {

    const { dealer1, consumer1, consumer2, unregistered } = await getNamedAccounts();

    let registerDealer = await contract.registerDealer(dealer1, allTokenTypeId[1]);
    expect(registerDealer);
    let registerConsumer = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer1);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer2);
    expect(registerConsumerTwo);

    let issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        consumer1,
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
      await contract.connect(await ethers.getSigner(consumer1)).retire((tokenId+1), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::retire: tokenId does not exist"
      );
    }

    // retire from wrong account
    try {
      await contract.connect(await ethers.getSigner(consumer2)).retire((tokenId), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::retire: not enough available balance to retire"
      );
    }

    // retire from unregistered account
    try {
      await contract.connect(await ethers.getSigner(unregistered)).retire((tokenId), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::consumerOrDealer: msg.sender not a consumer or a dealer"
      );
    }

    // retire more than available balance
    try {
      await contract.connect(await ethers.getSigner(consumer1)).retire((tokenId), (quantity + 100));
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::retire: not enough available balance to retire"
      );
    }

    // retire correctly
    await contract
      .getAvailableAndRetired(consumer1, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${quantity},${0}`));

    await contract.connect(await ethers.getSigner(consumer1)).retire(tokenId, retireAmount);

    await contract
      .getAvailableAndRetired(consumer1, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${(quantity - retireAmount)},${retireAmount}`));

    // get token retired amount of tokenID that does not exist
    try {
      await contract.connect(await ethers.getSigner(consumer1)).getTokenRetiredAmount(consumer1, 100);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::getTokenRetiredAmount: tokenId does not exist"
      );
    }

  });

  it("should fail when transfer is called incorrectly", async function() {

    const { dealer1, consumer1, consumer2, unregistered } = await getNamedAccounts();

    let registerDealer = await contract.registerDealer(dealer1, allTokenTypeId[1]);
    expect(registerDealer);
    let registerConsumer = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer1);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(await ethers.getSigner(dealer1)).registerConsumer(consumer2);
    expect(registerConsumerTwo);

    let issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        consumer1,
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
      await contract.connect(await ethers.getSigner(consumer1)).transfer(consumer2, 100, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::transfer: tokenId does not exist"
      );
    }

    // try to transfer to unregistered recipient
    try {
      await contract.connect(await ethers.getSigner(consumer1)).transfer(unregistered, tokenId, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Recipient must be consumer or dealer"
      );
    }

    // try to transfer to self
    try {
      await contract.connect(await ethers.getSigner(consumer1)).transfer(consumer1, tokenId, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::transfer: sender and receiver cannot be the same"
      );
    }

  });

  it("should limit certain functions after limitedMode is set to true", async function() {

    const { deployer, dealer1, dealer2, consumer1, consumer2 } = await getNamedAccounts();

    let registerConsumer = await contract.connect(await ethers.getSigner(deployer)).registerConsumer(consumer1);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(await ethers.getSigner(deployer)).registerConsumer(consumer2);
    expect(registerConsumerTwo);
    let registerDealer = await contract.connect(await ethers.getSigner(deployer)).registerDealer(dealer1, allTokenTypeId[2]);
    expect(registerDealer);
    let registerDealerTwo = await contract.connect(await ethers.getSigner(deployer)).registerDealer(dealer2, allTokenTypeId[1]);
    expect(registerDealerTwo);

    // turn on limited mode
    await contract.connect(await ethers.getSigner(deployer)).setLimitedMode(true);

    // try to issue to an account other than admin
    try {
      await contract.connect(await ethers.getSigner(deployer)).issue(
        consumer1,
        allTokenTypeId[1],
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
        "Error: VM Exception while processing transaction: revert CLM8::_issue(limited): msg.sender not timelock"
      );
    }

    // try to issue from carbon offsets dealer
    try {
      await contract.connect(await ethers.getSigner(dealer2)).issue(
        deployer,
        allTokenTypeId[1],
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
        "Error: VM Exception while processing transaction: revert CLM8::_issue(limited): msg.sender not timelock"
      );
    }

    // temporarily turn off limited mode and issue tokens to owner (to simulate issuing with DAO)
    await contract.connect(await ethers.getSigner(deployer)).setLimitedMode(false);
    await contract.connect(await ethers.getSigner(deployer)).issue(
      deployer,
      allTokenTypeId[1],
      quantity,
      fromDate,
      thruDate,
      automaticRetireDate,
      metadata,
      manifest,
      description
    );
    await contract.connect(await ethers.getSigner(deployer)).setLimitedMode(true);

    // check number of unique tokens before issuance
    contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(1));

    // transfer tokens to consumer
    await contract.connect(await ethers.getSigner(deployer)).transfer(consumer1, 1, transferAmount);

    // try to transfer from consumer to consumerTwo
    try {
      await contract.connect(await ethers.getSigner(consumer1)).transfer(consumer2, 1, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::_beforeTokenTransfer(limited): only admin and DAO can transfer tokens"
      );
    }

    // issue audited emissions token from dealer
    await contract.connect(await ethers.getSigner(dealer1)).issue(
      consumer1,
      allTokenTypeId[2],
      quantity,
      fromDate,
      thruDate,
      automaticRetireDate,
      metadata,
      manifest,
      description
    );

    // send tokens to dealer from owner
    await contract.connect(await ethers.getSigner(deployer)).transfer(dealer1, 1, transferAmount);

    // try to transfer from dealer to consumer
    try {
      await contract.connect(await ethers.getSigner(dealer1)).transfer(consumer1, 1, transferAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert CLM8::_beforeTokenTransfer(limited): only admin and DAO can transfer tokens"
      );
    }

    // try to retire from consumer
    await contract.connect(await ethers.getSigner(consumer1)).retire(1, transferAmount);

  });

  it("should allow upgrading by admin", async function() {
    const { deployer } = await getNamedAccounts();

    const NetEmissionsTokenNetwork = await ethers.getContractFactory("NetEmissionsTokenNetwork");
    const NetEmissionsTokenNetworkV2 = await ethers.getContractFactory("NetEmissionsTokenNetworkV2");

    // deploy first contract
    const instance = await upgrades.deployProxy(NetEmissionsTokenNetwork, [deployer]);

    await instance.getNumOfUniqueTokens().then((response) => expect(response).to.equal(0));

    // issue token on first contract
    await instance.connect(await ethers.getSigner(deployer)).issue(
      deployer,
      allTokenTypeId[0],
      quantity,
      fromDate,
      thruDate,
      automaticRetireDate,
      metadata,
      manifest,
      description
    );

    await instance.getNumOfUniqueTokens().then((response) => expect(response).to.equal(1));

    // deploy second contract and check
    const upgraded = await upgrades.upgradeProxy(instance.address, NetEmissionsTokenNetworkV2);
    expect(upgraded);

    await upgraded.getNumOfUniqueTokens().then((response) => expect(response).to.equal(1));
  });

});
