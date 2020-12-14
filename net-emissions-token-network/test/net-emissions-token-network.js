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
  description
} = require("./constants.js");

async function deployContract() {
  const NetEmissions = await ethers.getContractFactory("NetEmissionsTokenNetwork");
  const netEmissions = await NetEmissions.deploy();
  await netEmissions.deployed();
  return netEmissions;
}

describe("Net Emissions Token Network", function() {
  it("should test contract owner", async function() {
    let contract = await deployContract();

    const [owner, addr1] = await ethers.getSigners();

    let isOwner = await contract.isOwner();
    expect(isOwner).to.equal(true);

    let isOwnerDifferentAddress = await contract.connect(addr1).isOwner();
    expect(isOwnerDifferentAddress).to.equal(false);
  });

  it("should define a Renewable Energy Certificate, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];
    let consumerAddressTwo = allAddresses[3];

    // register dealer 1 to issue Audited Emissions tokens
    // register dealer 2 to issue Renewable Energy Certificate
    // register dealer 3 to issue Carbon Emissions Offset
    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealerAddress).registerConsumer(consumerAddressTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer 3 can issue Carbon Emissions Offset tokens.  Dealer 1 and 2 or any consumer issuing would fail.
    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // verify balance is all available to transfer, none is retired
    let balance = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(quantity.toString()));

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Renewable Energy Certificate");

    // try to transfer balance greater than the available balance
    try {
      let transferFail = await contract.transfer(consumerAddress.address, tokenId, quantity + 1);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // transfer part of balance to another consumer
    let transfer = await contract
      .connect(consumerAddress)
      .transfer(consumerAddressTwo.address, tokenId, transferAmount);
    expect(transfer);

    // verify balances after transfer to both consumers
    let newBalance = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal((quantity - transferAmount).toString()));

    // retire part of the balance
    let retire = await contract.retire(consumerAddress.address, tokenId, retireAmount);

    // verify balance after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let afterRetireBalance = await contract
      .getTokenRetiredAmount(tokenId)
      .then((response) => expect(response.toString()).to.equal(retireAmount.toString()));

    // test to make sure token cannot be transferred without being a dealer
    try {
      let transferRetired = await contract.transfer(consumerAddress.address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Token is retired. Transfer is not permitted"
      );
    }

    // issue more tokens to the same consumer
    let issueTwo = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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

    let retireTwo = await contract.retire(consumerAddress.address, tokenId + 1, retireAmount);
    let retireThree = await contract.retire(consumerAddress.address, tokenId + 2, retireAmount);

    // get total balance of tokens of this type.  It should correctly return both the available and retired balances from all the tokens.
    let totalRetired = (retireAmount * 3).toString();
    let expectedTotalAvailable = (quantity * 3 - totalRetired).toString();
    let allBalances = await contract
      .getBothBalanceByTokenId(allTokenTypeId[0])
      .then((response) => expect(response.toString()).to.equal(`${expectedTotalAvailable},${totalRetired}`));

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract.connect(ownerAddress).unregisterDealer(allAddresses[1].address);
    expect(unregisterDealer);
  });

  it("should define a Carbon Emissions Offset, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];
    let consumerAddressTwo = allAddresses[3];

    // register dealer 1 to issue Audited Emissions tokens
    // register dealer 2 to issue Renewable Energy Certificate
    // register dealer 3 to issue Carbon Emissions Offset
    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealerAddress).registerConsumer(consumerAddressTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer 3 can issue Carbon Emissions Offset tokens.  Dealer 1 and 2 or any consumer issuing would fail.
    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // verify balance is all available to transfer, none is retired
    let balance = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(quantity.toString()));

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Carbon Emissions Offset");

    // try to transfer balance greater than the available balance
    try {
      let transferFail = await contract.transfer(consumerAddress.address, tokenId, quantity + 1);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // transfer part of balance to another consumer
    let transfer = await contract
      .connect(consumerAddress)
      .transfer(consumerAddressTwo.address, tokenId, transferAmount);
    expect(transfer);

    // verify balances after transfer to both consumers
    let newBalance = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal((quantity - transferAmount).toString()));

    // retire part of the balance
    let retire = await contract.retire(consumerAddress.address, tokenId, retireAmount);

    // verify balance after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let afterRetireBalance = await contract
      .getTokenRetiredAmount(tokenId)
      .then((response) => expect(response.toString()).to.equal(retireAmount.toString()));

    // test to make sure token cannot be transferred without being a dealer
    try {
      let transferRetired = await contract.transfer(consumerAddress.address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Token is retired. Transfer is not permitted"
      );
    }

    // issue more tokens to the same consumer
    let issueTwo = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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

    let retireTwo = await contract.retire(consumerAddress.address, tokenId + 1, retireAmount);
    let retireThree = await contract.retire(consumerAddress.address, tokenId + 2, retireAmount);

    // get total balance of tokens of this type.  It should correctly return both the available and retired balances from all the tokens.
    let totalRetired = (retireAmount * 3).toString();
    let expectedTotalAvailable = (quantity * 3 - totalRetired).toString();
    let allBalances = await contract
      .getBothBalanceByTokenId(allTokenTypeId[1])
      .then((response) => expect(response.toString()).to.equal(`${expectedTotalAvailable},${totalRetired}`));

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract.connect(ownerAddress).unregisterDealer(allAddresses[1].address);
    expect(unregisterDealer);
  });

  it("should define an Audited Emissions, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];
    let consumerAddressTwo = allAddresses[3];

    // register dealer 1 to issue Audited Emissions tokens
    // register dealer 2 to issue Renewable Energy Certificate
    // register dealer 3 to issue Carbon Emissions Offset
    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealerAddress).registerConsumer(consumerAddressTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer 3 can issue Carbon Emissions Offset tokens.  Dealer 1 and 2 or any consumer issuing would fail.
    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    // verify balance is all available to transfer, none is retired
    let balance = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(quantity.toString()));

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Audited Emissions");

    // try to transfer balance greater than the available balance
    try {
      let transferFail = await contract.transfer(consumerAddress.address, tokenId, quantity + 1);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert ERC1155: insufficient balance for transfer"
      );
    }

    // transfer part of balance to another consumer
    let transfer = await contract
      .connect(consumerAddress)
      .transfer(consumerAddressTwo.address, tokenId, transferAmount);
    expect(transfer);

    // verify balances after transfer to both consumers
    let newBalance = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal((quantity - transferAmount).toString()));

    // retire part of the balance
    let retire = await contract.retire(consumerAddress.address, tokenId, retireAmount);

    // verify balance after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let afterRetireBalance = await contract
      .getTokenRetiredAmount(tokenId)
      .then((response) => expect(response.toString()).to.equal(retireAmount.toString()));

    // test to make sure token cannot be transferred without being a dealer
    try {
      let transferRetired = await contract.transfer(consumerAddress.address, tokenId, quantity);
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert Token is retired. Transfer is not permitted"
      );
    }

    // issue more tokens to the same consumer
    let issueTwo = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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

    // retire some of the newly issued tokens

    let retireTwo = await contract.retire(consumerAddress.address, tokenId + 1, retireAmount);
    let retireThree = await contract.retire(consumerAddress.address, tokenId + 2, retireAmount);

    // get total balance of tokens of this type.  It should correctly return both the available and retired balances from all the tokens.
    let totalRetired = (retireAmount * 3).toString();
    let expectedTotalAvailable = (quantity * 3 - totalRetired).toString();
    let allBalances = await contract
      .getBothBalanceByTokenId(allTokenTypeId[2])
      .then((response) => expect(response.toString()).to.equal(`${expectedTotalAvailable},${totalRetired}`));

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract.connect(ownerAddress).unregisterDealer(allAddresses[1].address);
    expect(unregisterDealer);
  });

  it("should auto-increment tokenId on two subsequent issuances", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealerAddress.address);
    expect(registerDealer);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);

    let issue = await contract
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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
      .connect(dealerAddress)
      .issue(
        consumerAddress.address,
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
});
