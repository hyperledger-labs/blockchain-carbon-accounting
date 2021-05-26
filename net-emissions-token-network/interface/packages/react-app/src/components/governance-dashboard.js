// SPDX-License-Identifier: Apache-2.0
import { BigNumber } from "@ethersproject/bignumber";
import { JsonRpcProvider } from "@ethersproject/providers";
import { addresses } from "@project/contracts";
import React, { useCallback, useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import FormControl from "react-bootstrap/FormControl";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import {
  castVote,
  daoTokenBalanceOf,
  daoTokenTotalSupply,
  delegates,
  getActions,
  getBlockNumber,
  getDescription,
  getProposalCount,
  getProposalDetails,
  getProposalState,
  getProposalThreshold,
  getQuorum,
  getReceipt,
  refund
} from "../services/contract-functions";
import DelegateDaoTokensModal from "./delegate-dao-tokens-modal";
import ProposalCallDetailsModal from "./proposal-call-details-modal";
import QueueExecuteProposalModal from "./queue-execute-proposal-modal";

function addCommas(str){
  str += '';
  var x = str.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1,$2');
  }
  return x1 + x2;
}

const networkNameLowercase = (addresses.network.split(" "))[0].toLowerCase(); // "Hardhat Network" -> "hardhat"

const blockscoutPage = `https://blockscout.com/xdai/mainnet/address/${addresses.dao.governor.address}/transactions`;

