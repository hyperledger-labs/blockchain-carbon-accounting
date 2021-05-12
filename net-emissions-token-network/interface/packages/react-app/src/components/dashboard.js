// SPDX-License-Identifier: Apache-2.0
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState
} from "react";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import {
  formatDate,
  getAvailableAndRetired,
  getNumOfUniqueTokens,
  getTokenDetails
} from "../services/contract-functions";
import TokenInfoModal from "./token-info-modal";




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
    // clear localStorage
    let localStorage = window.localStorage;
    localStorage.setItem('token_balances', null);

    setFetchingTokens(true);
    fetchBalances();
  }

  const fetchBalances = useCallback(async () => {

    let newMyBalances = [];
    let newMyIssuedTokens = [];

    try {
      // First, fetch number of unique tokens
      let numOfUniqueTokens = (await getNumOfUniqueTokens(provider)).toNumber();

      // Iterate over each tokenId and find balance of signed in address
      for (let i = 1; i <= numOfUniqueTokens; i++) {
        // Fetch token details
        let tokenDetails = await getTokenDetails(provider, i);
        console.log('--- tokenDetails', tokenDetails);

        // Format unix times to Date objects
        let fromDate = formatDate(tokenDetails.fromDate.toNumber());
        let thruDate = formatDate(tokenDetails.thruDate.toNumber());
        let automaticRetireDate = formatDate(
          tokenDetails.automaticRetireDate.toNumber()
        );

        // Format tokenType from tokenTypeId
        let tokenTypes = [
          "Renewable Energy Certificate",
          "Carbon Emissions Offset",
          "Audited Emissions",
        ];

        // Fetch available and retired balances
        let balances = await getAvailableAndRetired(
          provider,
          signedInAddress,
          i
        );
        let availableBalance = balances[0].toNumber();
        let retiredBalance = balances[1].toNumber();

        // Format decimal points for audited emissions tokens
        if (tokenDetails.tokenTypeId === 3) {
          availableBalance = (availableBalance / 1000).toFixed(3);
          retiredBalance = (retiredBalance / 1000).toFixed(3);
        }

        let token = {
          tokenId: tokenDetails.tokenId.toNumber(),
          tokenType: tokenTypes[tokenDetails.tokenTypeId - 1],
          availableBalance: availableBalance,
          retiredBalance: retiredBalance,
          issuer: tokenDetails.issuer,
          issuee: tokenDetails.issuee,
          fromDate: fromDate,
          thruDate: thruDate,
          automaticRetireDate: automaticRetireDate,
          metadata: tokenDetails.metadata,
          manifest: tokenDetails.manifest,
          description: tokenDetails.description,
          totalIssued: tokenDetails.totalIssued.toNumber(),
          totalRetired: tokenDetails.totalRetired.toNumber(),
        };

        // Push token to myBalances or myIssuedTokens in state
        if (token.availableBalance > 0 || token.retiredBalance > 0) {
          newMyBalances.push({ ...token });
          console.log("newMyBalances pushed -> ", newMyBalances);
        }
        if (token.issuer.toLowerCase() === signedInAddress.toLowerCase()) {
          newMyIssuedTokens.push(token);
          token.isMyIssuedToken = true;
        }
      }

    } catch (error) {
      console.log(error);
      setError("Could not connect to contract on the selected network. Check your wallet provider settings.");
    }

    setMyBalances(newMyBalances);
    setMyIssuedTokens(newMyIssuedTokens);
    setFetchingTokens(false);
    setError("");
  }, [provider, signedInAddress]);

  // If address and provider detected then fetch balances
  useEffect(() => {
    if (provider && signedInAddress) {
      if (myBalances !== [] && !fetchingTokens) {
        setFetchingTokens(true);
        fetchBalances();
      }
    }
  }, [provider, signedInAddress, myBalances, fetchingTokens, fetchBalances]);

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
      <p className="mb-1">View your token balances and tokens you've issued.</p>

      <p className="text-danger">{error}</p>

      <div className={fetchingTokens ? "dimmed" : ""}>

        {fetchingTokens && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        )}

        {(signedInAddress) &&
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
                      className={`${(Number(token.availableBalance) <= 0) ? "table-secondary" : ""}`}
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
        }

        {/* Only display issued tokens if owner or dealer */}
        {(isDealer) &&
          <div className="mt-4">
            <h4>Tokens You've Issued</h4>
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Issued</th>
                  <th>Retired</th>
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
                      <td>{token.totalIssued}</td>
                      <td>{token.totalRetired}</td>
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
