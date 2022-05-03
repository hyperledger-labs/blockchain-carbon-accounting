// SPDX-License-Identifier: Apache-2.0
import {
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  MouseEvent,
  ChangeEvent
} from "react";
import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Table from "react-bootstrap/Table";
import {
  decodeDate,
  getNumOfUniqueTrackers,
  getRoles,
  getTrackerDetails,
  getTrackerIds,
  getCarbonIntensity,
  getTokenDetails,
  verifyTracker,
} from "../services/contract-functions";
import TrackerInfoModal from "../components/tracker-info-modal";
import { getBalances, getTokens, countAuditorEmissionsRequests } from '../services/api.service';
import Paginator from "../components/paginate";
import QueryBuilder from "../components/query-builder";
import { Balance, RolesInfo, Token, TOKEN_FIELDS, TOKEN_TYPES, Tracker } from "../components/static-data";
import { Web3Provider } from "@ethersproject/providers";

type IssuedTrackersProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  displayAddress: string,
  roles: RolesInfo
}

type IssuedTokensHandle = {
  refresh: ()=>void
}

let issuedType = 'issuedBy';


const IssuedTrackers: ForwardRefRenderFunction<IssuedTokensHandle, IssuedTrackersProps> = ({ provider, signedInAddress, roles, displayAddress }, ref) => {
  // Modal display and token it is set to
  const [modalTrackerShow, setModalTrackerShow] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState({});

  // Balances of my tokens and tokens I've issued
  const [myBalances, setMyBalances] = useState<Balance[]>([]);
  const [myIssuedTrackers, setMyIssuedTrackers] = useState<Tracker[]>([]);
  const [myTrackers, setMyTrackers] = useState<Tracker[]>([]);

  const [fetchingTrackers, setFetchingTrackers] = useState(false);
  const [fetchingMyTrackers, setFetchingMyTrackers] = useState(false);


  const [ emissionsRequestsCount, setEmissionsRequestsCount ] = useState(0);

  const [error, setError] = useState("");

  const isDealer = roles.hasDealerRole;
  const isIndustry = roles.hasIndustryRole;
  const [displayAddressIsDealer, setDisplayAddressIsDealer] = useState(false);
  const [displayAddressIsIndustry, setDisplayAddressIsIndustry] = useState(false);

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, setQuery ] = useState<string[]>([]);

  const [ balancePage, setBalancePage ] = useState(1);
  const [ balancePageSize, setBalancePageSize ] = useState(20);
  const [ balanceQuery, setBalanceQuery ] = useState<string[]>([]);

  // issue type : default issuedBy
  const onIssudTypeChanged = async (type: string) => {
    issuedType = type;
    await fetchTrackers(page, pageSize, query);
  }

  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchTrackers(value, pageSize, query);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchTrackers(1, parseInt(event.target.value), query);
  }

  async function handleQueryChanged(_query: string[]) {
    await fetchTrackers(page, pageSize,  _query);
  }

  function handleOpenTrackerInfoModal(tracker: Tracker) {
    setSelectedTracker(tracker);
    setModalTrackerShow(true);
  }


  // Allows the parent component to refresh balances on clicking the button in the navigation
  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  async function handleRefresh() {
    // clear localStorage
    let localStorage = window.localStorage;
    localStorage.setItem('token_balances', '');

    setFetchingTrackers(true);
    setFetchingMyTrackers(true);
    await fetchTrackers(page, pageSize, query);
    //await fetchBalances(balancePage, balancePageSize, balanceQuery);
  }

  async function fetchAddressRoles(provider: Web3Provider, address: string) {
    if (!address || !address.length) {
      setDisplayAddressIsDealer(false);
      setDisplayAddressIsIndustry(false);
    } else {
      const dRoles = await getRoles(provider, address);
      setDisplayAddressIsDealer(!!dRoles.hasDealerRole);
      setDisplayAddressIsIndustry(!!dRoles.hasIndustryRole);
    }
  }

  useEffect(() => {
    if(provider) fetchAddressRoles(provider, displayAddress);
  }, [provider, displayAddress])
  /*
  const fetchBalances = useCallback(async (_balancePage: number, _balancePageSize: number, _balanceQuery: string[]) => {
    let newMyBalances = [];

    try {
      // get total count of balance
      const query = `issuedTo,string,${signedInAddress},eq`;
      const offset = (_balancePage - 1) * _balancePageSize;

      // this count means total number of balances
      let {balances} = await getBalances(offset, _balancePageSize, [..._balanceQuery, query]);

      for (let i = 0; i < balances.length; i++) {
        const balance = balances[i];

        // cast time from long to date
        balance.token.fromDate = decodeDate(balance.token.fromDate);
        balance.token.thruDate = decodeDate(balance.token.thruDate);
        balance.token.dateCreated = decodeDate(balance.token.dateCreated);

        let token = {
          ...balance,
          tokenId: balance.token.tokenId,
          tokenType: TOKEN_TYPES[balance.token.tokenTypeId - 1],
          availableBalance: (balance.available / 1000).toFixed(3),
          retiredBalance: (balance.retired / 1000).toFixed(3),
        }
        newMyBalances.push(token);
      }
    } catch (error) {
      
    }

    setMyBalances(newMyBalances);
    setBalancePage(_balancePage);
    setBalancePageSize(_balancePageSize);
    setBalanceQuery(_balanceQuery);
    setFetchingTrackers(false);
  }, [signedInAddress]);*/

  const fetchTrackers = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {

    let newMyIssuedTrackers = [];
    let newMyTrackers =[];
    let _issuedCount = 0;
    

    try {
      // First, fetch number of unique tokens
      if(!provider) return;
      let numOfUniqueTrackers = (await getNumOfUniqueTrackers(provider)).toNumber();
      // Iterate over each tokenId and find balance of signed in address
      let result;
      let trackerDetails;
      for (let i = 1; i <= numOfUniqueTrackers; i++) {
        // Fetch tracker details
        let result = await getTrackerDetails(provider, i, signedInAddress);
        let trackerDetails =result[0][0];
        console.log('--- trackerDetails', result);

        // Format unix times to Date objects
        //let fromDate = decodeDate(trackerDetails.fromDate).toNumber();
        //let thruDate = decodeDate(trackerDetails?.thruDate).toNumber();

        let trackerIds = await getTrackerIds(provider, i);
        //console.log('--- trackerIds', trackerIds);
        let totalEmissions = (result[0][1]).toNumber();
        let totalProductAmounts = trackerDetails.totalProductAmounts.toNumber();

        let productIds = result[1][0].map(Number);
        let productAmounts = result[1][1].map(Number);
        let available = result[1][2].map(Number);
        let myProductBalances = result[6].map(Number);

        let tokenIds =result[2][0].map(Number)
        let tokenAmounts = result[2][1].map(String);

        let carbonIntensity = result[3];
        let divDecimals = result[4];

        let productNames = result[5][0].map(String);
        let conversions = result[5][1].map(Number);
        let units = result[5][2].map(String);

        let carbonIntensities = [0];

        for (let i = 0; i < productAmounts.length; i++){
          productAmounts[i] = (productAmounts[i] * conversions[i] / divDecimals ).toFixed(0);
          myProductBalances[i] = (myProductBalances[i] * conversions[i] / divDecimals ).toFixed(0);
          available[i] = (available[i] * conversions[i] / divDecimals ).toFixed(3);
          carbonIntensities[i] = (carbonIntensity / conversions[i] * divDecimals / 1000 / 1000);
        } 

        let tokenDetails = [];

        for (let i = 0; i < tokenIds.length; i++) {
          tokenDetails[i]= await getTokenDetails(provider,tokenIds[i]);
        }

        let tracker: Tracker = {
          trackerId: i,
          auditor: trackerDetails.auditor,
          trackee: trackerDetails.trackee,
          fromDate: Number(trackerDetails.fromDate),
          thruDate: Number(trackerDetails.thruDate),
          metadata: trackerDetails.metadata,
          description: trackerDetails.description,
          totalEmissions: totalEmissions,
          totalProductAmounts: totalProductAmounts,
          //totalOffset: totalOffset,
          carbonIntensity,
          divDecimals,
          products: {
            ids: productIds,
            myBalances: myProductBalances,
            names: productNames,
            amounts: productAmounts,
            available,
            carbonIntensities,
            //conversion,
            units,
          },
          tokens: {
            amounts: tokenAmounts,
            details: tokenDetails
          },
        };

        if (tracker.trackee.toLowerCase() === signedInAddress.toLowerCase()) {
          newMyTrackers.push({...tracker});
        }
        console.log(myProductBalances)
        if (myProductBalances?.length>0) {
          newMyIssuedTrackers.push({...tracker});
        }else{
          newMyIssuedTrackers.push({...tracker});
          //NFT.isMyIssuedTracker = true;
        }
        
      }

    } catch (error) {
      console.log(error);
      setError("Could not connect to carbon tracker contract on the selected network. Check your wallet provider settings.");
    }

    // setMyBalances(newMyBalances);
    setFetchingTrackers(false);
    setMyIssuedTrackers(newMyIssuedTrackers);
    setMyTrackers(newMyTrackers);
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
        if (myBalances !== [] && !fetchingTrackers) {
          setFetchingTrackers(true);
          // TO-DO imlplement postgres backend for storing and tracking traker data
          await fetchTrackers(page, pageSize, query);
          //await fetchBalances(balancePage, balancePageSize, balanceQuery);
        }
        let _emissionsRequestsCount = await countAuditorEmissionsRequests(signedInAddress);
        setEmissionsRequestsCount(_emissionsRequestsCount);
    } }
    init();
  }, [provider, signedInAddress]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  }

  function renderTrackersTable(trackers: Tracker[],fetchingTrackers:boolean,provider?: Web3Provider){
    return (<><Table hover size="sm">
      <thead>
        <tr>
          <th>ID</th>
          <th>Total Emissions</th>
          <th>Products: units </th>
          <th>Description</th>                  
        </tr>
      </thead>
      <tbody>
        {(trackers !== [] && !fetchingTrackers) &&
          trackers.map((tracker) => (
            <tr
              key={tracker.trackerId}
              onClick={() => handleOpenTrackerInfoModal(tracker)}
              onMouseOver={pointerHover}
            >
              <td>{tracker.trackerId}</td>
              <td>{tracker.totalEmissions.toString()+" kgCO2e"}</td>
              <td>{
                tracker.products?.names?.map((name,i) => (
                  <>
                    <div key={name+"amount"+i}><>
                      {name+": "}
                      {
                        (tracker.products?.myBalances[i]>0 ?
                          tracker.products?.myBalances[i]
                          : tracker.products?.amounts[i])
                      }{" "+tracker.products?.units[i]}
                      {signedInAddress==tracker.trackee ?
                        <Button 
                          className="mb-3"
                          variant="outline-dark" 
                          href={"/productTransfer/"+tracker.trackerId} 
                        >Transfer</Button> 
                      : null}
                    </></div>
                    <div key={name+"intensity"+i}>{tracker.products?.carbonIntensities[i].toFixed(0)}{" kgCO2e/"+tracker.products?.units[i]}</div>
                    {(isDealer && tracker.auditor=="0x0000000000000000000000000000000000000000") ?
                      <Button 
                        className="mb-3"
                        variant="outline-dark" 
                        href={"/addProduct/"+tracker.trackerId} >
                        Add product
                      </Button>
                      : null}
                  </>
                ))
              }</td>
              <td>
                <div>{tracker.description}</div>
                {(tracker.auditor=="0x0000000000000000000000000000000000000000") ?
                  (<div><Button 
                    className="mb-3"
                    variant="outline-dark" 
                    href={"/track/"+tracker.trackerId} >
                    Add token</Button>
                    {provider ? 
                      <Button 
                        className="mb-3"
                        variant="outline-dark" 
                        onClick={async() => await verifyTracker(provider, tracker.trackerId)}
                        //href={"/verifyTracker/"+tracker.trackerId} 
                      >Verify</Button> : null}
                  </div>)
                : null } 
              </td>
            </tr>
          ))}
      </tbody>
    </Table></>)
  }

  return (
    <>
      <TrackerInfoModal
        show={modalTrackerShow}
        tracker={selectedTracker}
        isDealer={isDealer}
        onHide={() => {
          setModalTrackerShow(false);
          setSelectedTracker({});
        }}
        provider={provider}
      />

      <p className="text-danger">{error}</p>


      <div>
        {/* Only display issued tokens if owner or dealer */}
        {
          <Button 
            className="mb-3"
            variant="outline-dark" 
            href="/track/0">
            Issue
          </Button> 
        }
        {
          //((!displayAddress && isIndustry) || (displayAddress && displayAddressIsIndustry)) &&
          <div className="mt-4">
            {isIndustry ? <>
              <h4>My Trackers</h4>
              {renderTrackersTable(myTrackers,fetchingTrackers,provider)}</>
              : null }
            {isDealer ?
              <h4>All Trackers {(displayAddress ? 'They' : 'You')}'{'ve'} Issued</h4>
            : <h4>Trackers with my product balances</h4> }
            {renderTrackersTable(myIssuedTrackers,fetchingTrackers,provider)}
            
            {myIssuedTrackers.length !== 0 ? <Paginator 
              count={count}
              page={page}
              pageSize={pageSize}
              pageChangeHandler={handlePageChange}
              pageSizeHandler={handlePageSizeChange}
            /> : <></>}
          </div>
        }
      </div>
    </>
  );
}

export default forwardRef(IssuedTrackers);
