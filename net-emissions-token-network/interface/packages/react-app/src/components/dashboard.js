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
  getNumOfUniqueTrackers,
  getRoles,
  getTrackerDetails,
  getTrackerIds,
  getTokenAmounts,
  getCarbonIntensity
} from "../services/contract-functions";
import TokenInfoModal from "./token-info-modal";
import TrackerInfoModal from "./tracker-info-modal";
import { getBalances, getTokens } from '../services/api.service';
import Paginator from "./paginate";
import QueryBuilder from "./query-builder";
import { BALANCE_FIELDS, TOKEN_FIELDS } from "./static-data";


export const Dashboard = forwardRef(({ provider, signedInAddress, roles, displayAddress }, ref) => {
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
  const [displayAddressIsDealer, setDisplayAddressIsDealer] = useState(false);
  const [displayAddressIsIndustry, setDisplayAddressIsIndustry] = useState(false);

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, setQuery ] = useState([]);

  const [ balancePage, setBalancePage ] = useState(1);
  const [ balanceCount, setBalanceCount ] = useState(0);
  const [ balancePageSize, setBalancePageSize ] = useState(20);
  const [ balanceQuery, setBalanceQuery ] = useState([]);

  async function handlePageChange(event, value) {
    await fetchTokens(value, pageSize, query);
  }

  async function handlePageSizeChange(event) {
    await fetchTokens(1, event.target.value, query);
  }

  async function handleBalancePageChange(event, value) {
    await fetchBalances(value, balancePageSize, balanceQuery);
  }

  async function handleBalancePageSizeChanged(event) {
    await fetchBalances(1, event.target.value, balanceQuery);

  }

  async function handleQueryChanged(_query) {
    await fetchTokens(page, pageSize,  _query);
  }

  async function handleBalanceQueryChanged(_query) {
    await fetchBalances(balancePage, balancePageSize, _query);
  }

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
    fetchTokens(page, pageSize, query);
    fetchBalances(balancePage, balancePageSize, balanceQuery);
  }

  async function fetchAddressRoles(provider, address) {
    if (!address || !address.length) {
      setDisplayAddressIsDealer(false);
      setDisplayAddressIsIndustry(false);
    } else {
      const dRoles = await getRoles(provider, address);
      setDisplayAddressIsDealer((dRoles[0] === true || dRoles[1] === true || dRoles[2] === true || dRoles[3] === true || dRoles[4] === true));
      setDisplayAddressIsIndustry((dRoles[4] === true));
    }
  }

  useEffect(() => {
    fetchAddressRoles(provider, displayAddress);
  }, [provider, displayAddress])

  const fetchBalances = useCallback(async (_balancePage, _balancePageSize, _balanceQuery) => {
    let newMyBalances = [];
    // Format tokenType from tokenTypeId
    let tokenTypes = [
      "Renewable Energy Certificate",
      "Carbon Emissions Offset",
      "Audited Emissions",
      "Carbon Tracker"
    ];

    let _balanceCount = 0;
    try {
      // get total count of balance
      const query = `issuee,string,${signedInAddress},eq`;
      const offset = (_balancePage - 1) * _balancePageSize;

      // this count means total number of balances
      let {count, balances} = await getBalances(offset, _balancePageSize, [..._balanceQuery, query]);
      
      // this count means total pages of balances
      _balanceCount = count % _balancePageSize === 0 ? count / _balancePageSize : Math.floor(count / _balancePageSize) + 1;


      for (let i = 0; i < balances.length; i++) {
        const balance = balances[i];

        // cast time from long to date
        balance.token.fromDate = formatDate(balance.token.fromDate);
        balance.token.thruDate = formatDate(balance.token.thruDate);
        balance.token.dateCreated = formatDate(balance.token.dateCreated);
        balance.token.automaticRetireDate = formatDate(balance.token.automaticRetireDate);

        let token = {
          tokenId: balance.token.tokenId,
          token: balance.token,
          tokenType: tokenTypes[balance.token.tokenTypeId - 1],
          issuee: balance.issuee,
          availableBalance: (balance.available / 1000).toFixed(3),
          retiredBalance: (balance.retired / 1000).toFixed(3),
          transferredBalance: (balance.transferred / 1000).toFixed(3)
        }
        newMyBalances.push(token);
      }
    } catch (error) {
      
    }

    setMyBalances(newMyBalances);
    setBalanceCount(_balanceCount);
    setBalancePage(_balancePage);
    setBalancePageSize(_balancePageSize);
    setBalanceQuery(_balanceQuery);
    setFetchingTokens(false);
  }, [signedInAddress]);

  const fetchTokens = useCallback(async (_page, _pageSize, _query) => {

    let newMyIssuedTokens = [];
    let newMyIssuedTrackers = [];

    // Format tokenType from tokenTypeId
    let tokenTypes = [
      "Renewable Energy Certificate",
      "Carbon Emissions Offset",
      "Audited Emissions",
      "Carbon Tracker"
    ];
    let _issuedCount = 0;
    try {
      // First, fetch number of unique tokens
      const query = `issuer,string,${signedInAddress},eq`;
      const offset = (_page - 1) * _pageSize;

      // this count means total number of issued tokens
      let {tokens, count} = await getTokens(offset, _pageSize, [..._query, query]);
      
      // this count means total pages of issued tokens
      _issuedCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;
      
      // fetch token from database
      
      // my tokens
      // Iterate over each tokenId and find balance of signed in address
      for (let i = 1; i <= _pageSize; i++) {
        let tokenDetails = tokens[i-1];
        if (!tokenDetails) continue;
        console.log('--- tokenDetails', tokenDetails);

        let fromDate = formatDate(tokenDetails.fromDate);
        let thruDate = formatDate(tokenDetails.thruDate);
        let automaticRetireDate = formatDate(
          tokenDetails.automaticRetireDate
        );
        
        let totalIssued = "";
        try {
          totalIssued = tokenDetails.totalIssued;
          totalIssued = (totalIssued / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Issued to number", tokenDetails.totalIssued);
          totalIssued = "";
        }

        let totalRetired = "";
        try {
          totalRetired = tokenDetails.totalRetired;
          totalRetired = (totalRetired / 1000).toFixed(3);
        } catch (error) {
          console.warn("Cannot convert total Retired to number", tokenDetails.totalRetired);
          totalRetired = "";
        }

        let token = {
          tokenId: tokenDetails.tokenId,
          tokenType: tokenTypes[tokenDetails.tokenTypeId - 1],
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

    // setMyBalances(newMyBalances);
    setMyIssuedTokens(newMyIssuedTokens);    
    setFetchingTokens(false);
    setMyIssuedTrackers(newMyIssuedTrackers);
    setFetchingTrackers(false);
    setError("");
    setCount(_issuedCount);
    setPage(_page);
    setPageSize(_pageSize);
    setQuery(_query);
  }, [provider, signedInAddress]);

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress) {
        if (myBalances !== [] && !fetchingTokens) {
          setFetchingTokens(true);
          setFetchingTrackers(true);
          await fetchTokens(page, pageSize, query);
          await fetchBalances(balancePage, balancePageSize, balanceQuery);
        }
    } }
    init();
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
      {(displayAddress) ? 
        <p className="mb-1">View token balances and tokens issued for {displayAddress}.</p>
        :
        <p className="mb-1">View your token balances and tokens you've issued.</p>
      }

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
            <h4>{(displayAddress) ? 'Their' : 'Your'} Tokens</h4>
            <QueryBuilder 
              fieldList={BALANCE_FIELDS}
              handleQueryChanged={handleBalanceQueryChanged}
            />
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
                  myBalances.map((balance) => (
                    <tr
                      key={balance.token.tokenId}
                      onClick={() => handleOpenTokenInfoModal(balance.token)}
                      onMouseOver={pointerHover}
                      className={`${(Number(balance.availableBalance) <= 0) ? "table-secondary" : ""}`}
                    >
                      <td>{balance.token.tokenId}</td>
                      <td>{balance.tokenType}</td>
                      <td>{balance.availableBalance}</td>
                      <td>{balance.retiredBalance}</td>
                      <td>{balance.transferredBalance}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            {myBalances.length !== 0 ? <Paginator 
              count={balanceCount}
              page={balancePage}
              pageSize={balancePageSize}
              pageChangeHandler={handleBalancePageChange}
              pageSizeHandler={handleBalancePageSizeChanged}
            /> : <></>}
          </div>
        }

        {/* Only display issued tokens if owner or dealer */}
        {((!displayAddress && isDealer) || (displayAddress && displayAddressIsDealer)) &&
          <div className="mt-4">
            <h4>Tokens {(displayAddress) ? 'They' : 'You'}'ve Issued</h4>
            <QueryBuilder 
              fieldList={TOKEN_FIELDS}
              handleQueryChanged={handleQueryChanged}
            />
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
            {myIssuedTokens.length !== 0 ? <Paginator 
              count={count}
              page={page}
              pageSize={pageSize}
              pageChangeHandler={handlePageChange}
              pageSizeHandler={handlePageSizeChange}
            /> : <></>}
          </div>
        }
      </div>
      <div className={fetchingTrackers? "dimmed" : ""}>
        {/* Only display issued tokens if owner or dealer */}
        {((!displayAddress && isIndustry) || (displayAddress && displayAddressIsIndustry)) &&
          <div className="mt-4">
            <h4>Carbon Tracker Tokens {(displayAddress) ? 'They' : 'You'}'ve Issued</h4>
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
