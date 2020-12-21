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
} = require("./constants.js");

async function deployContract() {
  const NetEmissions = await ethers.getContractFactory("NetEmissionsTokenNetwork");
  const netEmissions = await NetEmissions.deploy();
  await netEmissions.deployed();
  return netEmissions;
}

describe("Net Emissions Token Network", function() {
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

  it("should define a Renewable Energy Certificate, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let owner = allAddresses[0];
    let dealer = allAddresses[1];
    let dealerTwo = allAddresses[4];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];

    // register dealer to issue Renewable Energy Certificate
    let registerDealerRec = await contract.registerDealer(dealer.address, allTokenTypeId[0]);
    expect(registerDealerRec);
    // register dealer to issue Carbon Emissions Offset
    let registerDealerCeo = await contract.registerDealer(dealerTwo.address, allTokenTypeId[1]);
    expect(registerDealerCeo);
    // register dealer to issue Audited Emissions tokens
    let registerDealerAea = await contract.registerDealer(dealerTwo.address, allTokenTypeId[2]);
    expect(registerDealerAea);

    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealer).registerConsumer(consumerTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer can issue Renewable Energy Certificate tokens.  Dealer or any consumer issuing would fail.
    let issue = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[0],
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

    try {
      let issueWithDealerTwo = await contract
        .connect(dealerTwo)
        .issue(
          consumer.address,
          allTokenTypeId[0],
          quantity,
          uom,
          fromDate,
          thruDate,
          automaticRetireDate,
          metadata,
          manifest,
          description
        );
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You are not a Renewable Energy Certificate dealer."
      );
    }

    try {
      let issueWithConsumer = await contract
        .connect(consumer)
        .issue(
          consumer.address,
          allTokenTypeId[0],
          quantity,
          uom,
          fromDate,
          thruDate,
          automaticRetireDate,
          metadata,
          manifest,
          description
        );
    } catch (err) {
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer.");
    }

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // Get available/retire balance before transfer
    let expectedTotalAvailableBefore = quantity.toString();
    let expectedTotalRetiredBefore = "0";
    let beforeTransferBalanceAmount = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableBefore},${expectedTotalRetiredBefore}`)
      );

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Renewable Energy Certificate");

    // try to transfer balance greater than the available balance
    try {
      let transferFail = await contract.transfer(consumer.address, tokenId, quantity + 1);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // transfer part of balance to another consumer
    let transfer = await contract
      .connect(consumer)
      .transfer(consumerTwo.address, tokenId, transferAmount);
    expect(transfer);

    // verify available balance after transfer for consumer one
    let expectedTotalAvailableAfterTransfer = (quantity - transferAmount).toString();
    let afterTransferBalances = await contract
      .balanceOf(consumer.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransfer));

    // verify balances after transfer for consumer two
    let expectedTotalAvailableAfterTransferConsumerTwo = transferAmount.toString();
    let afterTransferBalancesConsumerTwo = await contract
      .balanceOf(consumerTwo.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransferConsumerTwo));

    // retire part of the balance
    let retire = await contract.connect(consumer).retire(tokenId, retireAmount);

    // verify balances after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let expectedTotalAvailableAfterRetire = (transferAmount - retireAmount).toString();
    let expectedTotalRetireAfterRetire = retireAmount.toString();
    let afterRetireAndTransferBalance = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableAfterRetire},${expectedTotalRetireAfterRetire}`)
      );

    // test to make sure retired token balance cannot be transferred
    try {
      let transferRetired = await contract.transfer(consumer.address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // issue more tokens to the same consumer
    let issueTwo = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[0],
        quantity,
        uom,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );

    let issueThree = await contract
      .connect(dealer)
      .issue(
        consumer.address,
        allTokenTypeId[0],
        quantity,
        uom,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );

    // retire some of the newly issued tokens

    let retireTwo = await contract.connect(consumer).retire(tokenId + 1, retireAmount);
    let retireThree = await contract.connect(consumer).retire(tokenId + 2, retireAmount);

    // get total balances of newly issued/retired tokens.  It should correctly return both the available and retired balances the tokens.
    let expectedAvailableTwo = (quantity - retireAmount).toString();
    let expectedRetireTwo = retireAmount.toString();
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = (quantity - retireAmount).toString();
    let expectedRetireThree = retireAmount.toString();
    let afterRetireThree = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 2)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableThree},${expectedRetireThree}`));

    let unregisterConsumer = await contract.connect(dealer).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract
      .connect(owner)
      .unregisterDealer(allAddresses[1].address, allTokenTypeId[0]);
    expect(unregisterDealer);
  });

  it("should define a Carbon Emissions Offset, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let owner = allAddresses[0];
    let dealer = allAddresses[1];
    let dealerTwo = allAddresses[4];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];

    // register dealer to issue Renewable Energy Certificate
    let registerDealerRec = await contract.registerDealer(dealerTwo.address, allTokenTypeId[0]);
    expect(registerDealerRec);
    // register dealer to issue Carbon Emissions Offset
    let registerDealerCeo = await contract.registerDealer(dealer.address, allTokenTypeId[1]);
    expect(registerDealerCeo);
    // register dealer to issue Audited Emissions tokens
    let registerDealerAea = await contract.registerDealer(dealerTwo.address, allTokenTypeId[2]);
    expect(registerDealerAea);

    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealer).registerConsumer(consumerTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer can issue Carbon Emissions Offset tokens.  Dealer or any consumer issuing would fail.
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

    try {
      let issueWithDealerTwo = await contract
        .connect(dealerTwo)
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
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You are not a Carbon Emissions Offset dealer."
      );
    }

    try {
      let issueWithConsumer = await contract
        .connect(consumer)
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
    } catch (err) {
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer.");
    }

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // Get available/retired balance before transfer
    let expectedTotalAvailableBefore = quantity.toString();
    let expectedTotalRetiredBefore = "0";
    let beforeTransferBalanceAmount = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableBefore},${expectedTotalRetiredBefore}`)
      );

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Carbon Emissions Offset");

    // try to transfer balance greater than the available balance
    try {
      let transferFail = await contract.transfer(consumer.address, tokenId, quantity + 1);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // transfer part of balance to another consumer
    let transfer = await contract
      .connect(consumer)
      .transfer(consumerTwo.address, tokenId, transferAmount);
    expect(transfer);

    // verify available balance after transfer for consumer one
    let expectedTotalAvailableAfterTransfer = (quantity - transferAmount).toString();
    let afterTransferBalances = await contract
      .balanceOf(consumer.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransfer));

    // verify balances after transfer for consumer two
    let expectedTotalAvailableAfterTransferConsumerTwo = transferAmount.toString();
    let afterTransferBalancesConsumerTwo = await contract
      .balanceOf(consumerTwo.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransferConsumerTwo));

    // retire part of the balance
    let retire = await contract.connect(consumer).retire(tokenId, retireAmount);

    // verify balances after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let expectedTotalAvailableAfterRetire = (transferAmount - retireAmount).toString();
    let expectedTotalRetireAfterRetire = retireAmount.toString();
    let afterRetireAndTransferBalance = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableAfterRetire},${expectedTotalRetireAfterRetire}`)
      );

    // test to make sure retired token cannot be transferred
    try {
      let transferRetired = await contract.transfer(consumer.address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // issue more tokens to the same consumer
    let issueTwo = await contract
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

    let issueThree = await contract
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

    // retire some of the newly issued tokens

    let retireTwo = await contract.connect(consumer).retire(tokenId + 1, retireAmount);
    let retireThree = await contract.connect(consumer).retire(tokenId + 2, retireAmount);

    // get total balances of newly issued/retired tokens.  It should correctly return both the available and retired balances the tokens.
    let expectedAvailableTwo = (quantity - retireAmount).toString();
    let expectedRetireTwo = retireAmount.toString();
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = (quantity - retireAmount).toString();
    let expectedRetireThree = retireAmount.toString();
    let afterRetireThree = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 2)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableThree},${expectedRetireThree}`));

    let unregisterConsumer = await contract.connect(dealer).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract
      .connect(owner)
      .unregisterDealer(allAddresses[1].address, allTokenTypeId[1]);
    expect(unregisterDealer);
  });

  it("should define an Audited Emissions, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let owner = allAddresses[0];
    let dealer = allAddresses[1];
    let dealerTwo = allAddresses[4];
    let consumer = allAddresses[2];
    let consumerTwo = allAddresses[3];

    // register dealer to issue Renewable Energy Certificate
    let registerDealerRec = await contract.registerDealer(dealerTwo.address, allTokenTypeId[0]);
    expect(registerDealerRec);
    // register dealer to issue Carbon Emissions Offset
    let registerDealerCeo = await contract.registerDealer(dealerTwo.address, allTokenTypeId[1]);
    expect(registerDealerCeo);
    // register dealer to issue Audited Emissions tokens
    let registerDealerAea = await contract.registerDealer(dealer.address, allTokenTypeId[2]);
    expect(registerDealerAea);

    let registerConsumer = await contract.connect(dealer).registerConsumer(consumer.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealer).registerConsumer(consumerTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer can issue Audited Emissions tokens.  Dealer or any consumer issuing would fail.
    let issue = await contract
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
    expect(issue);

    try {
      let issueWithDealerTwo = await contract
        .connect(dealerTwo)
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
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You are not an Audited Emissions Amount dealer."
      );
    }

    try {
      let issueWithConsumer = await contract
        .connect(consumer)
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
    } catch (err) {
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer.");
    }

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // Get available/retire balance
    let expectedAvailable = quantity.toString();
    let expectedRetire = "0";
    let available = await contract
      .getAvailableAndRetired(consumer.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailable},${expectedRetire}`));

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Audited Emissions");

    // try to transfer the Audited Emissions token to another consumer, verify that it fails
    try {
      let transferRetired = await contract.transfer(consumer.address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // issue more tokens to the same consumer
    let issueTwo = await contract
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

    let issueThree = await contract
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

    // get total balance of tokens of this type.  It should correctly return both the available and retired balances from all the tokens.
    let expectedAvailableTwo = quantity.toString();
    let expectedRetireTwo = "0";
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = quantity.toString();
    let expectedRetireThree = "0";
    let afterRetireThree = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 2)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableThree},${expectedRetireThree}`));

    let unregisterConsumer = await contract.connect(dealer).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract
      .connect(owner)
      .unregisterDealer(allAddresses[1].address, allTokenTypeId[2]);
    expect(unregisterDealer);
  });
});
