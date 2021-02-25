import React, { useState, useEffect } from "react";

import { addresses } from "@project/contracts";

import { BigNumber } from "@ethersproject/bignumber";

import { daoTokenBalanceOf, getProposalCount, getProposalDetails, getProposalState } from "../services/contract-functions";

import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

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

  const [daoTokenBalance, setDaoTokenBalance] = useState(-1);
  const [fetchingDaoTokenBalance, setFetchingDaoTokenBalance] = useState(false);

  const [proposals, setProposals] = useState([]);
  const [fetchingProposals, setFetchingProposals] = useState(false);

  const percentOfSupply = ((supply / daoTokenBalance) * 100).toFixed(2);

  async function fetchDaoTokenBalance() {
    let balance = await daoTokenBalanceOf(provider, signedInAddress);
    setDaoTokenBalance(balance);
    setFetchingDaoTokenBalance(false);
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
    setFetchingProposals(false);
  }

  // If address and provider detected then fetch balances/proposals
  useEffect(() => {
    if (provider && signedInAddress) {
      if (daoTokenBalance === -1 && !fetchingDaoTokenBalance) {
        setFetchingDaoTokenBalance(true);
        fetchDaoTokenBalance();
      }

      if (proposals.length < 1 && !fetchingProposals) {
        setFetchingProposals(true);
        fetchProposals();
      }
    }
  }, [signedInAddress, fetchingDaoTokenBalance, proposals, fetchingProposals]);

  return (
    <>

      <h2>Governance Dashboard</h2>
      <p>Vote on or create proposals.</p>
      <hr/>
      <p>{(daoTokenBalance !== -1) && <>Your DAO tokens: {addCommas(daoTokenBalance)} ({percentOfSupply}% of entire supply)</>}</p>

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
