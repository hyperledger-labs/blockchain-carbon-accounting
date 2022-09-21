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
import Button from 'react-bootstrap/Button';
import { BsFunnel } from 'react-icons/bs';
import { getOperators } from '../services/api.service';
import QueryBuilder from "../components/query-builder";
import Paginator from "../components/paginate";
import { ASSET_FIELDS } from "../components/static-data";
import type { Operator } from '@blockchain-carbon-accounting/data-postgres/src/models/oilAndGasAsset';
import OperatorInfoModal from "../components/operator-info-modal";


type OperatorsProps = {
  signedIn: string, 
}

type OperatorsHandle = {
  refresh: ()=>void
}

const Operators: ForwardRefRenderFunction<OperatorsHandle, OperatorsProps> = ({ signedIn }, ref) => {
  // Modal display and token it is set to
  const [modalShow, setModalShow] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | undefined>();
  const [selectedOperators, setSelectedOperators] = useState<Operator[]>([]);
  const [fetchingOperators, setFetchingOperators] = useState(false);
  //const [modalShow, setModalShow] = useState(false);
  const [error, setError] = useState("");

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, setQuery ] = useState<string[]>([]);

  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchOperators(value, pageSize, query);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchOperators(1, parseInt(event.target.value), query);
  }

  async function handleQueryChanged(_query: string[]) {
    await fetchOperators(1, pageSize,  _query);
  }

  function handleOpenOperatorInfoModal(operator: Operator) {
    setSelectedOperator(operator);
    setModalShow(true);
  }


  const fetchOperators = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {
    setFetchingOperators(true);

    let newOperators: Operator[] = [];
    let _issuedCount = 0;
    try {
      // First, fetch number of unique tokens
      const offset = (_page - 1) * _pageSize;

      // this count means total number of issued tokens
      /*const response = await fetch("/api/query/operators",{ 
        method: 'POST',
        headers: {
                'Content-Type': 'application/json',
        },
        body: JSON.stringify({offset:0,limit:_pageSize,queryBundles:
        [ *{
          *  field: 'operator',
          *  fieldType: 'string',
          *  value: 'chev',
          *  op: 'like',
          *}
        ]})
      });
      const operators = await response.json();*/
      let {operators, count} = await getOperators(offset, _pageSize, [..._query]);
      // this count means total pages of issued tokens
      _issuedCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;

      // Iterate over each tokenId and find balance of signed in address
      for (let i = 1; i <= operators.length; i++) {
        let operatorDetails = operators[i-1];
        if (!operatorDetails) continue;

        /*const operator: any = {
          ...operatorDetails,
          //tokenType: TOKEN_TYPES[tokenDetails.tokenTypeId - 1],
          //isMyIssuedToken: true
        };*/
        const operator:Operator = operatorDetails
        newOperators.push(operator);
      }


    } catch (error) {
      console.log(error);
      setError("Could not connect to contract on the selected network. Check your wallet provider settings.");
    }
    
    setSelectedOperators(newOperators);
    setFetchingOperators(false);
    setError("");
    setCount(_issuedCount);
    setPage(_page);
    setPageSize(_pageSize);
    setQuery(_query);
  },[]);
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
    //let localStorage = window.localStorage;
    //localStorage.setItem('token_balances', '');
    //await fetchBalances(balancePage, balancePageSize, balanceQuery);
  }

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      await fetchOperators(1, 20, []);
    }
    if (true || signedIn) {
      init();
    } else {
      // pending for signedInAddress. display the spinner ...
      setFetchingOperators(true);
    }
  }, [signedIn, fetchOperators]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  };

  return (
    <>
      {selectedOperator && <OperatorInfoModal
        show={modalShow}
        operator={selectedOperator}
        onHide={() => {
          setModalShow(false);
          setSelectedOperator(undefined);
        }}
      />}
      <p className="text-danger">{error}</p>

      <div className={fetchingOperators ? "dimmed" : ""}>

        {fetchingOperators && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}

        <div className="mt-4">
          <h2 style={{display: 'inline'}}>
            Operators&nbsp;
          </h2>
          &nbsp;
          <Button className="mb-3" onClick={switchQueryBuilder} variant={(showQueryBuilder) ? 'dark' : 'outline-dark'}><BsFunnel /></Button>
          <div hidden={!showQueryBuilder}>
            <QueryBuilder
              fieldList={ASSET_FIELDS}
              handleQueryChanged={handleQueryChanged}
            />
          </div>
          <Table hover size="sm">
            <thead>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {!!selectedOperators &&
                selectedOperators.map((operator) => (
                  <tr
                    key={operator.oil_and_gas_asset_operator}
                    onClick={() => handleOpenOperatorInfoModal(operator)}
                    onMouseOver={pointerHover}
                  >
                    <td>{operator.oil_and_gas_asset_operator}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
          {selectedOperators.length !== 0 ? <Paginator 
            count={count}
            page={page}
            pageSize={pageSize}
            pageChangeHandler={handlePageChange}
            pageSizeHandler={handlePageSizeChange}
            loading={fetchingOperators}
          /> : <></>}
        </div>
      </div>
    </>
  );
}

export default forwardRef(Operators);
