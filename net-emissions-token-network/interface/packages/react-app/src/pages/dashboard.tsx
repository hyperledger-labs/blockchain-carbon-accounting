// SPDX-License-Identifier: Apache-2.0
import {
  ChangeEvent,
  MouseEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  ForwardRefRenderFunction
} from "react";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import TokenInfoModal, { TokenInfo } from "../components/token-info-modal";
import { getBalances, countAuditorEmissionsRequests } from '../services/api.service';
import Paginator from "../components/paginate";
import QueryBuilder from "../components/query-builder";
import { BALANCE_FIELDS, TOKEN_TYPES } from "../components/static-data";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import DisplayTokenAmount from "../components/display-token-amount";
import Button from 'react-bootstrap/Button';
import { BsFunnel } from 'react-icons/bs';
import { Link } from "wouter";

type DashboardProps = {
  provider?: Web3Provider | JsonRpcProvider, 
  signedInAddress: string, 
  displayAddress: string,
  tokenid?: string
}

type DashboardHandle = {
  refresh: ()=>void
}

const Dashboard: ForwardRefRenderFunction<DashboardHandle, DashboardProps> = ({ signedInAddress, displayAddress, tokenid }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>({});

  // Balances of my tokens and tokens I've issued
  const [myBalances, setMyBalances] = useState<any[]>([]);
  const [fetchingTokens, setFetchingTokens] = useState(false);

  const [ balancePage, setBalancePage ] = useState(1);
  const [ balanceCount, setBalanceCount ] = useState(0);
  const [ balancePageSize, setBalancePageSize ] = useState(20);
  const [ balanceQuery, setBalanceQuery ] = useState<string[]>([]);

  const [ emissionsRequestsCount, setEmissionsRequestsCount ] = useState(0);

  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  async function handleBalancePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchBalances(value, balancePageSize, balanceQuery);
  }

  async function handleBalancePageSizeChanged(event: ChangeEvent<HTMLInputElement>) {
    await fetchBalances(1, parseInt(event.target.value), balanceQuery);
  }

  async function handleBalanceQueryChanged(_query: string[]) {
    await fetchBalances(balancePage, balancePageSize, _query);
  }

  // Allows the parent component to refresh balances on clicking the Dashboard button in the navigation
  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  function switchQueryBuilder() {
    setShowQueryBuilder(!showQueryBuilder);
  }

  async function handleRefresh() {
    // clear localStorage
    let localStorage = window.localStorage;
    localStorage.setItem('token_balances', '');
    await fetchBalances(balancePage, balancePageSize, balanceQuery);
  }

  useEffect(()=>{
    console.log('myBalances', myBalances);

  }, [myBalances]);

  const fetchBalances = useCallback(async (_balancePage: number, _balancePageSize: number, _balanceQuery: string[]) => {

    setFetchingTokens(true);

    let _balanceCount = 0;
    let newMyBalances = null;
    try {
      // get total count of balance
      const query = `issuedTo,string,${signedInAddress},eq`;
      const offset = (_balancePage - 1) * _balancePageSize;

      // this count means total number of balances
      let {count, balances} = await getBalances(offset, _balancePageSize, [..._balanceQuery, query]);
      console.log('balances?', balances);
      // this count means total pages of balances
      _balanceCount = count % _balancePageSize === 0 ? count / _balancePageSize : Math.floor(count / _balancePageSize) + 1;

      newMyBalances = balances.map((balance) => {
        return {
          ...balance,
          tokenId: balance.token.tokenId,
          tokenType: TOKEN_TYPES[balance.token.tokenTypeId - 1],
          availableBalance: balance.available,
          retiredBalance: balance.retired,
        }
      });
      setMyBalances(newMyBalances);
    } catch (error) {
      console.error(error);
      setMyBalances([]);
    }

    setBalanceCount(_balanceCount);
    setBalancePage(_balancePage);
    setBalancePageSize(_balancePageSize);
    setBalanceQuery(_balanceQuery);
    setFetchingTokens(false);

    return newMyBalances;
  }, [signedInAddress]);


  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      if (signedInAddress) {
        const bl = await fetchBalances(1, 20, []);
        if (bl && tokenid) {
          const tid = Number(tokenid);
          let ptoken = null;
          for (let i=0; i<bl.length; i++) {
            if (bl[i].token.tokenId === tid) {
              ptoken = bl[i].token;
            }
          }
          if (ptoken) {
            setSelectedToken({ ...ptoken });
            setModalShow(true);
          }
        }
      }
      let _emissionsRequestsCount = await countAuditorEmissionsRequests(signedInAddress);
      setEmissionsRequestsCount(_emissionsRequestsCount);
    }
    if (signedInAddress) {
      init();
    } else {
      // pending for signedInAddress. display the spinner ...
      setFetchingTokens(true);
    }
  }, [signedInAddress, tokenid, fetchBalances]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  }

  return (
    <>
      <TokenInfoModal
        show={modalShow}
        token={selectedToken}
        onHide={() => {
          setModalShow(false);
          setSelectedToken({});
        }}
      />
      <h2>Dashboard</h2>
      {(displayAddress) ? 
        <p className="mb-1">View token balances for {displayAddress}.</p>
        :
        <p className="mb-1">View your token balances.</p>
      }
      {(emissionsRequestsCount) ?
        <p className="mb-1">You have {emissionsRequestsCount} pending <Link href='/emissionsrequests'>emissions audits</Link>.</p>
        : null
      }
      <div className={(fetchingTokens && (!myBalances || myBalances.length === 0)) ? "dimmed" : ""}>

        {(fetchingTokens && (!myBalances || myBalances.length === 0)) && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}

        {(signedInAddress) &&
          <div className="mb-4">
            <h4 style={{display: 'inline'}}>{(displayAddress) ? 'Their' : 'Your'} Tokens&nbsp;</h4>
            <Button className="mb-3" onClick={switchQueryBuilder} variant={(showQueryBuilder) ? 'dark' : 'outline-dark'}><BsFunnel /></Button>
            <div hidden={!showQueryBuilder}>
              <QueryBuilder
                fieldList={BALANCE_FIELDS}
                handleQueryChanged={handleBalanceQueryChanged}
              />
            </div>

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
                {!!myBalances &&
                  myBalances.map((balance) => (
                    <tr
                      key={balance.token.tokenId}
                      onClick={() => {
                        setSelectedToken({
                          ...balance.token,
                          availableBalance: balance.availableBalance,
                          retiredBalance: balance.retiredBalance
                        });
                        setModalShow(true);
                      }}
                      onMouseOver={pointerHover}
                      className={`${(Number(balance.availableBalance) <= 0) ? "table-secondary" : ""}`}
                    >
                      <td>{balance.token.tokenId}</td>
                      <td>{balance.tokenType}</td>
                      <td><DisplayTokenAmount amount={balance.availableBalance}/></td>
                      <td><DisplayTokenAmount amount={balance.retiredBalance}/></td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            {myBalances.length !== 0 ?
              <Paginator
                count={balanceCount}
                page={balancePage}
                pageSize={balancePageSize}
                pageChangeHandler={handleBalancePageChange}
                pageSizeHandler={handleBalancePageSizeChanged}
                loading={fetchingTokens}
                /> : <></>}
          </div>
        }

      </div>
    </>
  );
}

export default forwardRef(Dashboard);
