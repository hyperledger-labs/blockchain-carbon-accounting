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

    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealerAddress.address, allTokenTypeId[1]);
    expect(registerDealer);
    let registerDealerTwo = await contract.registerDealer(dealerAddress.address, allTokenTypeId[2]);
    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);

    // check number of unique tokens before issuance
    let numUniqueTokensBefore = await contract.getNumOfUniqueTokens().then((response) => expect(response).to.equal(0));

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

    let ownerAddress = allAddresses[0];
    let recDealerAddress = allAddresses[1];
    let ceoDealerAddress = allAddresses[2];
    let aeDealerAddress = allAddresses[3];
    let consumerAddress = allAddresses[4];
    let unwhitelistedAddress = allAddresses[5];

    // register roles
    let registerRecDealerAddress = await contract.registerDealer(recDealerAddress.address, allTokenTypeId[0]);
    let registerCeoDealerAddress = await contract.registerDealer(ceoDealerAddress.address, allTokenTypeId[1]);
    let registerAeDealerAddress = await contract.registerDealer(aeDealerAddress.address, allTokenTypeId[2]);
    let registerConsumerAddress = await contract.registerConsumer(consumerAddress.address);
    expect(registerRecDealerAddress);
    expect(registerCeoDealerAddress);
    expect(registerAeDealerAddress);
    expect(registerConsumerAddress);

    // @TODO: Remove owner role from dealers
    let ownerRoles = await contract
      .getRoles(ownerAddress.address)
      .then((response) => expect(response).to.deep.equal([true, true, true, true, false]));
    let recDealerRoles = await contract
      .getRoles(recDealerAddress.address)
      .then((response) => expect(response).to.deep.equal([true, true, false, false, false]));
    let ceoDealerRoles = await contract
      .getRoles(ceoDealerAddress.address)
      .then((response) => expect(response).to.deep.equal([true, false, true, false, false]));
    let aeDealerRoles = await contract
      .getRoles(aeDealerAddress.address)
      .then((response) => expect(response).to.deep.equal([true, false, false, true, false]));
    let consumerRoles = await contract
      .getRoles(consumerAddress.address)
      .then((response) => expect(response).to.deep.equal([false, false, false, false, true]));

    // check assigning another dealer role to recDealerAddress
    let registerRecDealerAddressTwo = await contract.registerDealer(recDealerAddress.address, allTokenTypeId[1]);
    expect(registerRecDealerAddressTwo);
    let recDealerRolesTwo = await contract
      .getRoles(recDealerAddress.address)
      .then((response) => expect(response).to.deep.equal([true, true, true, false, false]));

    // check unregistering that role from recDealerAddress
    let unregisterRecDealerAddress = await contract.unregisterDealer(recDealerAddress.address, allTokenTypeId[1]);
    let recDealerRolesThree = await contract
      .getRoles(recDealerAddress.address)
      .then((response) => expect(response).to.deep.equal([true, true, false, false, false]));
  });

  it("should return all token details correctly", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let dealerAddress = allAddresses[1];
    let consumerAddress = allAddresses[2];

    let registerDealer = await contract.registerDealer(dealerAddress.address, allTokenTypeId[1]);
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

    // Get ID of first issued token
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[0].toNumber();
    expect(tokenId).to.equal(1);

    let getTokenDetails = await contract.getTokenDetails(tokenId).then((response) => {
      // console.log(response)
      expect(response.tokenId.toNumber()).to.equal(tokenId);
      expect(response.issuer).to.equal(dealerAddress.address);
      expect(response.issuee).to.equal(consumerAddress.address);
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
      expect(response).to.equal(dealerAddress.address);
    });
  });

  it("should define a Renewable Energy Certificate, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let dealerAddressTwo = allAddresses[4];
    let consumerAddress = allAddresses[2];
    let consumerAddressTwo = allAddresses[3];

    // register dealer to issue Renewable Energy Certificate
    let registerDealerRec = await contract.registerDealer(dealerAddress.address, allTokenTypeId[0]);
    expect(registerDealerRec);
    // register dealer to issue Carbon Emissions Offset
    let registerDealerCeo = await contract.registerDealer(dealerAddressTwo.address, allTokenTypeId[1]);
    expect(registerDealerCeo);
    // register dealer to issue Audited Emissions tokens
    let registerDealerAea = await contract.registerDealer(dealerAddressTwo.address, allTokenTypeId[2]);
    expect(registerDealerAea);

    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealerAddress).registerConsumer(consumerAddressTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer can issue Renewable Energy Certificate tokens.  Dealer or any consumer issuing would fail.
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

    try {
      let issueWithDealerTwo = await contract
        .connect(dealerAddressTwo)
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
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You are not a Renewable Energy Certificate dealer."
      );
    }

    try {
      let issueWithConsumer = await contract
        .connect(consumerAddress)
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
      .getAvailableAndRetired(consumerAddress.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableBefore},${expectedTotalRetiredBefore}`)
      );

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

    // verify available balance after transfer for consumer one
    let expectedTotalAvailableAfterTransfer = (quantity - transferAmount).toString();
    let afterTransferBalances = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransfer));

    // verify balances after transfer for consumer two
    let expectedTotalAvailableAfterTransferConsumerTwo = transferAmount.toString();
    let afterTransferBalancesConsumerTwo = await contract
      .getBalance(consumerAddressTwo.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransferConsumerTwo));

    // retire part of the balance
    let retire = await contract.retire(consumerAddress.address, tokenId, retireAmount);

    // verify balances after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let expectedTotalAvailableAfterRetire = transferAmount.toString();
    let expectedTotalRetireAfterRetire = retireAmount.toString();
    let afterRetireAndTransferBalance = await contract
      .getAvailableAndRetired(consumerAddressTwo.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableAfterRetire},${expectedTotalRetireAfterRetire}`)
      );

    // test to make sure retired token balance cannot be transferred
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

    // get total balances of newly issued/retired tokens.  It should correctly return both the available and retired balances the tokens.
    let expectedAvailableTwo = (quantity - retireAmount).toString();
    let expectedRetireTwo = retireAmount.toString();
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumerAddress.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = (quantity - retireAmount).toString();
    let expectedRetireThree = retireAmount.toString();
    let afterRetireThree = await contract
      .getAvailableAndRetired(consumerAddress.address, tokenId + 2)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableThree},${expectedRetireThree}`));

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract
      .connect(ownerAddress)
      .unregisterDealer(allAddresses[1].address, allTokenTypeId[0]);
    expect(unregisterDealer);
  });

  it("should define a Carbon Emissions Offset, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let dealerAddressTwo = allAddresses[4];
    let consumerAddress = allAddresses[2];
    let consumerAddressTwo = allAddresses[3];

    // register dealer to issue Renewable Energy Certificate
    let registerDealerRec = await contract.registerDealer(dealerAddressTwo.address, allTokenTypeId[0]);
    expect(registerDealerRec);
    // register dealer to issue Carbon Emissions Offset
    let registerDealerCeo = await contract.registerDealer(dealerAddress.address, allTokenTypeId[1]);
    expect(registerDealerCeo);
    // register dealer to issue Audited Emissions tokens
    let registerDealerAea = await contract.registerDealer(dealerAddressTwo.address, allTokenTypeId[2]);
    expect(registerDealerAea);

    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealerAddress).registerConsumer(consumerAddressTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer can issue Carbon Emissions Offset tokens.  Dealer or any consumer issuing would fail.
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

    try {
      let issueWithDealerTwo = await contract
        .connect(dealerAddressTwo)
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
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You are not a Carbon Emissions Offset dealer."
      );
    }

    try {
      let issueWithConsumer = await contract
        .connect(consumerAddress)
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
      .getAvailableAndRetired(consumerAddress.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableBefore},${expectedTotalRetiredBefore}`)
      );

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

    // verify available balance after transfer for consumer one
    let expectedTotalAvailableAfterTransfer = (quantity - transferAmount).toString();
    let afterTransferBalances = await contract
      .getBalance(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransfer));

    // verify balances after transfer for consumer two
    let expectedTotalAvailableAfterTransferConsumerTwo = transferAmount.toString();
    let afterTransferBalancesConsumerTwo = await contract
      .getBalance(consumerAddressTwo.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(expectedTotalAvailableAfterTransferConsumerTwo));

    // retire part of the balance
    let retire = await contract.retire(consumerAddress.address, tokenId, retireAmount);

    // verify balances after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let expectedTotalAvailableAfterRetire = transferAmount.toString();
    let expectedTotalRetireAfterRetire = retireAmount.toString();
    let afterRetireAndTransferBalance = await contract
      .getAvailableAndRetired(consumerAddressTwo.address, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableAfterRetire},${expectedTotalRetireAfterRetire}`)
      );

    // test to make sure retired token cannot be transferred
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

    // get total balances of newly issued/retired tokens.  It should correctly return both the available and retired balances the tokens.
    let expectedAvailableTwo = (quantity - retireAmount).toString();
    let expectedRetireTwo = retireAmount.toString();
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumerAddress.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = (quantity - retireAmount).toString();
    let expectedRetireThree = retireAmount.toString();
    let afterRetireThree = await contract
      .getAvailableAndRetired(consumerAddress.address, tokenId + 2)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableThree},${expectedRetireThree}`));

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract
      .connect(ownerAddress)
      .unregisterDealer(allAddresses[1].address, allTokenTypeId[1]);
    expect(unregisterDealer);
  });

  it("should define an Audited Emissions, go through userflow with token", async function() {
    let contract = await deployContract();
    const allAddresses = await ethers.getSigners();

    let ownerAddress = allAddresses[0];
    let dealerAddress = allAddresses[1];
    let dealerAddressTwo = allAddresses[4];
    let consumerAddress = allAddresses[2];
    let consumerAddressTwo = allAddresses[3];

    // register dealer to issue Renewable Energy Certificate
    let registerDealerRec = await contract.registerDealer(dealerAddressTwo.address, allTokenTypeId[0]);
    expect(registerDealerRec);
    // register dealer to issue Carbon Emissions Offset
    let registerDealerCeo = await contract.registerDealer(dealerAddressTwo.address, allTokenTypeId[1]);
    expect(registerDealerCeo);
    // register dealer to issue Audited Emissions tokens
    let registerDealerAea = await contract.registerDealer(dealerAddress.address, allTokenTypeId[2]);
    expect(registerDealerAea);

    let registerConsumer = await contract.connect(dealerAddress).registerConsumer(consumerAddress.address);
    expect(registerConsumer);
    let registerConsumerTwo = await contract.connect(dealerAddress).registerConsumer(consumerAddressTwo.address);
    expect(registerConsumerTwo);

    // verify only dealer can issue Audited Emissions tokens.  Dealer or any consumer issuing would fail.
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

    try {
      let issueWithDealerTwo = await contract
        .connect(dealerAddressTwo)
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
    } catch (err) {
      expect(err.toString()).to.equal(
        "Error: VM Exception while processing transaction: revert You are not an Audited Emissions Amount dealer."
      );
    }

    try {
      let issueWithConsumer = await contract
        .connect(consumerAddress)
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
    } catch (err) {
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert You are not a dealer.");
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
      .getAvailableAndRetired(consumerAddress.address, tokenId)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailable},${expectedRetire}`));

    // TODO: define a function to get all properties of a token for this test
    let definedTokenType = await contract.getTokenType(tokenId);
    expect(definedTokenType).to.equal("Audited Emissions");

    // try to transfer the Audited Emissions token to another consumer, verify that it fails
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

    // get total balance of tokens of this type.  It should correctly return both the available and retired balances from all the tokens.
    let expectedAvailableTwo = "0";
    let expectedRetireTwo = quantity.toString();
    let afterRetireTwo = await contract
      .getAvailableAndRetired(consumerAddress.address, tokenId + 1)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableTwo},${expectedRetireTwo}`));

    let expectedAvailableThree = "0";
    let expectedRetireThree = quantity.toString();
    let afterRetireThree = await contract
      .getAvailableAndRetired(consumerAddress.address, tokenId + 2)
      .then((response) => expect(response.toString()).to.equal(`${expectedAvailableThree},${expectedRetireThree}`));

    let unregisterConsumer = await contract.connect(dealerAddress).unregisterConsumer(allAddresses[2].address);
    expect(unregisterConsumer);

    let unregisterDealer = await contract
      .connect(ownerAddress)
      .unregisterDealer(allAddresses[1].address, allTokenTypeId[2]);
    expect(unregisterDealer);
  });
});
