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
  const [trackersWithMyProducts, setTrackersWithMyProducts] = useState<Tracker[]>([]);


  const [fetchingMyIssuedTrackers, setFetchingMyIssuedTrackers] = useState(false);
  const [fetchingMyTrackers, setFetchingMyTrackers] = useState(false);
  const [fetchingTrackersWithMyProducts, setFetchingTrackersWithMyProducts] = useState(false);

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

    setFetchingMyIssuedTrackers(true);
    setFetchingMyTrackers(true);
    setFetchingTrackersWithMyProducts(true);
    //await fetchTrackers(page, pageSize, query);
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
    setFetchingMyIssuedTrackers(false);
  }, [signedInAddress]);*/

  const fetchTrackers = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {

    let newMyTrackers =[];
    let newMyIssuedTrackers = [];
    let newTrackersWithMyProducts =[];
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

        let divDecimals = result[4].toNumber();
        let carbonIntensity = result[3]/divDecimals;
        
        let productNames = result[5][0].map(String);
        let conversions = result[5][1].map((e:number)=>e/divDecimals);
        let units = result[5][2].map(String);

        let emissionFactors = [].map(String);

        let myTotalProductBalance = 0;
        let myProductsTotalEmissions = 0;
        let myTokenAmounts = []
        for (let i = 0; i < productAmounts.length; i++){
          myTokenAmounts = tokenAmounts.map((e:number) => (
            (e*myProductBalances[i]/totalProductAmounts).toFixed(0)));
          myProductsTotalEmissions += myProductBalances[i]*carbonIntensity ;

          productAmounts[i] = (productAmounts[i] * conversions[i] ).toFixed(0);
          myProductBalances[i] = (myProductBalances[i] * conversions[i] ).toFixed(0);
          available[i] = (available[i] * conversions[i] ).toFixed(0);

          myTotalProductBalance+=myProductBalances[i]; 
          
          emissionFactors[i] = (carbonIntensity / conversions[i]).toFixed(3);
        } 
        if(myTotalProductBalance>0){
          totalEmissions = myProductsTotalEmissions.toFixed(0);
          tokenAmounts = myTokenAmounts;
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
          products: {
            ids: productIds,
            myBalances: myProductBalances,
            names: productNames,
            amounts: productAmounts,
            available,
            emissionFactors,
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
        //console.log(myProductBalances)
        if (isIndustry && myTotalProductBalance>0) {
          newTrackersWithMyProducts.push({...tracker});
        }else{
          newMyIssuedTrackers.push({...tracker});
          //NFT.isMyIssuedTrackers = true;
        }
        
      }

    } catch (error) {
      console.log(error);
      setError("Could not connect to carbon tracker contract on the selected network. Check your wallet provider settings.");
    }

    // setMyBalances(newMyBalances);
    setFetchingMyIssuedTrackers(false);
    setFetchingMyTrackers(false);
    setFetchingTrackersWithMyProducts(false);
    setMyTrackers(newMyTrackers);
    setMyIssuedTrackers(newMyIssuedTrackers);
    setTrackersWithMyProducts(newTrackersWithMyProducts);
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
        if (
          (myIssuedTrackers !== [] && !fetchingMyIssuedTrackers)
          || (myTrackers !== [] && !fetchingMyTrackers)
          || (trackersWithMyProducts !== [] && !fetchingTrackersWithMyProducts)
          )
          {
          setFetchingMyIssuedTrackers(true);
          setFetchingMyTrackers(true);
          setFetchingTrackersWithMyProducts(true);
          // TO-DO imlplement postgres backend for storing and tracking traker data
          await fetchTrackers(page, pageSize, query);
          //await fetchBalances(balancePage, balancePageSize, balanceQuery);
        }
    } }
    init();
  }, [provider, signedInAddress]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  }

  function displayProduct(tracker: Tracker,productId:number,myProducts?:boolean){
    let amount = (myProducts ?
      tracker.products?.myBalances[productId]
      :tracker.products?.amounts[productId]
    )
    if(amount>0){
      let name = tracker.products?.names[productId];
      let units = tracker.products?.units[productId];
      return(
      <div key={tracker.trackerId+"ProductInfo"+productId}> 
        <div key={tracker.trackerId+name+productId+"Amount"}> 
          {name+": "+amount+" "+units};
        </div>
        <div key={tracker.trackerId+name+productId+"intensity"}>
          {tracker.products?.emissionFactors[productId]}
          {" kgCO2e/"+units}
        </div>
      </div>)
    }
  }


  function renderTrackersTable(trackers: Tracker[],fetching:boolean,
    provider?: Web3Provider,myProducts?:boolean){
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
        {(trackers !== [] && !fetching) &&
          trackers.map((tracker:Tracker) => (
            <tr key={tracker.trackerId}
              onClick={() => handleOpenTrackerInfoModal(tracker)}
              onMouseOver={pointerHover}
            >
              <td>{tracker.trackerId}</td>
              <td>{tracker.totalEmissions.toString()+" kgCO2e"}</td>
              <td>{tracker.products?.names?.map((name,i) => (
                <div key={tracker.trackerId+"ProductInfo"+i}>
                  {displayProduct(tracker,i,myProducts)}
                  {(isDealer && tracker.auditor=="0x0000000000000000000000000000000000000000") ?
                    <Button 
                      className="mb-3"
                      variant="outline-dark" 
                      href={"/addProduct/"+tracker.trackerId} >
                      Add product
                    </Button>
                    : null
                  }  
                  {
                    /* TO-DO the following conditional should be set to owner of the C-NFT 
                     since it can be transferred from the trackee to a distributor 
                     using the ERC721Upgradeable transfer function*/
                  }                  
                  {signedInAddress==tracker.trackee ?
                    <Button 
                      className="mb-3"
                      variant="outline-dark" 
                      href={"/productTransfer/"+tracker.trackerId} 
                    >Transfer</Button> 
                    : null
                  }
                </div>
              ))}</td>
              <td>
                <div key={"trackerId"+tracker.trackerId+"Description"}>{tracker.description}</div>
                {(tracker.auditor=="0x0000000000000000000000000000000000000000") ?
                  (<><Button 
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
                  </>)
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
            {isIndustry && myTrackers.length>0 ? <>
              <h4>My Trackers</h4>
              {renderTrackersTable(myTrackers,fetchingMyTrackers,provider)}</>
              : null 
            }
            {isDealer ? 
              <><h4>All Trackers {(displayAddress ? 'They' : 'You')}'{'ve'} Issued</h4>
              {renderTrackersTable(myIssuedTrackers,fetchingMyIssuedTrackers,provider)}</>
              :<><h4>Trackers with my product balances</h4> 
              {renderTrackersTable(trackersWithMyProducts,fetchingTrackersWithMyProducts,provider,true)}</>
            }
            {myIssuedTrackers.length !== 0 ? <Paginator 
              count={count}
              page={page}
              pageSize={pageSize}
              pageChangeHandler={handlePageChange}
              pageSizeHandler={handlePageSizeChange}
            /> : null}
          </div>
        }
      </div>
    </>
  );
}

export default forwardRef(IssuedTrackers);
