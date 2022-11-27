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

describe("Carbon Tracker - Integration tests", async function() {

  let contract;
  let contractT;
  let tokenIdOne, tokenIdTwo;
  let deployer, dealer1, dealer2, consumer1, industry1, industry2;
  let cttOne;
  let productIds=[], tokenIds=[];
  before(async () => {
    await deployments.fixture();
    contract = await ethers.getContract('NetEmissionsTokenNetwork');
    contractT = await ethers.getContract('CarbonTracker');
    ({ deployer, dealer1, dealer2, consumer1, industry1, industry2 } = await getNamedAccounts());
    // register emission auditor dealer to issue carbon tokens
    let registerDealerAea = await contract.registerDealer(dealer1, allTokenTypeId[2]  );
    expect(registerDealerAea);
    registerDealerAea = await contract.registerDealer(dealer2, allTokenTypeId[2]  );
    expect(registerDealerAea);
    // register Industry (as admin REGISTERED_DEALER)
    let registerInd = await contract.registerIndustry(industry1);
    expect(registerInd);
    // register industry2 (not admin authorized REGISTERED_DEALER )
    let registerIndustryTwo = await contract.registerIndustry(industry2);
    expect(registerIndustryTwo);
    let registerCons = await contract.registerConsumer(consumer1);
    expect(registerCons);

    ////////////////////
    let issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        contractT.address,
        allTokenTypeId[2],
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
    tokenIdOne = issueEvent.args[2].toNumber();
    ////////////////////
    issue = await contract
      .connect(await ethers.getSigner(dealer1))
      .issue(
        dealer1,
        contractT.address,
        allTokenTypeId[2],
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
    tokenIdTwo = issueEvent.args[2].toNumber();
  });

  it("Dealer should issue CarbonTracker with one emissions token", async function() {
    // test track() function of CarbonTracker
    let track = await contractT.connect(await ethers.getSigner(dealer1))
      .track(industry1,[tokenIdOne],[quantity],metadata,manifest)
    expect(track)
    let transactionReceipt = await track.wait(0);
    let trackEvent = transactionReceipt.events.pop();
  
    cttOne = trackEvent.args[0].toNumber();
    expect(cttOne).to.equal(1);
  })

  it("Dealer should fail creating a CarbonTracker for non industry address or with tokenIds and tokenAmounts of different size", async function() {
    try {
      await contractT.connect(await ethers.getSigner(dealer1))
        .track(consumer1,[tokenIdTwo],[quantity],metadata,manifest)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::isIndustry: address must be a registered industry")
      );
    }
    try {
      await contractT.connect(await ethers.getSigner(dealer1))
        .track(industry1, [tokenIdOne,tokenIdTwo],[quantity],metadata,manifest)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_trackTokens: tokenAmounts and tokenIds are not the same length")
      );
    }
  })

  it("Consumer should issue CarbonTracker with no emission tokens", async function() {
    // test track from non auditor account. Can only request tracker without assigning NET tokens
    let track = await contractT.connect(await ethers.getSigner(consumer1))
      .track(industry1, [], [],
        metadata,manifest)
    expect(track)
    let transactionReceipt = await track.wait(0);
    let trackEvent = transactionReceipt.events.pop();

    let cttTwo = trackEvent.args[0].toNumber();
    expect(cttTwo).to.equal(2);
  })
  it("Consumer should fail issuing CarbonTracker with emission tokens", async function() {
    try {
      await contractT.connect(await ethers.getSigner(consumer1))
        .track(industry1, [tokenIdTwo], [quantity],
          metadata,manifest)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::isAuditor: msg.sender is not an approved auditor for this trackerId")
      );
    }
  })

  it("Dealer should fail issuing CarbonTracker with emission token amount not issued to the tracker contract", async function() {
    try {
      await contractT.connect(await ethers.getSigner(dealer1))
        .track(industry1, [tokenIdOne], [quantity],
          metadata,manifest)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_trackTokens: one of the tokenAmounts is greater than the balance of the tracker contract")
      );
    }
  })
  it("Dealer should update tracker emissions", async function() {
    ////////////////////
    // update tracker 1
    let trackeUpdate = await contractT.connect(await ethers.getSigner(dealer1))
      .trackUpdate(cttOne, [tokenIdTwo], [quantity],
        metadata,manifest);
    expect(trackeUpdate);
  })

  it("Dealer should issueProducts for carbon tracker", async function() {
    let issueProducts = await contractT.connect(await ethers.getSigner(dealer1))
      .issueProducts(cttOne,[0,0],[1,1],
      [metadata,metadata],[manifest,manifest]);
    expect(issueProducts)

    let issueProductsReceipt = await issueProducts.wait(0);
    let issueProductsEvents = issueProductsReceipt.events;
    console.log(issueProductsEvents)
    issueProductsEvents.map(async (e)  => {
      if(e.event==='TransferSingle') {
        tokenIds.push(e.args[3].toNumber());
      }else if(e.event==='ProductsIssued'){
        //const tokenDetails = await contractT._tokenDetails(e.args[3].toNumber());
        productIds = e.args[1].map(Number);
      }
    });
    expect(productIds[0]).to.equal(1);
    expect(productIds[1]).to.equal(2);
  })
  it("Dealer should issueProducts to change amount of existing productIds", async function() {
    let issueProducts = await contractT.connect(await ethers.getSigner(dealer1))
      .issueProducts(cttOne,productIds,[3,3],
      [metadata,metadata],[manifest,manifest]);
    expect(issueProducts)

    let issueProductsReceipt = await issueProducts.wait(0);
    let issueProductsEvents = issueProductsReceipt.events;

    let productsMinted = issueProductsEvents[2].args[2].map(Number);
    expect(productsMinted[0]).to.equal(3);
  })

  it("Dealer should fail issueProducts for productId that does not exist or it did not create", async function() {
    try {
      await contractT.connect(await ethers.getSigner(dealer1))
        .issueProducts(cttOne,[3],[2], [metadata],[manifest]);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_tokenExists: tokenId does not exist")
      );
    }
    try {
      await contractT.connect(await ethers.getSigner(dealer2)).issueProducts(cttOne,productIds,[2,2],
        [metadata,metadata],[manifest,manifest]);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::issueProducts: msg.sender attempt to modify productId it did not issue")
      );
    }
  })

  it("Industry should setApprovedAuditorsOnly", async function() {
    let setApprovedAuditorsOnly = await contractT.connect(await ethers.getSigner(industry1)).setApprovedAuditorsOnly(true);
    expect(setApprovedAuditorsOnly);
  })
  it("Consumer should fail setApprovedAuditorsOnly", async function() {
    try {
      await contractT.connect(await ethers.getSigner(consumer1)).setApprovedAuditorsOnly(true);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::isIndustry: address must be a registered industry")
      );
    }
  })
  it("Industry should approveVerifier for Dealer", async function() {
    let approveVerifier = await contractT.connect(await ethers.getSigner(industry1)).approveVerifier(dealer1,true);
    expect(approveVerifier);
  })

  it("Fail approveVerifier by consumer of for a non dealer (auditor) address or attempting to approve itself", async function() {
    try {
      await contractT.connect(await ethers.getSigner(consumer1))
        .approveVerifier(dealer1,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::isIndustry: address must be a registered industry")
      );
    }
    try {
      await contractT.connect(await ethers.getSigner(industry1))
        .approveVerifier(industry2,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::approveVerifier: address is not a registered emissions auditor")
      );
    }
    try {
      await contractT.connect(await ethers.getSigner(deployer))
        .approveVerifier(deployer,true)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::approveVerifier: auditor cannot be msg.sender")
      );
    }
  })
  
  it("Dealer2 should fail issueProducts if approveVerifier not set by owner", async function() {
    try {
      await contractT.connect(await ethers.getSigner(dealer2)).issueProducts(cttOne,[0,0],[2,2],
        [metadata,metadata],[manifest,manifest]);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::isAuditor: msg.sender is not an approved auditor for this trackerId")
      );
    }
  })

  it("Dealer should issue tracker token", async function() {
    let issueTracker = await contractT.connect(await ethers.getSigner(dealer1)).issue(cttOne);
    expect(issueTracker)
  })

  it("Dealer should fail to update trackerId that has already been issued or does not exist", async function() {
    try {
      await contractT.connect(await ethers.getSigner(dealer1))
        .trackUpdate(cttOne, [tokenIdTwo], [quantity],
          metadata,manifest)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::notIssued: trackerId has already been issued")
      );
    }
    try {
      await contractT.connect(await ethers.getSigner(dealer1))
        .trackUpdate(99, [tokenIdTwo], [quantity],
          metadata,manifest)
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_tokenExists: tokenId does not exist")
      );
    }
  })

  it("Dealer should fail to issueProducts for trackerId that has already been issued", async function() {
    try {
      await contractT.connect(await ethers.getSigner(dealer1)).issueProducts(cttOne,productIds,[2,2],
        [metadata,metadata],[manifest,manifest]);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::notIssued: trackerId has already been issued")
      );
    }
  })
  it("Industry should transfer products", async function() {
    let transferProducts = await contractT.connect(await ethers.getSigner(industry1)).transferProducts(industry2,productIds,[1,1],[]);
    expect(transferProducts)
  })

  it("Industry should fail to transferProducts for issued tracker it does not own or by exceeding available balance", async function() {
    try {
      await contractT.connect(await ethers.getSigner(industry2)).transferProducts(consumer1,productIds,[1,1],[]);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_isOwner: msg.sender does not own this trackerId")
      );
    }
    try {
      await contractT.connect(await ethers.getSigner(industry1)).transferProducts(consumer1,productIds,[1,1],[]);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_beforeTokenTransfer: product amount exceeds what is available to the contract")
      );
    }
  });

  it("Industry should fail to transferProducts for issued tracker it does not own", async function() {

  })

  it("Industry transferProducts to industry2 with signature", async function() {
    let setApproveProductTransfer = await contractT.connect(await ethers.getSigner(industry2)).setApproveProductTransfer(true);
    expect(setApproveProductTransfer)
    //get trackerHash for industry2 to sign
    const tokenAmounts = [1,0];
    let transferHash = await contractT.getTransferHash(contractT.address, industry2, tokenIds, tokenAmounts)
    transferHash = ethers.utils.arrayify(transferHash);
    //sign the hash
    let signer = await ethers.getSigner(industry2);
    let transferSignature = await signer.signMessage(transferHash);
    // send the transfer with signature
    let transferProducts = await contractT.connect(await ethers.getSigner(industry1)).transferProducts(industry2,productIds,tokenAmounts,transferSignature);
    expect(transferProducts)
  });
  it("Industry should fail to transferProducts to industry2 without verified signature or by exceeding available", async function() {
    let signer = await ethers.getSigner(industry2);
    let transferSignature = await signer.signMessage('');
    try {
      //get trackerHash for industry2 to sign
      // send the transfer with signature
      const transferProducts = await contractT.connect(await ethers.getSigner(industry1)).transferProducts(industry2,productIds,[0,1], transferSignature);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_beforeTokenTransfer: receiver has not approved the transaction")
      );
    }
    //get trackerHash for industry2 to sign
    let transferHash = await contractT.getTransferHash(contractT.address, industry2, tokenIds, [1,1])
    transferHash = ethers.utils.arrayify(transferHash);
    //sign the hash
    signer = await ethers.getSigner(industry2);
    transferSignature = signer.signMessage(transferHash);
    // send the transfer with signature
    try {
      const transferProducts = await contractT.connect(await ethers.getSigner(industry1)).transferProducts(industry2,productIds,[1,1], []);
    } catch (err) {
      expect(err.toString()).to.equal(
        revertError("CLM8::_beforeTokenTransfer: product amount exceeds what is available to the contract")
      );
    }
  });
  it("Should getTrackerDetails", async function(){
    const trackerDetails = await contractT.connect(await ethers.getSigner(industry1)).getTrackerDetails(cttOne);
    //console.log(trackerDetails[5].emissions.toNumber());
    expect(trackerDetails[5].emissions.toNumber()).to.equal(20000000)
  })
});

