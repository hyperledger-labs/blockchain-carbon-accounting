import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

import { getNumOfUniqueTokens, getTokenDetails, getAvailableAndRetired } from "../services/contract-functions";

import TokenInfoModal from "./token-info-modal";

import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";

export const Dashboard = forwardRef(({ provider, signedInAddress, roles }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState({});

  // Balances of my tokens and tokens I've issued
  const [myBalances, setMyBalances] = useState([]);
  const [myIssuedTokens, setMyIssuedTokens] = useState([]);

  const [fetchingTokens, setFetchingTokens] = useState(false);

  const [error, setError] = useState("");

  const isDealer = (roles[0] === true || roles[1] === true || roles[2] === true || roles[3] === true);

  function handleOpenTokenInfoModal(token) {
    setSelectedToken(token);
    setModalShow(true);
  }

  // Allows the parent component to refresh balances on clicking the Dashboard button in the navigation
  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  function handleRefresh() {
    setFetchingTokens(true);
    fetchBalances();
  }

  async function fetchBalances() {
    try {
      // First, fetch number of unique tokens
      let numOfUniqueTokens = (await getNumOfUniqueTokens(provider)).toNumber();

      // Iterate over each tokenId and find balance of signed in address
      let myBal = [];
      let myIssued = [];
      for (let i = 1; i <= numOfUniqueTokens; i++) {

        // Fetch token details
        let tokenDetails = (await getTokenDetails(provider, i));

        // Format unix times to Date objects
        let fromDateObj = new Date((tokenDetails.fromDate.toNumber()) * 1000);
        let thruDateObj = new Date((tokenDetails.thruDate.toNumber()) * 1000);
        let automaticRetireDateObj = new Date((tokenDetails.automaticRetireDate.toNumber()) * 1000);

        // Format tokenType from tokenTypeId
        let tokenTypes = [
          "Renewable Energy Certificate",
          "Carbon Emissions Offset",
          "Audited Emissions"
        ];

        // Fetch available and retired balances
        let balances = (await getAvailableAndRetired(provider, signedInAddress, i));

        let token = {
          tokenId: tokenDetails.tokenId.toNumber(),
          tokenType: tokenTypes[tokenDetails.tokenTypeId - 1],
          availableBalance: balances[0].toNumber(),
          retiredBalance: balances[1].toNumber(),
          issuer: tokenDetails.issuer,
          issuee: tokenDetails.issuee,
          fromDate: fromDateObj.toLocaleString(),
          thruDate: thruDateObj.toLocaleString(),
          automaticRetireDate: automaticRetireDateObj.toLocaleString(),
          metadata: tokenDetails.metadata,
          manifest: tokenDetails.manifest,
          description: tokenDetails.description,
        }

        // Push token to myBalances or myIssuedTokens in state
        if (token.availableBalance > 0 || token.retiredBalance > 0) {
          myBal.push(token);
        }
        if (token.issuer.toLowerCase() === signedInAddress.toLowerCase()) {
          myIssued.push(token);
        }
      }

      setMyBalances(myBal);
      setMyIssuedTokens(myIssued);
      setFetchingTokens(false);
      setError("");
    } catch (error) {
      console.log(error);
      setError("Could not connect to contract. Check your network settings in your wallet.");
    }
  }

  // If address and provider detected then fetch balances
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

      <p className="text-danger">{error}</p>

      <div className={fetchingTokens ? "dimmed" : ""}>

        {fetchingTokens && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        )}

        <div className="mb-4">
          <h4>Your Tokens</h4>
          <Table hover size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Retired</th>
              </tr>
            </thead>
            <tbody>
              {(myBalances !== [] && !fetchingTokens) &&
                myBalances.map((token) => (
                  <tr
                    key={token.tokenId}
                    onClick={() => handleOpenTokenInfoModal(token)}
                    onMouseOver={pointerHover}
                  >
                    <td>{token.tokenId}</td>
                    <td>{token.tokenType}</td>
                    <td>{token.availableBalance}</td>
                    <td>{token.retiredBalance}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>

        {/* Only display issued tokens if owner or dealer */}
        {(isDealer) &&
          <div className="mt-1">
            <h4>Tokens You've Issued</h4>
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {(myIssuedTokens !== [] && !fetchingTokens) &&
                  myIssuedTokens.map((token) => (
                    <tr
                      key={token.tokenId}
                      onClick={() => handleOpenTokenInfoModal(token)}
                      onMouseOver={pointerHover}
                    >
                      <td>{token.tokenId}</td>
                      <td>{token.tokenType}</td>
                      <td>{token.description}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </div>
        }

      </div>
    </>
  );
});

export default Dashboard;
