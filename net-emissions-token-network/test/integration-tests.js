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

describe("Net Emissions Token Network - Integration tests", function() {
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
        "Error: VM Exception while processing transaction: revert You are not a Renewable Energy Certificate dealer"
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
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer");
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
        "Error: VM Exception while processing transaction: revert You are not a Carbon Emissions Offset dealer"
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
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer");
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
        "Error: VM Exception while processing transaction: revert You are not an Audited Emissions Amount dealer"
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
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer");
    }

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // Get available/retire balance
    let expectedAvailable = "0";
    let expectedRetire = quantity.toString();
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
    let expectedAvailableTwo = "0";
    let expectedRetireTwo = quantity.toString();
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumer.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = "0";
    let expectedRetireThree = quantity.toString();
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
