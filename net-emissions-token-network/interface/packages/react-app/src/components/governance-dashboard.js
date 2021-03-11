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

  const [selectedProposalIdDetails, setSelectedProposalIdDetails] = useState(1);

  const percentOfSupply = ((daoTokenBalance / supply) * 100).toFixed(2);

  function onSkipBlocksAmountChange(event) { setSkipBlocksAmount(event.target.value); };

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
    console.log(numberOfProposals)
    let prop = [];

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

      let decimals = BigNumber.from("1000000000000000000");
      let forVotes = proposalDetails[5].div(decimals).toNumber();
      let againstVotes = proposalDetails[6].div(decimals).toNumber();

      // get votes for signed in user
      let proposalReceipt = await getReceipt(provider, i, signedInAddress);


      prop.push({
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
          votes: proposalReceipt[2].div(decimals).toNumber()
        },
        description: proposalDescription,
      });
    }

    setProposals(prop);
    setProposalsLength(prop.length || 0);
    setFetchingProposals(false);
  }

  async function vote(proposalId, support) {
    let vote = await castVote(provider, proposalId, support);
    setResult(vote);
  }

  // If address and provider detected then fetch balances/proposals
  useEffect(() => {
    if (provider) {
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

      if (proposalsLength === -1 && !fetchingProposals) {
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

  return (
    <>
      <QueueExecuteProposalModal
        show={queueExecuteModalShow}
        onHide={() => {
          setQueueExecuteModalShow(false);
        }}
        provider={provider}
        type={proposalActionType}
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
      <p>View, vote on, or modify proposals to issue tokens for DAO token holders. Delegate your vote before a proposal is created to be eligible to cast your votes on it.</p>

      { (networkNameLowercase !== "hardhat") &&
        <p><a href={etherscanPage}>See contract on Etherscan</a></p>
      }

      <div className="d-flex justify-content-start align-items-center">
        <div className="pr-2">
          <span className="mr-2 text-secondary">Proposals:</span>
          <Button
            onClick={ ()=>{ setQueueExecuteModalShow(true); setProposalActionType("queue") }}
            disabled={(daoTokenBalance <= 0)}
            className="text-nowrap mr-2"
            variant="warning"
          >
            Queue
          </Button>
          <Button
            onClick={ ()=>{ setQueueExecuteModalShow(true); setProposalActionType("execute") }}
            disabled={(daoTokenBalance <= 0)}
            className="text-nowrap mr-2"
            variant="success"
          >
            Execute
          </Button>
          <Button
            onClick={ ()=>{ setQueueExecuteModalShow(true); setProposalActionType("cancel") }}
            disabled={(daoTokenBalance <= 0)}
            className="text-nowrap mr-2"
            variant="danger"
          >
            Cancel
          </Button>
          <div className="my-2"></div>
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
                  <div className="d-flex flex-wrap justify-content-between">
                    <h5>Proposal #{proposal.id}</h5>
                    <span className="text-primary">{proposal.state}</span>
                  </div>

                <Card.Text><small>Proposer: {proposal.details.proposer}</small></Card.Text>
                <Card.Text>{proposal.description}</Card.Text>
                <Card.Text>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={ ()=>{ setSelectedProposalIdDetails(proposal.id); setCallDetailsModalShow(true); }}
                  >
                    Call details
                  </Button>
                </Card.Text>
                <Card.Text className="text-secondary mb-4"><i>Voting starts on block {proposal.details.startBlock} and ends on {proposal.details.endBlock}.</i></Card.Text>
                <Row className="text-center mb-3">
                  <Col className="text-success my-auto">
                    YES: {addCommas(proposal.details.forVotes)}<br/>
                    <Button
                      className="mt-1"
                      variant="success"
                      disabled={ (proposal.state !== "Active") || (proposal.receipt.hasVoted === true) || (daoTokenBalance <= 0) }
                      onClick={() => vote(proposal.id, true)}
                    >Vote for</Button>
                  </Col>
                  <Col className="text-danger my-auto">
                    NO: {addCommas(proposal.details.againstVotes)}<br/>
                    <Button
                      className="mt-1"
                      variant="danger"
                      disabled={ (proposal.state !== "Active") || (proposal.receipt.hasVoted === true) || (daoTokenBalance <= 0) }
                      onClick={() => vote(proposal.id, false)}
                    >Vote against</Button>
                  </Col>
                </Row>
                { (proposal.receipt.hasVoted === true) &&
                  <p className="text-secondary text-center"><small>You voted {(proposal.receipt.support) ? "FOR" : "AGAINST"} with {addCommas(proposal.receipt.votes)} votes.</small></p>
                }
                { (proposal.state !== "Active" && proposal.receipt.hasVoted !== true) &&
                  <p className="text-secondary text-center"><small>Must be an active proposal to vote.</small></p>
                }
              </Card.Body>
            </Card>
          ))
        }
      </div>

    </>
  );
}