export default function GovernanceDashboard({ provider, roles, signedInAddress }) {

  const [queueExecuteModalShow, setQueueExecuteModalShow] = useState(false);
  const [delegateModalShow, setDelegateModalShow] = useState(false);
  const [callDetailsModalShow, setCallDetailsModalShow] = useState(false);

  const [daoTokenSupply, setDaoTokenSupply] = useState(10000000);
  const [daoTokenBalance, setDaoTokenBalance] = useState(-1);
  const [daoTokenDelegates, setDaoTokenDelegates] = useState();
  const [fetchingDaoTokenBalance, setFetchingDaoTokenBalance] = useState(false);

  const [proposals, setProposals] = useState([]);
  const [childProposals, setChildProposals] = useState({});
  const [proposalsLength, setProposalsLength] = useState(-1);
  const [fetchingProposals, setFetchingProposals] = useState(false);

  const [blockNumber, setBlockNumber] = useState(-1);
  const [fetchingBlockNumber, setFetchingBlockNumber] = useState(false);
  const [isFetchingBlocks, setIsFetchingBlocks] = useState(false);

  const [result, setResult] = useState("");

  const [skipBlocksAmount, setSkipBlocksAmount] = useState("");

  const [proposalActionType, setProposalActionType] = useState("");
  const [proposalActionId, setProposalActionId] = useState(1);

  const [votesAmount, setVotesAmount] = useState(0);

  const [selectedProposalIdDetails, setSelectedProposalIdDetails] = useState(1);

  const percentOfSupply = ((daoTokenBalance / daoTokenSupply) * 100).toFixed(2);

  const [hasRole, setHasRole] = useState(false);

  const [quorum, setQuorum] = useState(-1);
  const [fetchingQuorum, setFetchingQuorum] = useState(false);
  const [proposalThreshold, setProposalThreshold] = useState(-1);
  const [fetchingProposalThreshold, setFetchingProposalThreshold] = useState(false);

  function onSkipBlocksAmountChange(event) { setSkipBlocksAmount(event.target.value); }
  function onVotesAmountChange(event) { setVotesAmount(event.target.value);  }

  async function handleSkipBlocks(blocks) {
    let localProvider = new JsonRpcProvider();
    if (!Number(blocks)) {
      console.error("Must enter a valid integer of blocks to skip on local EVM network.");
      return;
    }
    setIsFetchingBlocks(true);
    let newBlockNumber = blockNumber;
    for (let i = 0; i < Number(blocks); i++) {
      await localProvider.send("evm_mine");
      newBlockNumber++;
      setBlockNumber(newBlockNumber);
    }
    setIsFetchingBlocks(false);
    setResult(`Skipped ${blocks} blocks. Please refresh in a few seconds to see the updated current block!`);
  }

  const handleSkipTimestamp = useCallback(async (days) => {
    let localProvider = new JsonRpcProvider();
    let seconds = (days * 24 * 60 * 60); // 1 day
    await localProvider.send("evm_increaseTime", [seconds])
    await localProvider.send("evm_mine");
    setResult(`Added ${days} days to block timestamp. No need to refresh!`);
  }, []);

  const fetchDaoTokenSupply = useCallback(async () => {
    let balance = await daoTokenTotalSupply(provider);
    setDaoTokenSupply(balance);
  }, [provider, signedInAddress]);

  const fetchDaoTokenBalance = useCallback(async () => {
    let balance = await daoTokenBalanceOf(provider, signedInAddress);
    let delegatesCall = await delegates(provider, signedInAddress);
    let del = (
      ( delegatesCall.toLowerCase() !== signedInAddress.toLowerCase() )
        ? delegatesCall
        : "You")
    ; // just display first address for now, @TODO display multisig delegatees
    setDaoTokenBalance(balance);
    setDaoTokenDelegates(del);
    setFetchingDaoTokenBalance(false);
  }, [provider, signedInAddress]);

  const fetchBlockNumber = useCallback(async () => {
    let blockNum = await getBlockNumber(provider);
    setBlockNumber(blockNum);
    setFetchingBlockNumber(false);
  }, [provider]);

  const fetchQuorum = useCallback(async () => {
    let q = await getQuorum(provider);
    if (q != null) {
      q = addCommas(q.div("1000000000"));
      setQuorum(q);
      setFetchingQuorum(false);
    }
  }, [provider]);

  const fetchProposalThreshold = useCallback(async () => {
    let p = await getProposalThreshold(provider);
    if (p != null) {
      p = addCommas(p.div("1000000000000000000"));
      setProposalThreshold(p);
      setFetchingProposalThreshold(false);
    }
  }, [provider]);

  const fetchProposals = useCallback(async () => {
    let numberOfProposals = await getProposalCount(provider);
    let p = [];
    let cps = {};

    for (let i = numberOfProposals; i > 0; i--) {
      let i_toNumberFix;
      try {
        i_toNumberFix = i.toNumber();
      } catch (e) {
        i_toNumberFix = i;
      }

      let proposalDetails = await getProposalDetails(provider, i);
      let parentProposal = proposalDetails.parentProposalId;
      let proposalId = proposalDetails.id;
      let proposalState = await getProposalState(provider, i);
      let proposalDescription = await getDescription(provider, i);
      let proposalActions = await getActions(provider, i);

      let decimals = BigNumber.from("1000000000");
      let decimalsRaw = "1000000000000000000";
      let forVotes = proposalDetails[5].div(decimals).toNumber();
      let againstVotes = proposalDetails[6].div(decimals).toNumber();
      let rawForVotes = proposalDetails[7].div(decimalsRaw).toNumber();
      let rawAgainstVotes = proposalDetails[8].div(decimalsRaw).toNumber();

      // get votes for signed in user
      let proposalReceipt = await getReceipt(provider, i, signedInAddress);
      let refundProposal = BigNumber.from("0").toNumber();

      if (proposalState === "Active" || proposalState === "Quorum Failed") {
        refundProposal = proposalReceipt[3].div(decimalsRaw).toNumber();
      }

      if (signedInAddress.toLowerCase() === proposalDetails[1].toLowerCase()) {
        let currentVotes = proposalReceipt[3].div(decimalsRaw).toNumber()
        if (proposalState === "Succeeded") {
          refundProposal = BigNumber.from(currentVotes).mul(3).div(2).toNumber();
        } else if (proposalState === "Quorum Failed") {
          refundProposal = BigNumber.from(currentVotes).mul(3).div(4).toNumber();
        } else if (proposalState === "Canceled") {
          let tokensToLose = BigNumber.from(currentVotes).div(20);
          refundProposal = BigNumber.from(currentVotes).sub(tokensToLose).toNumber();
        }
      }

      let proposalIsEligibleToVote = (
        (proposalState === "Active") &&
        (daoTokenBalance > 0)
      );

      let proposal = {
        id: i_toNumberFix,
        realId: proposalId,
        details: {
          proposer: proposalDetails[1],
          forVotes: forVotes,
          againstVotes: againstVotes,
          rawForVotes: rawForVotes,
          rawAgainstVotes: rawAgainstVotes,
          startBlock: (proposalDetails[3].toNumber() + 1),
          endBlock: proposalDetails[4].toNumber()
        },
        state: proposalState,
        actions: proposalActions,
        receipt: {
          hasVoted: proposalReceipt[0],
          hasVotesRefunded: proposalReceipt[4],
          support: proposalReceipt[1],
          votes: proposalReceipt[2].div(decimals).toString(),
          rawVotes: proposalReceipt[3].div(decimalsRaw),
          rawRefund: refundProposal,
          endVotesCancelPeriodBlock: proposalReceipt[5].toNumber()
        },
        description: proposalDescription,
        isEligibleToVote: proposalIsEligibleToVote
      };

      if (parentProposal && parentProposal.toNumber() > 0) {
        // if this has a parent proposal, add it there
        if (!cps[parentProposal]) {
          cps[parentProposal] = [proposal];
        } else {
          cps[parentProposal].push(proposal);
        }
      } else {
        // else add it directly to the main list
        p.push(proposal);
      }
    }

    console.log('governance-dashboard proposals: ', p);

    setProposals(p);
    setChildProposals(cps);
    setProposalsLength(p.length || 0);
    setFetchingProposals(false);
  }, [provider, daoTokenBalance, signedInAddress]);

  async function vote(proposalId, support) {
    let decimals = BigNumber.from("1000000000000000000");
    let convertedVotes = (BigNumber.from(votesAmount)).mul(decimals);
    let vote = await castVote(provider, proposalId, support, convertedVotes);
    setResult(vote);
  }

  async function refundDclm8(proposalId) {
    let r = await refund(provider, proposalId);
    setResult(r);
  }

  function handleProposalAction(action, id) {
    setProposalActionType(action);
    setProposalActionId(id);
    setQueueExecuteModalShow(true);
  }


  useEffect(() => {
    if (provider && !hasRole && Array.isArray(roles)) {
      setHasRole(roles.some(e => e));
    }
    fetchDaoTokenSupply();
  }, [provider, hasRole, roles, setHasRole, fetchDaoTokenSupply]);

  useEffect(() => {
    if (provider && signedInAddress && daoTokenBalance === -1 && !fetchingDaoTokenBalance) {
      setFetchingDaoTokenBalance(true);
      fetchDaoTokenBalance();
    }
  }, [provider, signedInAddress, daoTokenBalance, fetchingDaoTokenBalance, setFetchingDaoTokenBalance, fetchDaoTokenBalance]);

  useEffect(() => {
    if (provider && blockNumber === -1 && !fetchingBlockNumber) {
      setFetchingBlockNumber(true);
      fetchBlockNumber();
    }
  }, [provider, blockNumber, fetchingBlockNumber, setFetchingBlockNumber, fetchBlockNumber]);

  useEffect(() => {
    if (provider && daoTokenBalance >= 0 && signedInAddress && proposalsLength === -1 && !fetchingProposals) {
      setFetchingProposals(true);
      fetchProposals();
    }
  }, [provider, signedInAddress, proposalsLength, fetchingProposals, setFetchingProposals, fetchProposals, daoTokenBalance]);

  useEffect(() => {
    if (provider && quorum === -1 && !fetchingQuorum) {
      setFetchingQuorum(true);
      fetchQuorum();
    }
  }, [provider, quorum, fetchingQuorum, setFetchingQuorum, fetchQuorum]);

  useEffect(() => {
    if (provider && proposalThreshold === -1 && !fetchingProposalThreshold) {
      setFetchingProposalThreshold(true);
      fetchProposalThreshold();
    }
  }, [provider, proposalThreshold, fetchingProposalThreshold, setFetchingProposalThreshold, fetchProposalThreshold]);

  const hasCancelOrRefund = (cp) => (
    (
      (cp.receipt.hasVoted && (cp.details.proposer.toLowerCase() !== signedInAddress.toLowerCase()))
      || (cp.details.proposer.toLowerCase() === signedInAddress.toLowerCase()
          && (cp.state === "Canceled" || cp.state === "Succeeded" || cp.state === "Quorum Failed"))
    ) &&
    (!cp.receipt.hasVotesRefunded) &&
    cp.receipt.rawRefund > 0
  )

  const renderCancelOrRefund = (cp) =>
  { return hasCancelOrRefund(cp) &&
    <div className="text-center mx-1">
      <Button
        size="sm"
        onClick={ () => refundDclm8(cp.id) }
        className="text-nowrap"
        variant="danger"
      >
        { (cp.state === "Active")
          ? <span>Cancel My Vote</span>
          : <span>Refund {addCommas(cp.receipt.rawRefund)} dCLM8</span>
        }
      </Button>
    </div>
  }

  const renderYouVoted = (cp) => {
    return (<p className="text-center p-1 m-0">
      You voted {(cp.receipt.support) ? "FOR" : "AGAINST"} with {addCommas(cp.receipt.rawVotes)} dCLM8.
    </p>)
  }

  const renderVoteCount = (votes, rawVotes, showVotes) => {
    return showVotes ?
        <>{addCommas(votes)} votes ({addCommas(rawVotes)} dCLM8)</>
      : <>{addCommas(rawVotes)} dCLM8</>
  }

  const renderVoteButtons = (cp, showVotes, showAsTotal) => {
    return (cp.isEligibleToVote || cp.state !== "Pending") &&
      <div className="my-auto col-lg-7 col-lg p-0 mr-2">
        <Row className="justify-content-between mx-1">
          <div className="text-success">{showAsTotal?"Total":""} For: {renderVoteCount(cp.details.forVotes, cp.details.rawForVotes, showVotes)}</div>
          <div className="text-danger">{showAsTotal?"Total":""} Against: {renderVoteCount(cp.details.againstVotes, cp.details.rawAgainstVotes, showVotes)}</div>
        </Row>
        { !cp.receipt.hasVoted && cp.isEligibleToVote && (cp.details.proposer.toLowerCase() !== signedInAddress.toLowerCase()) &&
        <InputGroup className="mt-1">
          <FormControl
            placeholder="dCLM8 to vote.."
            onChange={onVotesAmountChange}
          />
          <InputGroup.Append>
            <Button
              variant="success"
              onClick={() => vote(cp.id, true)}
            >Vote for</Button>
          </InputGroup.Append>
          <InputGroup.Append>
            <Button
              variant="danger"
              onClick={() => vote(cp.id, false)}
            >Vote against</Button>
          </InputGroup.Append>
        </InputGroup>
        }
      </div>
  }

  const renderYourVote = (cp) => (hasCancelOrRefund(cp) || cp.receipt.hasVoted === true) &&
    <Row className="align-items-center justify-content-end mt-2">
      { renderYouVoted(cp) }
      { renderCancelOrRefund(cp) }
    </Row>

  const renderMustBeActiveIfNeeded = (cp) =>(cp.state !== "Active" && cp.receipt.hasVoted !== true) &&
    <Row className="align-items-center justify-content-end">
      <p className="p-0 m-0 mr-2 text-secondary text-right">
        <small>Must be an active proposal to vote.</small>
      </p>
    </Row>

  return (
    <>
      <QueueExecuteProposalModal
        show={queueExecuteModalShow}
        onHide={() => {
          setQueueExecuteModalShow(false);
        }}
        provider={provider}
        type={proposalActionType}
        id={proposalActionId}
      />

      <DelegateDaoTokensModal
        show={delegateModalShow}
        title="Delegate your DAO tokens vote"
        balance={addCommas(daoTokenBalance)}
        onHide={() => {
          setDelegateModalShow(false);
        }}
        provider={provider}
      />

      { (proposals.length > 0) &&
      <ProposalCallDetailsModal
        show={callDetailsModalShow}
        title={"Proposal #" + selectedProposalIdDetails + " call details"}
        onHide={() => {
          setCallDetailsModalShow(false);
        }}
        actions={proposals[selectedProposalIdDetails-1].actions}
      />
      }

      { (isFetchingBlocks) &&
        <Alert variant="secondary" className="text-center">Mining block {blockNumber+1}...</Alert>
      }
      { (result) && <Alert variant="primary" dismissible onClose={() => setResult("")}>{result}</Alert>}

      <h2>Governance</h2>
      <p>View, vote on, or modify proposals to issue CLM8 tokens for DAO token (dCLM8) holders. Your votes count as the square root of dCLM8 you vote on a proposal with, and the full amount you voted with is burned after you cast a vote.</p>

      { (networkNameLowercase === "xdai") &&
        <p><a href={blockscoutPage}>See contract on Blockscout</a></p>
      }

      <div className="d-flex justify-content-start align-items-center">
        <div className="pr-2">
          <Button
            block
            size="sm"
            onClick={ ()=>{ setDelegateModalShow(true) }}
            disabled={(daoTokenBalance <= 0)}
            className="text-nowrap mr-2"
            variant="primary"
          >
            Delegate DAO tokens
          </Button>
          <small className="text-muted">Current delegatee: {daoTokenDelegates}</small>
        </div>
        { (networkNameLowercase === "hardhat") &&
          <div className="ml-auto">

            <InputGroup size="sm" className="mb-1">
             <FormControl
               placeholder="Advance blocks..."
               onChange={onSkipBlocksAmountChange}
             />
             <InputGroup.Append>
               <Button
                 variant="primary"
                 onClick={() => handleSkipBlocks(skipBlocksAmount)}
               >
                 Skip
               </Button>
             </InputGroup.Append>
           </InputGroup>

           <InputGroup size="sm" className="mb-1">
             <FormControl
               placeholder="Skip to block..."
               onChange={onSkipBlocksAmountChange}
             />
             <InputGroup.Append>
               <Button
                 variant="primary"
                 onClick={() => handleSkipBlocks(Number(skipBlocksAmount) - Number(blockNumber))}
               >
                 Skip
               </Button>
             </InputGroup.Append>
            </InputGroup>

            <Button block size="sm" variant="secondary" onClick={ () => handleSkipTimestamp(2)  }>Add 2 days to block timestamp</Button>

          </div>
        }
      </div>
      <hr/>
      <Row>
        <Col>
          { (daoTokenBalance !== -1) &&
            <>
              <small>
                Your DAO tokens: {addCommas(daoTokenBalance)}
                { (daoTokenBalance !== 0) &&
                  <> (~{percentOfSupply}% of entire supply)</>
                }
              </small>
            </>
          }
        </Col>
        <Col className="text-right">
          <small>
            {(blockNumber !== -1) && <>Current block: {blockNumber}</>}
            <br/>
            {(quorum !== -1) && <>Quorum: {quorum} votes (~{addCommas(quorum ** 2)} dCLM8)</>}
            <br/>
            {(proposalThreshold !== -1) && <>Proposal threshold: {proposalThreshold} dCLM8</>}
          </small>
        </Col>
      </Row>

      {(fetchingProposals) &&
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      }

      { (proposalsLength === 0 && !fetchingProposals) && <p>No proposals found.</p>}

      <div className="d-flex flex-wrap justify-content-around row">
        {(proposals !== []) &&
         proposals.map((proposal, key) => (
            <Card key={key} className="m-2 col-12 pt-2">
              <Card.Body className="px-0 pr-2 px-md-3 pr-md-4">
                {/* proposal header */}
                <Row>

                  <Col>
                    <h5 style={{'display': 'inline-block'}}>
                      <span className="mr-3">Proposal #{proposal.id}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="my-1 text-nowrap"
                        onClick={ ()=>{ setSelectedProposalIdDetails(proposal.id); setCallDetailsModalShow(true); }}
                      >
                        Details
                      </Button>
                    </h5>
                  </Col>

                  {/* proposal action buttons */}
                  <Col className="text-right">
                    {/* cancel button */}
                    { ( (proposal.state !== "Executed") && (proposal.state !== "Canceled") && (hasRole) ) &&
                      <Button
                        size="sm"
                        onClick={ () => handleProposalAction("cancel", proposal.id) }
                        disabled={(daoTokenBalance <= 0)}
                        className="text-nowrap ml-1 my-1"
                        variant="danger"
                      >
                        Cancel
                      </Button>
                    }
                    {/* queue button */}
                    { ( (proposal.state === "Succeeded") && (hasRole) ) &&
                      <Button
                        size="sm"
                        onClick={ () => handleProposalAction("queue", proposal.id) }
                        disabled={(daoTokenBalance <= 0)}
                        className="text-nowrap ml-2 my-1"
                        variant="warning"
                      >
                        Queue
                      </Button>
                    }
                    {/* execute button */}
                    { ( (proposal.state === "Queued") && (hasRole) ) &&
                      <Button
                        size="sm"
                        onClick={ () => handleProposalAction("execute", proposal.id) }
                        disabled={(daoTokenBalance <= 0)}
                        className="text-nowrap ml-2 my-1"
                        variant="success"
                      >
                        Execute
                      </Button>
                    }
                  </Col>

                </Row>

                {/* proposal state and voting period */}
                <Card.Text className="text-primary">
                  <b>{proposal.state}</b> <i className="text-secondary ml-3">Voting starts on block {proposal.details.startBlock} and ends on {proposal.details.endBlock}.</i>
                </Card.Text>
                <Card.Text>
                    <small>Proposer: {proposal.details.proposer}</small>
                </Card.Text>

                <Card.Text className="py-2">{proposal.description}</Card.Text>
                <Card.Text></Card.Text>


                { childProposals[proposal.realId] ?
                  childProposals[proposal.realId].map(cp =>
                    <Card key={cp.realId} className="m-2 col-12 pt-2">
                      <Card.Body className="p-1 pb-2">

                        <Row className="justify-content-between align-items-center">

                          {/* child proposal state */}
                          <p className="p-1 m-0 mx-2">{cp.description}</p>

                          {/* voting buttons if eligible */}
                          { renderVoteButtons(cp, /* show quadratic votes */ true, /* show as total */ false) }

                        </Row>

                        { renderMustBeActiveIfNeeded(cp) }
                        { renderYourVote(cp) }
                      </Card.Body>
                    </Card>
                  )
                : null }

                {/* main proposal, use an invisible card here so we can reuse the same code to render and have correct alignment */}
                <Card className="m-2 col-12 pt-2 border-white">
                  <Card.Body className="p-1 pb-2">
                    <Row className="text-center justify-content-end">
                      {/* voting buttons if eligible */}
                      { renderVoteButtons(proposal, /* show quadratic votes */ false, /* show as total */ true) }
                    </Row>

                    { renderMustBeActiveIfNeeded(proposal) }
                    { renderYourVote(proposal) }
                  </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          ))
        }
      </div>

    </>
  );
}
