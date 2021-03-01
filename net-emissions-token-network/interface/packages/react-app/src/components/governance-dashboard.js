import React, { useState, useEffect } from "react";

import { addresses } from "@project/contracts";

import { BigNumber } from "@ethersproject/bignumber";

import {
  daoTokenBalanceOf,
  getProposalCount,
  getProposalDetails,
  getProposalState,
  getBlockNumber,
  castVote,
  getReceipt
} from "../services/contract-functions";

import CreateProposalModal from "./create-proposal-modal";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";

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

const etherscanPage = `https://${(addresses.network.split(" "))[0].toLowerCase()}.etherscan.io/address/${addresses.dao.governor.address}#writeContract`;

export default function GovernanceDashboard({ provider, roles, signedInAddress }) {

  const supply = 10000000; // 10 million total DAO tokens

  const [modalShow, setModalShow] = useState(false);

  const [daoTokenBalance, setDaoTokenBalance] = useState(-1);
  const [fetchingDaoTokenBalance, setFetchingDaoTokenBalance] = useState(false);

  const [proposals, setProposals] = useState([]);
  const [proposalsLength, setProposalsLength] = useState(-1);
  const [fetchingProposals, setFetchingProposals] = useState(false);

  const [blockNumber, setBlockNumber] = useState(-1);
  const [fetchingBlockNumber, setFetchingBlockNumber] = useState(false);

  const [voteResult, setVoteResult] = useState("");

  const percentOfSupply = ((supply / daoTokenBalance) * 100).toFixed(2);

  async function fetchDaoTokenBalance() {
    let balance = await daoTokenBalanceOf(provider, signedInAddress);
    setDaoTokenBalance(balance);
    setFetchingDaoTokenBalance(false);
  }

  async function fetchBlockNumber() {
    let blockNum = await getBlockNumber(provider);
    setBlockNumber(blockNum);
    setFetchingBlockNumber(false);
  }

  async function fetchProposals() {
    let numberOfProposals = await getProposalCount(provider);
    let prop = [];

    for (let i = 1; i <= numberOfProposals; i++) {
      let proposalDetails = await getProposalDetails(provider, i);
      let proposalState = await getProposalState(provider, i);

      let decimals = BigNumber.from("1000000000000000000");
      let forVotes = proposalDetails[5].div(decimals).toNumber();
      let againstVotes = proposalDetails[6].div(decimals).toNumber();

      // get votes for signed in user
      let proposalReceipt = await getReceipt(provider, i, signedInAddress);

      prop.push({
        id: i,
        details: {
          proposer: proposalDetails[1],
          forVotes: forVotes,
          againstVotes: againstVotes,
          startBlock: proposalDetails[3].toNumber(),
          endBlock: proposalDetails[4].toNumber()
        },
        state: proposalState,
        receipt: {
          hasVoted: proposalReceipt[0],
          support: proposalReceipt[1],
          votes: proposalReceipt[2].div(decimals).toNumber()
        }
      });
    }

    setProposals(prop);
    setProposalsLength(prop.length || 0);
    setFetchingProposals(false);
  }

  async function vote(proposalId, support) {
    let vote = await castVote(provider, proposalId, support);
    setVoteResult(vote);
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
  }, [signedInAddress, fetchingDaoTokenBalance, proposals, fetchingProposals, blockNumber, fetchingBlockNumber]);

  return (
    <>
      <CreateProposalModal
        show={modalShow}
        title="Create a proposal"
        onHide={() => {
          setModalShow(false);
        }}
        provider={provider}
      />

      <h2>Governance</h2>
      <p>View, vote on, or create proposals to issue tokens.</p>
      <p><a href={etherscanPage}>See contract on Etherscan</a></p>
      <p>
        <Button
          variant="primary"
          onClick={ ()=>setModalShow(true) }
          disabled={(daoTokenBalance <= 0)}
        >
          Create a proposal
        </Button>
      </p>
      <hr/>
      <Row>
        <Col>
          { (daoTokenBalance !== -1) &&
            <p>
              Your DAO tokens: {addCommas(daoTokenBalance)}
              { (daoTokenBalance !== 0) &&
                <> ({percentOfSupply}% of entire supply)</>
              }
            </p>
          }
        </Col>
        <Col className="text-right">
          <p>{(blockNumber !== -1) && <>Current block number: {blockNumber}</>}</p>
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
      { (voteResult) && <Alert variant="primary" dismissible onClose={() => setVoteResult("")}>{voteResult}</Alert>}

      <div className="d-flex flex-wrap">
        {(proposals !== []) &&
          proposals.map((proposal, key) => (
            <Card key={key} style={{ width: '18rem' }} className="m-2">
              <Card.Body className="mb-2">
                <Card.Title>Proposal #{proposal.id}</Card.Title>
                <Card.Subtitle className="mb-2 text-primary">{proposal.state}</Card.Subtitle>
                <Card.Text><small>Proposer: {proposal.details.proposer}</small></Card.Text>
                <Card.Text>Voting starts on block {proposal.details.startBlock} and ends on {proposal.details.endBlock}.</Card.Text>
                <Row className="text-center">
                  <Col className="text-success my-auto">
                    YES: {addCommas(proposal.details.forVotes)}
                    <Button
                      className="mt-1"
                      variant="success"
                      size="sm"
                      disabled={ (proposal.state !== "Active") || (proposal.receipt.hasVoted === true) || (daoTokenBalance <= 0) }
                      onClick={() => vote(proposal.id, true)}
                    >Vote for</Button>
                  </Col>
                  <Col className="text-danger my-auto">
                    NO: {addCommas(proposal.details.againstVotes)}
                    <Button
                      className="mt-1"
                      variant="danger"
                      size="sm"
                      disabled={ (proposal.state !== "Active") || (proposal.receipt.hasVoted === true) || (daoTokenBalance <= 0) }
                      onClick={() => vote(proposal.id, false)}
                    >Vote against</Button>
                  </Col>
                </Row>
                { (proposal.receipt.hasVoted === true) &&
                  <p className="text-secondary text-center"><small>You voted {(addCommas(proposal.receipt.support)) ? "FOR" : "AGAINST"} with {proposal.receipt.votes} votes.</small></p>
                }
                { (proposal.state !== "Active" && proposal.receipt.hasVoted !== true) &&
                  <small className="text-secondary">Must be an active proposal to vote.</small>
                }
              </Card.Body>
            </Card>
          ))
        }
      </div>

    </>
  );
}
