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
  getRoles
} from "../services/contract-functions";
import TokenInfoModal from "./token-info-modal";
import TrackerInfoModal from "./tracker-info-modal";
import { getBalances } from '../services/api.service';
import Paginator from "./paginate";
import QueryBuilder from "./query-builder";
import { BALANCE_FIELDS } from "./static-data";


export const Dashboard = forwardRef(({ provider, signedInAddress, roles, displayAddress }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [modalTrackerShow, setModaltrackerShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState({});
  const [selectedTracker, setSelectedTracker] = useState({});

  // Balances of my tokens and tokens I've issued
  const [myBalances, setMyBalances] = useState([]);
  const [fetchingTokens, setFetchingTokens] = useState(false);

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

  async function handleBalancePageChange(event, value) {
    await fetchBalances(value, balancePageSize, balanceQuery);
  }

  async function handleBalancePageSizeChanged(event) {
    await fetchBalances(1, event.target.value, balanceQuery);

  }

  async function handleBalanceQueryChanged(_query) {
    await fetchBalances(balancePage, balancePageSize, _query);
  }

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

  async function handleRefresh() {
    // clear localStorage
    let localStorage = window.localStorage;
    localStorage.setItem('token_balances', null);

    setFetchingTokens(true);
    await fetchBalances(balancePage, balancePageSize, balanceQuery);
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


  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress) {
        if (myBalances !== [] && !fetchingTokens) {
          setFetchingTokens(true);
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
        <p className="mb-1">View token balances for {displayAddress}.</p>
        :
        <p className="mb-1">View your token balances.</p>
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


      </div>
    </>
  );
});

export default Dashboard;
