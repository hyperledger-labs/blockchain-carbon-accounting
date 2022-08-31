// SPDX-License-Identifier: Apache-2.0
const { expect } = require("chai");
const { getNamedAccounts, deployments } = require("hardhat");
const {
  allTokenTypeId,
  quantity,
  retireAmount,
  transferAmount,
  fromDate,
  thruDate,
  metadata,
  manifest,
  description,
  revertError,
  ethers
} = require("./common.js");

describe("Carbon Tracker - Integration tests", function() {

  let contract;
  let contractT;
  beforeEach(async () => {
    await deployments.fixture();
    contract = await ethers.getContract('NetEmissionsTokenNetwork');
    contractT = await ethers.getContract('CarbonTracker');
  });

  it("should issue Carbon Trackers", async function() {

    const { dealer1, deployer, industry1, industry2 } = await getNamedAccounts();

    // register emission auditor dealer to issue carbon tokens
    let registerDealerAea = await contract.registerDealer(dealer1, allTokenTypeId[2]);
    expect(registerDealerAea);

    // register Industry (as admin REGISTERED_DEALER)
    let registerInd = await contract.registerIndustry(industry1);
    expect(registerInd);

    // register industry2 (not admin authorized REGISTERED_DEALER )
    let registerIndustryTwo = await contract.registerIndustry(industry2);
    expect(registerIndustryTwo);


    // register Industry as tracker(volunteer)
    let registerTracker = await contractT.connect(await ethers.getSigner(industry1)).registerTracker(industry1);
    expect(registerTracker);

    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .registerTracker(industry2);
    } catch (err) {
      expect(err.toString()).to.equal(revertError("CLM8::selfOrAuditor: msg.sender does not own this address or is not an auditor"));
    }

    // register Industry as tracker (admin assigned)
    let registerTrackerIndTwo = await contractT.connect(
      await ethers.getSigner(deployer)).registerTracker(industry2);
    expect(registerTrackerIndTwo);
    ////////////////////
    let issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        contractT.address,
        allTokenTypeId[3],
        quantity,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    // Get ID of token just issued
    let transactionReceipt = await issue.wait(0);
    let issueEvent = transactionReceipt.events.pop();
    let tokenIdOne = issueEvent.args[2].toNumber();
    ////////////////////
    issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        contractT.address,
        allTokenTypeId[3],
        quantity,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issue);

    // Get ID of token just issued
    transactionReceipt = await issue.wait(0);
    issueEvent = transactionReceipt.events.pop();
    let tokenIdTwo = issueEvent.args[2].toNumber();

    let track = await contractT
      .connect(await ethers.getSigner(dealer1))
      .track(industry1, 
        [tokenIdOne],
        [quantity],
        0,0,""
      )
    expect(track)
    transactionReceipt = await track.wait(0);
    let trackEvent = transactionReceipt.events.pop();
    console.log(trackEvent)
    let cttOne = trackEvent.args[0].toNumber();
    expect(cttOne).to.equal(1);
    ////////////////////
    // update tracker 1
    let trackeUpdate = await contractT
      .connect(await ethers.getSigner(dealer1))
      .trackUpdate(
        cttOne,
        [tokenIdTwo],
        [quantity],
        0,0,""
      );
    // Check to be certain mint did not return errors
    expect(trackeUpdate);
    console.log("a")
    try {
      await contractT
        .connect(await ethers.getSigner(dealer1))
        .track(industry1, 
          [tokenIdOne,tokenIdTwo],
          [quantity],
          0,0,""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_trackTokens: tokenAmounts and tokenIds are not the same length")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(dealer1))
        .track(industry1, 
          [tokenIdOne],
          [quantity+1],
          0,0,""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_trackTokens: tokenAmounts[i] is greater than what is available to the tracker contract")
      );
    }


    let approveVerifier = await contractT
      .connect(await ethers.getSigner(industry1))
      .approveVerifier(dealer1,true);
    expect(approveVerifier);
    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .approveVerifier(industry2,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::approveVerifier: address is not a registered emissions auditor")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(dealer1))
        .approveVerifier(dealer1,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::registeredTracker: the address is not registered")
      );
    }
    registerTracker = await contractT.connect(await ethers.getSigner(dealer1)).registerTracker(dealer1);
    expect(registerTracker);
    try {
      await contractT
        .connect(await ethers.getSigner(dealer1))
        .approveVerifier(dealer1,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::approveVerifier: auditor cannot be msg.sender")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .approveVerifier(dealer1,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::selfOrAuditor: msg.sender does not own this address or is not an auditor")
      );
    }

  });
});
