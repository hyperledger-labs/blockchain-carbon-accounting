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
      expect(err.toString()).to.equal(revertError("CLM8::selfOrAdmin: msg.sender does not own this address or is not an admin"));
    }

    // register Industry as tracker (admin assigned)
    let registerTrackerIndTwo = await contractT.connect(
      await ethers.getSigner(deployer)).registerTracker(industry2);
    expect(registerTrackerIndTwo);

    ////////////////////
    let issue = await contract
      .connect(await ethers.getSigner(industry1))
      .issue(
        industry1,
        industry1,
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
    let cttOne = issueEvent.args[2].toNumber();
    expect(cttOne).to.equal(1);

    // retire part of the balance
    let retire = await contract.connect(await ethers.getSigner(industry1)).retire(cttOne, retireAmount);
    let retireReceipt = await retire.wait(0);
    let retireEvent = retireReceipt.events.pop();
    let cttOneRetiredAmount = retireEvent.args[2].toNumber();
    ethers.utils.arrayify(retireEvent.transactionHash);


    // verify transfer to industry2 with approval signature.
    let msg = await contract.getTransferHash(industry1, industry2, [cttOne], [transferAmount]);
    msg = ethers.utils.arrayify(msg)
    let signer = await ethers.getSigner(industry2);
    let signature = await signer.signMessage(msg);

    let transfer = await contract
      .connect(await ethers.getSigner(industry1))
      .safeTransferFrom(industry1, industry2, cttOne, transferAmount, signature);
    expect(transfer);   

    let transferReceipt = await transfer.wait(0);
    let transferEvent = transferReceipt.events.pop();
    let cttOneTransferAmount = transferEvent.args[4].toNumber();
    ethers.utils.arrayify(transferEvent.transactionHash);

    // verify balances after retiring.  The available to transfer balance should be reduced and retired balance is increased
    let expectedTotalAvailableAfterRetireAndTransfer = (quantity - cttOneRetiredAmount - cttOneTransferAmount).toString();
    let expectedTotalRetireAfterRetire = cttOneRetiredAmount.toString();
    await contract
      .getAvailableAndRetired(industry1, cttOne)
      .then((response) =>
        expect(response.toString()).to.equal(`${expectedTotalAvailableAfterRetireAndTransfer},${expectedTotalRetireAfterRetire}`)
      );

    // retire part of the balance
    retire = await contract.connect(await ethers.getSigner(industry2)).retire(cttOne, 1);
    retireReceipt = await retire.wait(0);
    retireEvent = retireReceipt.events.pop();
    let cttOneRetiredAmountTwo = retireEvent.args[2].toNumber();
    ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    msg = await contract.getTransferHash(industry2, industry1, [cttOne], [transferAmount-cttOneRetiredAmountTwo]);
    msg = ethers.utils.arrayify(msg)
    signer = await ethers.getSigner(industry1);
    signature = await signer.signMessage(msg);

    transfer = await contract
      .connect(await ethers.getSigner(industry2))
      .safeTransferFrom(industry2, industry1, cttOne, transferAmount-cttOneRetiredAmountTwo, signature);
    expect(transfer);   

    transferReceipt = await transfer.wait(0);
    transferEvent = transferReceipt.events.pop();
    let cttOneTransferAmountTwo = transferEvent.args[4].toNumber();
    ethers.utils.arrayify(transferEvent.transactionHash);


    ////////////////////
    let issueTwo = await contract
      .connect(await ethers.getSigner(industry1))
      .issue(
        industry1,
        industry1,
        allTokenTypeId[3],
        quantity,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issueTwo);

    // Get ID of token just issued
    transactionReceipt = await issueTwo.wait(0);
    issueEvent = transactionReceipt.events.pop();
    let cttTwo = issueEvent.args[2].toNumber();
    expect(cttTwo).to.equal(2);

    // retire part of the balance
    retire = await contract.connect(await ethers.getSigner(industry1)).retire(cttTwo, retireAmount);
    retireReceipt = await retire.wait(0);
    retireEvent = retireReceipt.events.pop();
    let cttTwoRetiredAmount = retireEvent.args[2].toNumber();
    expect(cttTwoRetiredAmount).to.equal(retireAmount);
    ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    msg = await contract.getTransferHash(industry1, industry2, [cttTwo], [transferAmount]);
    msg = ethers.utils.arrayify(msg)
    signer = await ethers.getSigner(industry2);
    signature = await signer.signMessage(msg);

    transfer = await contract
      .connect(await ethers.getSigner(industry1))
      .safeTransferFrom(industry1, industry2, cttTwo, transferAmount, signature);
    expect(transfer);

    transferReceipt = await transfer.wait(0);
    transferEvent = transferReceipt.events.pop();
    let cttTwoTransferAmount = transferEvent.args[4].toNumber();
    ethers.utils.arrayify(transferEvent.transactionHash);

    ////////////////////
    let issueThree = await contract
      .connect(await ethers.getSigner(industry2))
      .issue(
        industry2,
        industry2,
        allTokenTypeId[3],
        quantity,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issueThree);

    // Get ID of token just issued
    transactionReceipt = await issueThree.wait(0);
    issueEvent = transactionReceipt.events.pop();
    let cttThree = issueEvent.args[2].toNumber();
    expect(cttThree).to.equal(3);

    // retire part of the balance
    retire = await contract.connect(await ethers.getSigner(industry2)).retire(cttThree, retireAmount);
    retireReceipt = await retire.wait(0);
    retireEvent = retireReceipt.events.pop();
    let cttThreeRetiredAmount = retireEvent.args[2].toNumber();
    ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    msg = await contract.getTransferHash(industry2, industry1, [cttThree], [transferAmount]);
    msg = ethers.utils.arrayify(msg)
    signer = await ethers.getSigner(industry1);
    signature = await signer.signMessage(msg);

    transfer = await contract
      .connect(await ethers.getSigner(industry2))
      .safeTransferFrom(industry2, industry1, cttThree, transferAmount, signature);
    expect(transfer);

    transferReceipt = await transfer.wait(0);
    transferEvent = transferReceipt.events.pop();
    let cttThreeTransferAmount = transferEvent.args[4].toNumber();
    expect(cttThreeTransferAmount).to.equal(transferAmount);
    ethers.utils.arrayify(transferEvent.transactionHash);

    // retire part of the balance
    retire = await contract.connect(await ethers.getSigner(industry1)).retire(cttThree, 1);
    retireReceipt = await retire.wait(0);
    retireEvent = retireReceipt.events.pop();
    let cttThreeRetiredAmountTwo = retireEvent.args[2].toNumber();
    ethers.utils.arrayify(retireEvent.transactionHash);

    // verify transfer to industry2 with approval signature.
    msg = await contract.getTransferHash(industry1, industry2, [cttThree], [4]);
    msg = ethers.utils.arrayify(msg)
    signer = await ethers.getSigner(industry2);
    signature = await signer.signMessage(msg);

    transfer = await contract
      .connect(await ethers.getSigner(industry1))
      .safeTransferFrom(industry1, industry2, cttThree, 4, signature);
    expect(transfer);

    transferReceipt = await transfer.wait(0);
    transferEvent = transferReceipt.events.pop();
    let cttThreeTransferAmountTwo = transferEvent.args[4].toNumber();
    expect(cttThreeTransferAmountTwo).to.equal(4);
    ethers.utils.arrayify(transferEvent.transactionHash);


    ////////////////////
    let issueAe = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        industry1,
        allTokenTypeId[2],
        quantity,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );
    // Check to be certain mint did not return errors
    expect(issueAe);
    let issueAeReceipt = await issueAe.wait(0);
    let issueAeEvent = issueAeReceipt.events.pop();
    let aeOne = issueAeEvent.args[2].toNumber();
    issueAeEvent.args[1].toNumber();
    expect(aeOne).to.equal(4);
    ethers.utils.arrayify(issueAeEvent.transactionHash);

    issueAe = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        industry2,
        allTokenTypeId[2],
        1,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );

    // Check to be certain mint did not return errors
    expect(issueAe);
    issueAeReceipt = await issueAe.wait(0);
    issueAeEvent = issueAeReceipt.events.pop();
    let aeTwo = issueAeEvent.args[2].toNumber();
    let aeTwoAmount = issueAeEvent.args[1].toNumber();
    expect(aeTwoAmount).to.equal(1);
    ethers.utils.arrayify(issueAeEvent.transactionHash);
    let trackOne = await contractT
      .connect(await ethers.getSigner(industry1))
      .track(industry1, 
      [cttOne,cttTwo],
      [cttOneRetiredAmount,cttTwoRetiredAmount],
      [cttOneTransferAmount,cttTwoTransferAmount],
      [0,0],
      0,0,"",""
    )
    expect(trackOne);
    let trackerReceipt = await trackOne.wait(0);
    let trackerEvent = trackerReceipt.events.pop();
    let trackerOne = trackerReceipt.events[2].args[0].toNumber()
    expect(trackerOne).to.equal(1);

    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .track(industry1, 
          [cttOne,cttTwo],
          [cttOneRetiredAmount],
          [cttOneTransferAmount,cttTwoTransferAmount],
          [0,0],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_track: inAmounts and tokenIds are not the same length")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .track(industry1, 
          [cttOne,cttTwo],
          [cttOneRetiredAmount,cttTwoRetiredAmount],
          [cttOneTransferAmount],
          [0,0],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_track: outAmounts and tokenIds are not the same length")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(industry1))
        .track(industry1, 
          [cttOne,cttTwo],
          [cttOneRetiredAmount,cttTwoRetiredAmount],
          [cttOneTransferAmount,cttTwoTransferAmount],
          [trackerEvent.args[2].toNumber()],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_track: trackerIds and tokenIds are not the same length")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(industry2))
        .trackUpdate(trackerOne, 
          [cttOne,cttTwo],
          [cttOneRetiredAmount,cttTwoRetiredAmount],
          [cttOneTransferAmount,cttTwoTransferAmount],
          [0,0],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_track: msg.sender is not the registered trackee or an approved auditor")
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
        revertError("CLM8::approveVerifier: auditor cannot be msg.sender")
      );
    }
    try {
      await contractT
        .connect(await ethers.getSigner(dealer1))
        .track(industry1, 
          [cttOne],
          [cttOneRetiredAmount],
          [0],
          [0],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_verifyRetired: the retired balance exceeds what has been reported in NET")
      );
    }

    try {
      await contractT
        .connect(await ethers.getSigner(dealer1))
        .trackUpdate(trackerOne, 
          [cttOne],
          [0],
          [cttOneTransferAmount+1],
          [0],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_verifyTransferred: the transferred balance exceeds what has been reported in NET")
      );
    }
    let trackTwo = await contractT
      .connect(await ethers.getSigner(industry2))
      .track(industry2, 
        [cttOne, aeTwo],
        [cttOneRetiredAmountTwo, aeTwoAmount],
        [cttOneTransferAmountTwo,0],
        [trackerOne,0],
        0,0,"",""
      )

    expect(trackTwo);
    trackerReceipt = await trackTwo.wait(0);
    trackerEvent = trackerReceipt.events.pop();
    let trackerTwo = trackerReceipt.events[1].args[0].toNumber()
    try {
      await contractT
        .connect(await ethers.getSigner(industry2))
        .trackUpdate(trackerTwo, 
          [cttThree],
          [cttThreeRetiredAmount],
          [0],
          [trackerOne],
          0,0,"",""
        )
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_verifyTotalTracked: total amount tracked exceeds output of tokenId from trackerId")
      );
    } 
    approveVerifier = await contractT
      .connect(await ethers.getSigner(industry2))
      .approveVerifier(dealer1,true);
    expect(approveVerifier);
    
    issueAe = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        industry1,
        allTokenTypeId[2],
        1,
        fromDate,
        thruDate,
        metadata,
        manifest,
        description
      );

    // Check to be certain mint did not return errors
    expect(issueAe);
    issueAeReceipt = await issueAe.wait(0);
    issueAeEvent = issueAeReceipt.events.pop();
    let aeThree = issueAeEvent.args[2].toNumber();
    let aeThreeAmount = issueAeEvent.args[1].toNumber();
    expect(aeThreeAmount).to.equal(1);
    ethers.utils.arrayify(issueAeEvent.transactionHash);
  
    trackTwo = await contractT
      .connect(await ethers.getSigner(dealer1))
      .trackUpdate(trackerTwo, 
        [aeThree],
        [0],
        [aeThreeAmount],
        [0],
        0,0,"",""
      )
    expect(trackTwo);
    let trackThree = await contractT
      .connect(await ethers.getSigner(industry1))
      .track(industry1, 
        [aeThree,cttThree],
        [aeThreeAmount,cttThreeRetiredAmountTwo],
        [0,cttThreeTransferAmountTwo],
        [0,0],
        0,0,"",""
      )
    expect(trackThree);
    trackerReceipt = await trackThree.wait(0);
    trackerEvent = trackerReceipt.events.pop();
    trackerReceipt.events[0].args[0].toNumber()
    //console.log((await trackThree.wait(0)).events.pop());
    //console.log((await contractT.getTokenIds(2,0)));
    //console.log((await contractT._trackerData(2)));
    //console.log((await contractT.auditedTrackerId(aeThree)).toNumber())
    let ci = await contractT.carbonIntensity(1,3);
    expect(ci).to.equal(1000000);
    ci = await contractT.carbonIntensity(2,3);
    expect(ci).to.equal(1300000);
    ci = await contractT.carbonIntensity(3,3);
    expect(ci).to.equal(1150000);
    ci = await contractT.carbonIntensity(1,4);
    expect(ci).to.equal(600000);
    ci = await contractT.carbonIntensity(2,4);
    expect(ci).to.equal(925000);
    ci = await contractT.carbonIntensity(3,4);
    expect(ci).to.equal(575000);
  });
});
