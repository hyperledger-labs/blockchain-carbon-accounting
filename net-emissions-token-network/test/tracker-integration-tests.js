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
  description
} = require("./common.js");
const { ethers } = require("./ethers-provider");

describe("Carbon Tracker - Integration tests", function() {

  let contract;
  beforeEach(async () => {
    await deployments.fixture();
    contract = await ethers.getContract('NetEmissionsTokenNetwork');
    contractT = await ethers.getContract('CarbonTracker');
  });

  it("should issue a Carbon Token", async function() {

    const { dealer1, deployer, industry1, industry2 } = await getNamedAccounts();

    // register Industry (as admin REGISTERED_DEALER)
    let registerDealerInd = await contract.registerDealer(industry1, allTokenTypeId[3]);
    expect(registerDealerInd);
    // industry1 to register industry2 (not admin authorized REGISTERED_DEALER )
    let registerIndustryTwo = await contract.connect(await ethers.getSigner(industry1)).registerIndustry(industry2);
    expect(registerIndustryTwo);
    // register emission auditor dealer to issue carbon tokens
    let registerDealerAea = await contract.registerDealer(dealer1, allTokenTypeId[2]);
    expect(registerDealerAea);

    // register Industry as tracker(volunteer)
    let registerTracker = await contractT.connect(await ethers.getSigner(industry1)).registerTracker(industry1);
    expect(registerTracker);

    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .registerTracker(industry2);
    } catch (err) {
      expect(err.toString()).to.equal("Error: VM Exception while processing transaction: revert CLM8::selfOrAdmin: msg.sender does not own this address or is not an admin");
    }

    // register Industry as tracker (admin assigned)
    let registerTrackerIndTwo = await contractT.connect(await ethers.getSigner(deployer)).registerTracker(industry2);
    expect(registerTrackerIndTwo);

    ////////////////////
    let issue = await contract
      .connect(await ethers.getSigner(industry1))
      .issue(
        industry1,
        allTokenTypeId[3],
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

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenId = issueEvent.args[2].toNumber();
    expect(tokenId).to.equal(1);


    // retire part of the balance
    let retire = await contract.connect(await ethers.getSigner(industry1)).retire(tokenId, retireAmount);
    let retireReceipt = await retire.wait(0);
    let retireEvent = retireReceipt.events.pop();
    let retireIdOne = retireEvent.args[1].toNumber();
    let retireAmountOne = retireEvent.args[2].toNumber();
    let txHashRetireOne = ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    let msg = await contract.getTransferHash(industry1, industry2, [tokenId], [transferAmount]);
    msg = ethers.utils.arrayify(msg)
    let signer = await ethers.getSigner(industry2);
    let signature = await signer.signMessage(msg);

    let transfer = await contract
      .connect(await ethers.getSigner(industry1))
      .safeTransferFrom(industry1, industry2, tokenId, transferAmount, signature);
    expect(transfer);   

    let transferReceipt = await transfer.wait(0);
    let transferEvent = transferReceipt.events.pop();
    let transferIdOne = transferEvent.args[3].toNumber();
    let transferAmountOne = transferEvent.args[4].toNumber();
    expect(tokenId).to.equal(1);
    let txHashTransferOne = ethers.utils.arrayify(transferEvent.transactionHash);

    // verify balances after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let expectedTotalAvailableAfterRetireAndTransfer = (quantity - retireAmountOne - transferAmountOne).toString();
    let expectedTotalRetireAfterRetire = retireAmountOne.toString();
    let afterRetireAndTransferBalance = await contract
      .getAvailableAndRetired(industry1, tokenId)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableAfterRetireAndTransfer},${expectedTotalRetireAfterRetire}`)
      );


    ////////////////////
    let issueTwo = await contract
      .connect(await ethers.getSigner(industry1))
      .issue(
        industry1,
        allTokenTypeId[3],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issueTwo);

    // Get ID of token just issued
    transactionReceipt = await issueTwo.wait(0);
    issueEvent = transactionReceipt.events.pop();
    let tokenIdTwo = issueEvent.args[2].toNumber();
    expect(tokenIdTwo).to.equal(2);

    // retire part of the balance
    retire = await contract.connect(await ethers.getSigner(industry1)).retire(tokenIdTwo, retireAmount);
    retireReceipt = await retire.wait(0);
    retireEvent = retireReceipt.events.pop();
    let retireIdTwo = retireEvent.args[1].toNumber();
    let retireAmountTwo = retireEvent.args[2].toNumber();
    expect(retireAmountTwo).to.equal(retireAmount);
    let txHashRetireTwo = ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    msg = await contract.getTransferHash(industry1, industry2, [tokenIdTwo], [transferAmount]);
    msg = ethers.utils.arrayify(msg)
    signer = await ethers.getSigner(industry2);
    signature = await signer.signMessage(msg);

    transfer = await contract
      .connect(await ethers.getSigner(industry1))
      .safeTransferFrom(industry1, industry2, tokenIdTwo, transferAmount, signature);
    expect(transfer);

    transferReceipt = await transfer.wait(0);
    transferEvent = transferReceipt.events.pop();
    let transferIdTwo = transferEvent.args[3].toNumber();
    let transferAmountTwo = transferEvent.args[4].toNumber();
    let txHashTransferTwo = ethers.utils.arrayify(transferEvent.transactionHash);

    ////////////////////
    let issueThree = await contract
      .connect(await ethers.getSigner(industry2))
      .issue(
        industry2,
        allTokenTypeId[3],
        quantity,
        fromDate,
        thruDate,
        automaticRetireDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issueThree);

    // Get ID of token just issued
    transactionReceipt = await issueThree.wait(0);
    issueEvent = transactionReceipt.events.pop();
    let tokenIdThree = issueEvent.args[2].toNumber();
    expect(tokenIdThree).to.equal(3);

    // retire part of the balance
    retire = await contract.connect(await ethers.getSigner(industry2)).retire(tokenIdThree, retireAmount);
    retireReceipt = await retire.wait(0);
    retireEvent = retireReceipt.events.pop();
    let retireIdThree = retireEvent.args[1].toNumber();
    let retireAmountThree = retireEvent.args[2].toNumber();
    expect(retireIdThree).to.equal(3);
    let txHashRetireThree = ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    msg = await contract.getTransferHash(industry2, industry1, [tokenIdThree], [transferAmount]);
    msg = ethers.utils.arrayify(msg)
    signer = await ethers.getSigner(industry1);
    signature = await signer.signMessage(msg);

    transfer = await contract
      .connect(await ethers.getSigner(industry2))
      .safeTransferFrom(industry2, industry1, tokenIdThree, transferAmount, signature);
    expect(transfer);
    

    transferReceipt = await transfer.wait(0);
    transferEvent = transferReceipt.events.pop();
    let transferIdThree = transferEvent.args[3].toNumber();
    let transferAmountThree = transferEvent.args[4].toNumber();
    expect(transferAmountThree).to.equal(transferAmount);
    let txHashTransferThree = ethers.utils.arrayify(transferEvent.transactionHash);

    ////////////////////
    let issueAe = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        industry1,
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
    expect(issueAe);
    let issueAeReceipt = await issueAe.wait(0);
    let issueAeEvent = issueAeReceipt.events.pop();
    let issueAeId = issueAeEvent.args[2].toNumber();;
    let issueAeAmount = issueAeEvent.args[1].toNumber();;
    expect(issueAeId).to.equal(4);
    let txHashIssueAe = ethers.utils.arrayify(issueAeEvent.transactionHash);

    let issueTracker = await contractT
      .connect(await ethers.getSigner(industry1))
      .track(industry1, 
      [retireIdOne,retireIdTwo],
      [retireAmountOne,retireAmountTwo],
      [transferIdOne, transferIdTwo],
      [transferAmountOne, transferAmountTwo],
      []
    )
    expect(issueTracker);
    let trackerReceipt = await issueTracker.wait(0);
    let trackerEvent = trackerReceipt.events.pop();
    console.log(trackerEvent);
  });
});