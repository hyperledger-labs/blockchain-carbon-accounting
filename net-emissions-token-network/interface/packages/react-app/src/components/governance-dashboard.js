// SPDX-License-Identifier: Apache-2.0
import React, { useCallback, useState, useEffect } from "react";

import { addresses } from "@project/contracts";

import { BigNumber } from "@ethersproject/bignumber";
import { JsonRpcProvider } from "@ethersproject/providers"

import {
  daoTokenBalanceOf,
  getProposalCount,
  getProposalDetails,
  getProposalState,
  getBlockNumber,
  castVote,
  getReceipt,
  getDescription,
  getActions,
  delegates,
  refund,
  getQuorum,
  getProposalThreshold
} from "../services/contract-functions";

import QueueExecuteProposalModal from "./queue-execute-proposal-modal";
import DelegateDaoTokensModal from "./delegate-dao-tokens-modal";
import ProposalCallDetailsModal from "./proposal-call-details-modal";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

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

  const supply = 10000000; // 10 million total DAO tokens

  const [queueExecuteModalShow, setQueueExecuteModalShow] = useState(false);
  const [delegateModalShow, setDelegateModalShow] = useState(false);
  const [callDetailsModalShow, setCallDetailsModalShow] = useState(false);

  const [daoTokenBalance, setDaoTokenBalance] = useState(-1);
  const [daoTokenDelegates, setDaoTokenDelegates] = useState();
  const [fetchingDaoTokenBalance, setFetchingDaoTokenBalance] = useState(false);

  const [proposals, setProposals] = useState([]);
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

  const percentOfSupply = ((daoTokenBalance / supply) * 100).toFixed(2);

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
    let q = addCommas( (await getQuorum(provider)).div("1000000000") );
    setQuorum(q);
    setFetchingQuorum(false);
  }, [provider]);

  const fetchProposalThreshold = useCallback(async () => {
    let p = addCommas( (await getProposalThreshold(provider)).div("1000000000000000000") );
    setProposalThreshold(p);
    setFetchingProposalThreshold(false);
  }, [provider]);

  const fetchProposals = useCallback(async () => {
    let numberOfProposals = await getProposalCount(provider);
    let p = [];

    for (let i = numberOfProposals; i > 0; i--) {
      let i_toNumberFix;
      try {
        i_toNumberFix = i.toNumber();
      } catch (e) {
        i_toNumberFix = i;
      }

      let proposalDetails = await getProposalDetails(provider, i);
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

      p.push({
        id: i_toNumberFix,
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
      });
    }

    console.log('governance-dashboard proposals: ', p);

    setProposals(p);
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
    if (provider && !hasRole && Array.isArray(roles))
      setHasRole(roles.some(e => e));
  }, [provider, hasRole, roles, setHasRole]);

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
              <Card.Body>
                  <Row className="pb-2">

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

                {/* proposal state */}
                <Card.Text className="text-primary">
                  <b>{proposal.state}</b>
                </Card.Text>
                <Card.Text>
                    <small>Proposer: {proposal.details.proposer}</small>
                </Card.Text>

                <Card.Text className="py-2">{proposal.description}</Card.Text>
                <Card.Text>
                </Card.Text>
                <Card.Text className="text-secondary mb-4"><i>Voting starts on block {proposal.details.startBlock} and ends on {proposal.details.endBlock}.</i></Card.Text>
                <Row className="text-center mb-3">

                  {/* voting buttons if eligible */}
                  { proposal.isEligibleToVote &&
                    <>
                      <Col className="text-success my-auto">
                        Total For: {addCommas(proposal.details.forVotes)} votes ({addCommas(proposal.details.rawForVotes)} dCLM8 locked)<br/>
                        { (proposal.details.proposer.toLowerCase() !== signedInAddress.toLowerCase()) &&
                        <InputGroup className="mt-1">
                          <FormControl
                            placeholder="dCLM8 to vote for.."
                            onChange={onVotesAmountChange}
                          />
                          <InputGroup.Append>
                            <Button
                              variant="success"
                              onClick={() => vote(proposal.id, true)}
                            >Vote for</Button>
                          </InputGroup.Append>
                        </InputGroup>
                        }
                      </Col>
                      <Col className="text-danger my-auto">
                        Total Against: {addCommas(proposal.details.againstVotes)} votes ({addCommas(proposal.details.rawAgainstVotes)} dCLM8 locked)<br/>
                        { (proposal.details.proposer.toLowerCase() !== signedInAddress.toLowerCase()) &&
                        <InputGroup className="mt-1">
                          <FormControl
                            placeholder="dCLM8 to vote against..."
                            onChange={onVotesAmountChange}
                          />
                          <InputGroup.Append>
                            <Button
                              variant="danger"
                              onClick={() => vote(proposal.id, false)}
                            >Vote against</Button>
                          </InputGroup.Append>
                        </InputGroup>
                        }
                      </Col>
                    </>
                  }

                  {/* voting results if ineligible */}
                  { ( (proposal.state !== "Pending") && !proposal.isEligibleToVote ) &&
                    <>
                      <Col className="text-success my-auto">
                        Total For: {addCommas(proposal.details.forVotes)} votes ({addCommas(proposal.details.rawForVotes)} dCLM8)<br/>
                      </Col>
                      <Col className="text-danger my-auto">
                        Total Against: {addCommas(proposal.details.againstVotes)} votes ({addCommas(proposal.details.rawAgainstVotes)} dCLM8)<br/>
                      </Col>
                    </>
                  }

                </Row>

                { (proposal.receipt.hasVoted === true) &&
                  <p className="text-center py-2">
                    You voted {(proposal.receipt.support) ? "FOR" : "AGAINST"} with {addCommas(proposal.receipt.votes)} votes.
                  </p>
                }

                { (proposal.state !== "Active" && proposal.receipt.hasVoted !== true) &&
                  <Col className="text-danger my-auto">
                    <p className="text-secondary text-center"><small>Must be an active proposal to vote.</small></p>
                  </Col>
                }

                { (
                    (
                      (proposal.receipt.hasVoted && (proposal.details.proposer.toLowerCase() !== signedInAddress.toLowerCase())) || (proposal.details.proposer.toLowerCase() === signedInAddress.toLowerCase() && (proposal.state === "Canceled" || proposal.state === "Succeeded" || proposal.state === "Quorum Failed"))
                    ) &&
                    (!proposal.receipt.hasVotesRefunded) &&
                     proposal.receipt.rawRefund > 0
                  ) &&
                  <p className="text-center py-2">
                    <Button
                      size="sm"
                      onClick={ () => refundDclm8(proposal.id) }
                      className="text-nowrap mt-2"
                      variant="danger"
                    >
                      { (proposal.state === "Active")
                        ? <span>Cancel My Vote</span>
                        : <span>Refund {addCommas(proposal.receipt.rawRefund)} dCLM8</span>
                      }
                    </Button>
                  </p>
                }
              </Card.Body>
            </Card>
          ))
        }
      </div>

    </>
  );
}
