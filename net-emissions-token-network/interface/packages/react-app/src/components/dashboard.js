import React, { useState, useEffect } from "react";

import { getNumOfUniqueTokens, getAvailableAndRetired, getTokenType, getIssuer } from "../services/contract-functions";

import TokenInfoModal from "./token-info-modal";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";

export default function Dashboard({ provider, signedInAddress }) {
  const [modalShow, setModalShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState({});

  const [roles, setRoles] = useState("");
  const [myBalances, setMyBalances] = useState([]);
  const [myIssuedTokens, setMyIssuedTokens] = useState([]);

  const [fetchingTokens, setFetchingTokens] = useState(false);

  function handleOpenTokenInfoModal(tokenId, tokenBalance, tokenRetiredBalance, tokenType) {
    setSelectedToken({
      id: tokenId,
      balance: tokenBalance,
      retired: tokenRetiredBalance,
      type: tokenType,
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
      let bal = (await getAvailableAndRetired(provider, signedInAddress, i));
      let issuer = await getIssuer(provider, i);
      let type = await getTokenType(provider, i);

      if (bal[0].toNumber() > 0) {
        myBal.push({
          tokenId: i,
          tokenType: type,
          balance: bal[0].toNumber(),
          retired: bal[1].toNumber()
        });
      }

      if (issuer.toLowerCase() === signedInAddress.toLowerCase()) {
        myIssued.push({
          tokenId: i,
          tokenType: type,
          balance: bal[0].toNumber(),
          retired: bal[1].toNumber()
        });
      }
    }

    setMyBalances(myBal);
    setMyIssuedTokens(myIssued);
    setFetchingTokens(false);
  }

  useEffect(() => {
    if (provider && signedInAddress) {
      if (myBalances !== [] && !fetchingTokens) {
        setFetchingTokens(true);
        fetchBalances();
      }
    }
  }, [signedInAddress]);

  function pointerHover(e) {
    e.target.style.cursor = "pointer";
  }

  return (
    <>
      <TokenInfoModal
        show={modalShow}
        provider={provider}
        token={selectedToken}
        body="hello"
        onHide={() => {
          setModalShow(false);
          setSelectedToken({});
        }}
      />

      <h2>Dashboard</h2>
      <p>View your token balances and tokens you've issued.</p>

      {fetchingTokens && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      )}

      <Row>
        <Col>
          <h4>Your balances</h4>
          <Table hover size="sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Balance</th>
                <th>Retired</th>
              </tr>
            </thead>
            <tbody>
              {myBalances !== [] &&
                myBalances.map((token) => (
                  <tr
                    key={token}
                    onClick={() => handleOpenTokenInfoModal(token.tokenId, token.balance, token.retired, token.tokenType)}
                    onMouseOver={pointerHover}
                  >
                    <td>{token.tokenType}</td>
                    <td>{token.balance}</td>
                    <td>{token.retired}</td>
                  </tr>
                ))}
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
              {myIssuedTokens !== [] &&
                myIssuedTokens.map((token) => (
                  <tr
                    key={token}
                    onClick={() => handleOpenTokenInfoModal(token.tokenId, token.balance, token.retired, token.tokenType)}
                    onMouseOver={pointerHover}
                  >
                    <td>{token.tokenId}</td>
                    <td>{token.tokenType}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
}
