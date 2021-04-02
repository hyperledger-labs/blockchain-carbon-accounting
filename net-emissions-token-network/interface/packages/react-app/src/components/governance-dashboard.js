// SPDX-License-Identifier: Apache-2.0
import React, { useState, useEffect } from "react";

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
  delegates
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
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

const networkNameLowercase = (addresses.network.split(" "))[0].toLowerCase(); // "Hardhat Network" -> "hardhat"

const etherscanPage = `https://${networkNameLowercase}.etherscan.io/address/${addresses.dao.governor.address}#writeContract`;

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

  async function handleSkipTimestamp(days) {
    let localProvider = new JsonRpcProvider();
    let seconds = (days * 24 * 60 * 60); // 1 day
    await localProvider.send("evm_increaseTime", [seconds])
    await localProvider.send("evm_mine");
    setResult(`Added ${days} days to block timestamp. No need to refresh!`);
  }

  async function fetchDaoTokenBalance() {
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
  }

  async function fetchBlockNumber() {
    let blockNum = await getBlockNumber(provider);
    setBlockNumber(blockNum);
    setFetchingBlockNumber(false);
  }

  async function fetchProposals() {
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
      let forVotes = proposalDetails[5].div(decimals).toNumber();
      let againstVotes = proposalDetails[6].div(decimals).toNumber();

      // get votes for signed in user
      let proposalReceipt = await getReceipt(provider, i, signedInAddress);

      let proposalIsEligibleToVote = (
        (proposalState === "Active") &&
        (proposalReceipt.hasVoted === false) &&
        (daoTokenBalance > 0)
      );

      p.push({
        id: i_toNumberFix,
        details: {
          proposer: proposalDetails[1],
          forVotes: forVotes,
          againstVotes: againstVotes,
          startBlock: (proposalDetails[3].toNumber() + 1),
          endBlock: proposalDetails[4].toNumber()
        },
        state: proposalState,
        actions: proposalActions,
        receipt: {
          hasVoted: proposalReceipt[0],
          support: proposalReceipt[1],
          votes: proposalReceipt[2].div(decimals).toString()
        },
        description: proposalDescription,
        isEligibleToVote: proposalIsEligibleToVote
      });
    }

    setProposals(p);
    setProposalsLength(p.length || 0);
    setFetchingProposals(false);
  }

  async function vote(proposalId, support) {
    let decimals = BigNumber.from("1000000000000000000");
    let convertedVotes = (BigNumber.from(votesAmount)).mul(decimals);
    let vote = await castVote(provider, proposalId, support, convertedVotes);
    setResult(vote);
  }

  // If address and provider detected then fetch balances/proposals
  useEffect(() => {
    if (provider) {

      if (!hasRole && Array.isArray(roles)) {
        setHasRole(roles.some(e => e));
      }

      if (signedInAddress) {
        if (daoTokenBalance === -1 && !fetchingDaoTokenBalance) {
          setFetchingDaoTokenBalance(true);
          fetchDaoTokenBalance();
        }
      }

      if (blockNumber === -1 && !fetchingBlockNumber) {
        setFetchingBlockNumber(true);
        fetchBlockNumber();
      }

      if (proposalsLength === -1 && !fetchingProposals && daoTokenBalance !== -1) {
        setFetchingProposals(true);
        fetchProposals();
      }

    }
  }, [
    signedInAddress,
    fetchingDaoTokenBalance,
    proposals,
    fetchingProposals,
    blockNumber,
    fetchingBlockNumber
  ]);

  function handleProposalAction(action, id) {
    setProposalActionType(action);
    setProposalActionId(id);
    setQueueExecuteModalShow(true);
  }

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

      { (networkNameLowercase !== "hardhat") &&
        <p><a href={etherscanPage}>See contract on Etherscan</a></p>
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
              <p>
                Your DAO tokens: {addCommas(daoTokenBalance)}
                { (daoTokenBalance !== 0) &&
                  <> ({percentOfSupply}% of entire supply)</>
                }
              </p>
            </>
          }
        </Col>
        <Col className="text-right">
          <p>{(blockNumber !== -1) && <>Current block: {blockNumber}</>}</p>
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
            <Card key={key} className="m-2 col-lg pt-2">
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
                        Total For: {addCommas(proposal.details.forVotes)}<br/>
                        <InputGroup className="mt-1">
                          <FormControl
                            placeholder="Votes to cast for.."
                            onChange={onVotesAmountChange}
                          />
                          <InputGroup.Append>
                            <Button
                              variant="success"
                              onClick={() => vote(proposal.id, true)}
                            >Vote for</Button>
                          </InputGroup.Append>
                        </InputGroup>
                      </Col>
                      <Col className="text-danger my-auto">
                        Total Against: {addCommas(proposal.details.againstVotes)}<br/>
                        <InputGroup className="mt-1">
                          <FormControl
                            placeholder="Votes to cast against..."
                            onChange={onVotesAmountChange}
                          />
                          <InputGroup.Append>
                            <Button
                              variant="danger"
                              onClick={() => vote(proposal.id, false)}
                            >Vote against</Button>
                          </InputGroup.Append>
                        </InputGroup>
                      </Col>
                    </>
                  }

                  {/* voting results if ineligible */}
                  { ( (proposal.state !== "Pending") && !proposal.isEligibleToVote ) &&
                    <>
                      <Col className="text-success my-auto">
                        Total For: {addCommas(proposal.details.forVotes)}<br/>
                      </Col>
                      <Col className="text-danger my-auto">
                        Total Against: {addCommas(proposal.details.againstVotes)}<br/>
                      </Col>
                    </>
                  }

                </Row>

                { (proposal.receipt.hasVoted === true) &&
                  <p className="text-center py-2">You voted {(proposal.receipt.support) ? "FOR" : "AGAINST"} with {addCommas(proposal.receipt.votes)} votes.</p>
                }

                { (proposal.state !== "Active" && proposal.receipt.hasVoted !== true) &&
                  <Col className="text-danger my-auto">
                    <p className="text-secondary text-center"><small>Must be an active proposal to vote.</small></p>
                  </Col>
                }
              </Card.Body>
            </Card>
          ))
        }
      </div>

    </>
  );
}
