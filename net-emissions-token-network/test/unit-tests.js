const { expect } = require("chai");
const {
  allTokenTypeId,
  quantity,
  issuerId,
  recipientId,
  retireAmount,
  transferAmount,
  fromDate,
  thruDate,
  automaticRetireDate,
  uom,
  metadata,
  manifest,
  description,
  deployContract
} = require("./common.js");

describe("Net Emissions Token Network - Unit tests", function() {
  it("should auto-increment tokenId on two subsequent issuances", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealer.address, allTokenTypeId[1]);
    expect(registerDealer);
    let registerDealerTwo = await contract.registerDealer(dealer.address, allTokenTypeId[2]);
    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);

    // check number of unique tokens before issuance
    let numUniqueTokensBefore = await contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(0));

    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[1],
        quantity,
        uom,
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
        uom,
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
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // Get ID of second issued token
    let transactionReceipt2 = await issue2.wait(0);
    let issueEvent2 = transactionReceipt2.events.pop();
    let tokenId2 = issueEvent2.args[0].toNumber();
    expect(tokenId2).to.equal(2);
  });

  it("should return the correct roles after owner assigns them", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

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
      .then((response) => expect(response).to.deep.equal([true, true, false, false, false]));
    let ceoDealerRoles = await contract
      .getRoles(ceoDealer.address)
      .then((response) => expect(response).to.deep.equal([true, false, true, false, false]));
    let aeDealerRoles = await contract
      .getRoles(aeDealer.address)
      .then((response) => expect(response).to.deep.equal([true, false, false, true, false]));
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
      .then((response) => expect(response).to.deep.equal([true, true, true, false, false]));

    // check unregistering that role from recDealer
    let unregisterRecdealer = await contract.unregisterDealer(recDealer.address, allTokenTypeId[1]);
    let recDealerRolesThree = await contract
      .getRoles(recDealer.address)
      .then((response) => expect(response).to.deep.equal([true, true, false, false, false]));
  });

  it("should return all token details correctly", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

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
        uom,
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
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    let getTokenDetails = await contract.getTokenDetails(tokenId).then((response) => {
      // console.log(response)
      expect(response.tokenId.toNumber()).to.equal(tokenId);
      expect(response.issuer).to.equal(dealer.address);
      expect(response.issuee).to.equal(consumer.address);
      expect(response.tokenTypeId).to.equal(allTokenTypeId[1]);
      expect(response.uom).to.equal(uom);
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
  });

  it("should fail when retire is called incorrectly", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let dealer = allAddresses[1];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];

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
        uom,
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
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // retire token that does not exist
    try {
      let retireFail = await contract.connect(consumer).retire((tokenId+1), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert tokenId does not exist"
      );
    }

    // retire from wrong account
    try {
      let retireFail = await contract.connect(consumerTwo).retire((tokenId), retireAmount);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You must be the original recipient of the token to retire"
      );
    }

    // retire more than available balance
    try {
      let retireFail = await contract.connect(consumer).retire((tokenId), (quantity + 100));
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Not enough available balance to retire"
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

  });

});
