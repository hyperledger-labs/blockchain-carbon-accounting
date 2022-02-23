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
  getAvailableRetiredAndTransferred,
  getNumOfUniqueTokens,
  getTokenDetails,
  getNumOfUniqueTrackers,
  getTrackerDetails,
  getTrackerIds,
  getTokenAmounts,
  getCarbonIntensity
} from "../services/contract-functions";
import TokenInfoModal from "./token-info-modal";
import TrackerInfoModal from "./tracker-info-modal";


export const Dashboard = forwardRef(({ provider, signedInAddress, roles }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [modalTrackerShow, setModaltrackerShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState({});
  const [selectedTracker, setSelectedTracker] = useState({});

  // Balances of my tokens and tokens I've issued
  const [myBalances, setMyBalances] = useState([]);
  const [myIssuedTokens, setMyIssuedTokens] = useState([]);
  const [myIssuedTrackers, setMyIssuedTrackers] = useState([]);

  const [fetchingTokens, setFetchingTokens] = useState(false);
  const [fetchingTrackers, setFetchingTrackers] = useState(false);


  const [error, setError] = useState("");

  const isDealer = (roles[0] === true || roles[1] === true || roles[2] === true || roles[3] === true || roles[4] === true);
  const isIndustry = (roles[4] === true);
  function handleOpenTokenInfoModal(token) {
    setSelectedToken(token);
    setModalShow(true);
  }

  function handleOpenTrackerInfoModal(tracker) {
    setSelectedTracker(tracker);
    setModaltrackerShow(true);
    console.log(tracker)
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
    let newMyIssuedTrackers = [];

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
          "Carbon Tracker"
        ];

        // Fetch available and retired balances
        let balances = await getAvailableRetiredAndTransferred(
          provider,
          signedInAddress,
          i
        );
        let availableBalance = balances[0].toNumber();
        let retiredBalance = balances[1].toNumber();
        let transferredBalance = balances[2].toNumber();

        // Format decimal points for all tokens
        availableBalance = (availableBalance / 1000).toFixed(3);
        retiredBalance = (retiredBalance / 1000).toFixed(3)
        transferredBalance = (transferredBalance / 1000).toFixed(3);

        let totalIssued = "";
        try {
          totalIssued = tokenDetails.totalIssued.toNumber();
          totalIssued = (totalIssued / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Issued to number", tokenDetails.totalIssued);
          totalIssued = "";
        }

        let totalRetired = "";
        try {
          totalRetired = tokenDetails.totalRetired.toNumber();
          totalRetired = (totalRetired / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Retired to number", tokenDetails.totalRetired);
          totalRetired = "";
        }

        let token = {
          tokenId: tokenDetails.tokenId.toNumber(),
          tokenType: tokenTypes[tokenDetails.tokenTypeId - 1],
          availableBalance: availableBalance,
          retiredBalance: retiredBalance,
          transferredBalance: transferredBalance,
          issuer: tokenDetails.issuer,
          issuee: tokenDetails.issuee,
          fromDate: fromDate,
          thruDate: thruDate,
          automaticRetireDate: automaticRetireDate,
          metadata: tokenDetails.metadata,
          manifest: tokenDetails.manifest,
          description: tokenDetails.description,
          totalIssued: totalIssued,
          totalRetired: totalRetired,
        };

        // Push token to myBalances or myIssuedTokens in state
        if (token.availableBalance > 0 || token.retiredBalance > 0 || token.transferredBalance > 0) {
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

    try {
      // First, fetch number of unique tokens
      let numOfUniqueTrackers = (await getNumOfUniqueTrackers(provider)).toNumber();
      // Iterate over each tokenId and find balance of signed in address
      for (let i = 1; i <= numOfUniqueTrackers; i++) {
        // Fetch tracker details
        let trackerDetails = await getTrackerDetails(provider, i);
        console.log('--- trackerDetails', trackerDetails);

        // Format unix times to Date objects
        let fromDate = formatDate(trackerDetails.fromDate.toNumber());
        let thruDate = formatDate(trackerDetails.thruDate.toNumber());

        let totalEmissions = "";
        try {
          totalEmissions = trackerDetails.totalEmissions.toNumber();
          totalEmissions = (totalEmissions / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Issued to number", trackerDetails.totalEmissions);
          totalEmissions = "";
        }

        let totalAudited = "";
        try {
          totalAudited = trackerDetails.totalAudited.toNumber();
          totalAudited = (totalAudited / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Audited to number", trackerDetails.totalAudited);
          totalAudited = "";
        }

        let trackerIds = await getTrackerIds(provider, i);
        console.log('--- trackerIds', trackerIds);
        let totalOut=0;
        try {
          let tokenAmounts;
          let sourceTracker = 0;
          for (let j = 0; j <= trackerIds.length; j++) {
            tokenAmounts = await getTokenAmounts(provider,i,sourceTracker);
            for (let k = 0; k < tokenAmounts[2].length; k++) {
              

              totalOut += ( tokenAmounts[2][k].toNumber()/ 1000);
            }
            sourceTracker = trackerIds[j];
          }
          totalOut = totalOut.toFixed(3);
        } catch (error) {
          console.warn("Cannot convert tracker totalOut to number", totalOut);
          totalOut = "";
        }
        let ciAec = await getCarbonIntensity(provider,0,3);
        try {
          ciAec = ciAec.toNumber();
          ciAec = (ciAec / 1000000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Audited to number", trackerDetails.totalAudited);
          ciAec = "";
        }
        let ciVct = await getCarbonIntensity(provider,0,4);
        try {
          ciVct = ciVct.toNumber();
          ciVct = (ciVct / 1000000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Audited to number", trackerDetails.totalAudited);
          ciVct = "";
        }
        /*let totalOffset = "";
        try {
          totalOffset = trackerDetails.totalOffset.toNumber();
          totalOffset = (totalOffset / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Audited to number", trackerDetails.totalOffset);
          totalOffset = "";
        }*/

        let tracker = {
          trackerId: i,
          trackee: trackerDetails.trackee,
          fromDate: fromDate,
          thruDate: thruDate,
          metadata: trackerDetails.metadata,
          description: trackerDetails.description,
          totalEmissions: totalEmissions,
          totalAudited: totalAudited,
         //totalOffset: totalOffset,
          totalOut: totalOut,
          ciAec: ciAec,
          ciVct: ciVct,
          sourceTrackers: {
            trackerIds: [],
            trackerAmounts: [{
              /*0:{
                tokenIds: [],
                inAmounts: [],
                outAmounts: []
              }*/
            }],
            tokenIds: [],
            totalOut: [],
            totalTracked: []
          },
        };

        if (tracker.trackee.toLowerCase() === signedInAddress.toLowerCase()) {
          newMyIssuedTrackers.push({...tracker});
          //NFT.isMyIssuedTracker = true;
        }
      }

    } catch (error) {
      console.log(error);
      setError("Could not connect to carbon tracker contract on the selected network. Check your wallet provider settings.");
    }

    setMyBalances(newMyBalances);
    setMyIssuedTokens(newMyIssuedTokens);    
    setFetchingTokens(false);
    setMyIssuedTrackers(newMyIssuedTrackers);
    setFetchingTrackers(false);
    setError("");
  }, [provider, signedInAddress]);

  // If address and provider detected then fetch balances
  useEffect(() => {
    if (provider && signedInAddress) {
      if (myBalances !== [] && !fetchingTokens) {
        setFetchingTokens(true);
        setFetchingTrackers(true);
        fetchBalances();
      }
    }
  }, [provider, signedInAddress]);

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
      <TrackerInfoModal
        show={modalTrackerShow}
        provider={provider}
        tracker={selectedTracker}
        body="hello"
        onHide={() => {
          setModaltrackerShow(false);
          setSelectedTracker({});
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
                  <th>Transferred (carbon tracker)</th>
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
                      <td>{token.transferredBalance}</td>
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
      <div className={fetchingTrackers? "dimmed" : ""}>
        {/* Only display issued tokens if owner or dealer */}
        {(isIndustry) &&
          <div className="mt-4">
            <h4>Carbon Tracker Tokens You've Issued</h4>
            <Table hover size="sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Total Emissions</th>
                  <th>Total Audited</th>
                  <th>Tracker IDs</th>                  
                  {/* <th>Total Output</th>
                      <th>Outputs Tracked</th>*/}
                </tr>
              </thead>
              <tbody>
                {(myIssuedTrackers !== [] && !fetchingTrackers) &&
                  myIssuedTrackers.map((tracker) => (
                    <tr
                      key={tracker.trackerId}
                      onClick={() => handleOpenTrackerInfoModal(tracker)}
                      onMouseOver={pointerHover}
                    >
                      <td>{tracker.trackerId}</td>
                      <td>{tracker.description}</td>
                      <td>{tracker.totalEmissions}</td>
                      <td>{tracker.totalAudited}</td>
                      {/* <th>Total Output</th>
                          <th>Outputs Tracked</th>*/}
                      
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
