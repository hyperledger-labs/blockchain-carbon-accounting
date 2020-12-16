import React, { useState, useEffect } from "react";

import { getRoles, getNumOfUniqueTokens, getBalance, getTokenType } from "../services/contract-functions";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';

export default function Dashboard({ provider, signedInAddress }) {

  const [roles, setRoles] = useState("");
  const [balances, setBalances] = useState([]);

  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [fetchingBalances, setFetchingBalances] = useState(false);

  async function fetchGetRoles() {
    let result = await getRoles(provider, signedInAddress);
    setRoles(result);
    setFetchingRoles(false);
  }

  async function fetchBalances() {
    // First, fetch number of unique tokens
    let numOfUniqueTokens = (await getNumOfUniqueTokens(provider)).toNumber();

    // Iterate over each tokenId and find balance of signed in address
    let bal = [];
    for (let i = 1; i <= numOfUniqueTokens; i++) {
      let b = (await getBalance(provider, signedInAddress, i)).toNumber();
      let tt = await getTokenType(provider, i);
      bal.push({
        tokenId: i,
        tokenType: tt,
        balance: b
      });
    }

    setBalances(bal);
    setFetchingBalances(false);
  }

  function xOrCheck(value) {
    if (value) {
      return <span className="text-success">✔</span>;
    } else {
      return <span className="text-danger">✖</span>;
    }
  }

  useEffect(() => {

    if (provider && signedInAddress) {
      if (!roles && !fetchingRoles) {
        setFetchingRoles(true);
        fetchGetRoles();
      }
      if ((balances !== []) && !fetchingBalances) {
        setFetchingBalances(true);
        fetchBalances();
      }
    }
    
  }, [signedInAddress])


  return (
    <>
      <h2>Dashboard</h2>
      <Row>
        <Col>
          <h4>Roles</h4>
          {roles ? 
            <div>
              <small>Owner</small> {xOrCheck(roles[0])}<br/>
              <small>Renewable Energy Certificate Dealer</small> {xOrCheck(roles[1])}<br/>
              <small>Carbon Emissions Offset Dealer</small> {xOrCheck(roles[2])}<br/>
              <small>Audited Emissions Dealer</small> {xOrCheck(roles[3])}<br/>
              <small>Consumer</small> {xOrCheck(roles[4])}<br/>
            </div>
            : 
            <div className="text-center mt-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          }
        </Col>
        <Col>
          <h4>Your balances</h4>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {balances !== [] && 
                balances.map((token) => (
                  <tr>
                    <td>{token.tokenId}</td>
                    <td>{token.tokenType}</td>
                    <td>{token.balance}</td>
                  </tr>
                ))
              }
            </tbody>
            </table>
        </Col>
        <Col><h4>Issued tokens</h4></Col>
      </Row>
    </>
  );
}