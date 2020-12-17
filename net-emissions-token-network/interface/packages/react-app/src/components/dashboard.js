import React, { useState, useEffect } from "react";

import { getRoles, getNumOfUniqueTokens, getBalance, getTokenType, getIssuer } from "../services/contract-functions";

import TokenInfoModal from "./token-info-modal";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';

export default function Dashboard({ provider, signedInAddress }) {

  const [modalShow, setModalShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState({});

  const [roles, setRoles] = useState("");
  const [myBalances, setMyBalances] = useState([]);
  const [myIssuedTokens, setMyIssuedTokens] = useState([]);

  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [fetchingTokens, setFetchingBalances] = useState(false);

  async function fetchGetRoles() {
    let result = await getRoles(provider, signedInAddress);
    setRoles(result);
    setFetchingRoles(false);
  }

  function handleOpenTokenInfoModal(tokenId, tokenBalance, tokenType) {
    setSelectedToken({
      id: tokenId, 
      balance: tokenBalance,
      type: tokenType
    });
    setModalShow(true);
  }

  async function fetchBalances() {
    // First, fetch number of unique tokens
    let numOfUniqueTokens = (await getNumOfUniqueTokens(provider)).toNumber();

    // Iterate over each tokenId and find balance of signed in address
    let myBal = [];
    let myIssued = [];
    for (let i = 1; i <= numOfUniqueTokens; i++) {
      let bal = (await getBalance(provider, signedInAddress, i)).toNumber();
      let issuer = (await getIssuer(provider, i));
      let type = await getTokenType(provider, i);

      if (bal > 0) {
        myBal.push({
          tokenId: i,
          tokenType: type,
          balance: bal
        });
      }

      if (issuer == signedInAddress) {
        myIssued.push({
          tokenId: i,
          tokenType: type,
          balance: bal
        })
      }
      
    }

    setMyBalances(myBal);
    setMyIssuedTokens(myIssued);
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
      if ((myBalances !== []) && !fetchingTokens) {
        setFetchingBalances(true);
        fetchBalances();
      }
    }
    
  }, [signedInAddress]);

  // const pointerHover = {
  //   cursor: 'pointer';
  // }

  function pointerHover(e) {
    e.target.style.cursor = 'pointer';
  }


  return (
    <>

      <TokenInfoModal
        show={modalShow}
        provider={provider}
        token={selectedToken}
        body="hello"
        onHide={() => {setModalShow(false); setSelectedToken({})} }
      />

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
          <Table hover size="sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {myBalances !== [] && 
                myBalances.map((token) => (
                  <tr
                    key={token}
                    onClick={() => handleOpenTokenInfoModal(token.tokenId, token.balance, token.tokenType)}
                    onMouseOver={pointerHover}
                  >
                    <td>{token.tokenType}</td>
                    <td>{token.balance}</td>
                  </tr>
                ))
              }
            </tbody>
            </Table>
        </Col>
        <Col>
          <h4>Issued tokens</h4>
          <Table hover size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {myBalances !== [] && 
                myBalances.map((token) => (
                  <tr
                    key={token}
                    onClick={() => handleOpenTokenInfoModal(token.tokenId, token.balance, token.tokenType)}
                    onMouseOver={pointerHover}
                  >
                    <td>{token.tokenId}</td>
                    <td>{token.tokenType}</td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
}