import React, { useState, useEffect } from "react";

import { addresses } from "@project/contracts";

import { BigNumber } from "@ethersproject/bignumber";

import { daoTokenBalanceOf, getProposalCount, getProposalDetails, getProposalState, getBlockNumber } from "../services/contract-functions";

import CreateProposalModal from "./create-proposal-modal";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";

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

      prop.push({
        id: i,
        details: {
          proposer: proposalDetails[1],
          forVotes: forVotes,
          againstVotes: againstVotes,
          startBlock: proposalDetails[3].toNumber(),
          endBlock: proposalDetails[4].toNumber()
        },
        state: proposalState
      });
    }

    setProposals(prop);
    setProposalsLength(prop.length || 0);
    setFetchingProposals(false);
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
      />

      <h2>Governance</h2>
      <p>View, vote on, or create proposals to issue tokens.</p>
      <hr/>
      <p>{(blockNumber !== -1) && <>Current block number on connected network: {blockNumber}</>}</p>
      { (daoTokenBalance !== -1) &&
        <p>
          Your DAO tokens: {addCommas(daoTokenBalance)}
          { (daoTokenBalance !== 0) &&
            <> ({percentOfSupply}% of entire supply)</>
          }
        </p>
      }
      {(daoTokenBalance > 0) &&
        <p><Button variant="primary" onClick={ ()=>setModalShow(true) }>Create a proposal</Button></p>
      }

      {(fetchingProposals) &&
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      }

      {(proposalsLength === 0 && !fetchingProposals) && <p>No proposals found.</p>}

      {(proposals !== []) &&
        proposals.map((proposal, key) => (
          <Card key={key}>
            <Card.Body>
              <Card.Title>Proposal #{proposal.id}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">{proposal.state}</Card.Subtitle>
              <Card.Text>Proposer: {proposal.details.proposer}</Card.Text>
              <Card.Text>Voting starts on block {proposal.details.startBlock} and ends on {proposal.details.endBlock}.</Card.Text>
              <Row className="mb-3">
                <Col className="text-success">For: {proposal.details.forVotes}</Col>
                <Col className="text-danger">Against: {proposal.details.againstVotes}</Col>
              </Row>
              <Card.Link href={etherscanPage}>See contract on Etherscan</Card.Link>
            </Card.Body>
          </Card>
        ))
      }

    </>
  );
}
