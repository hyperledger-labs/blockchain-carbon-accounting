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
import { InputGroup } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Table from "react-bootstrap/Table";
import {
  decodeDate,
  getNumOfUniqueTrackers,
  getRoles,
  getTrackerDetails,
  getCarbonIntensity,
  getTokenDetails,
  verifyTracker,
} from "../services/contract-functions";
import TrackerInfoModal from "../components/tracker-info-modal";
import { getBalances, getTokens, countAuditorEmissionsRequests } from '../services/api.service';
import Paginator from "../components/paginate";
import QueryBuilder from "../components/query-builder";
import { Balance, RolesInfo, Token, TOKEN_FIELDS, TOKEN_TYPES, Tracker } from "../components/static-data";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";

import { trpc } from "../services/trpc";
import { Wallet } from "../components/static-data";

type IssuedTrackersProps = {
  provider?: Web3Provider | JsonRpcProvider, 
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
  const [myTrackers, setMyTrackers] = useState<Tracker[]>([]);
  const [refTracker, setRefTracker] = useState<Tracker>();
  const [myIssuedTrackers, setMyIssuedTrackers] = useState<Tracker[]>([]);
  const [trackersWithMyProducts, setTrackersWithMyProducts] = useState<Tracker[]>([]);

  const [fetchingTrackers, setFetchingTrackers] = useState(false);

  const [address, setAddress] = useState("");
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);

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

  const [userWallet, setUserWallet] = useState<(Wallet)>();


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
    await fetchTrackers(page, pageSize, query);
    //await fetchBalances(balancePage, balancePageSize, balanceQuery);
  }

  async function fetchAddressRoles(provider: Web3Provider | JsonRpcProvider, address: string) {
    if (!address || !address.length) {
      setDisplayAddressIsDealer(false);
      setDisplayAddressIsIndustry(false);
    } else {
      const dRoles = await getRoles(provider, address);
      setDisplayAddressIsDealer(!!dRoles.hasDealerRole);
      setDisplayAddressIsIndustry(!!dRoles.hasIndustryRole);
    }
  }

  trpc.useQuery(['wallet.lookup', {query: signedInAddress}], {
    onSettled: (output, error) => {
      console.log('lookup query settled with', output?.wallets)
      if (output?.wallets) {
        setUserWallet([...output?.wallets][0])
      } 
    }
  })

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

    let newMyTrackers =[];
    let newRefTracker;
    let newMyIssuedTrackers = [];
    let newTrackersWithMyProducts =[];
    let _issuedCount = 0;

    try {
      // First, fetch number of unique tokens
      if(!provider) return;
      let numOfUniqueTrackers = (await getNumOfUniqueTrackers(provider)).toNumber();
      //console.log("TrackerDetails", numOfUniqueTrackers)
      // Iterate over each trackerId and find balance of signed in address
      let result;
      let trackerDetails;
      for (let i = 1; i <= numOfUniqueTrackers; i++) {
        // Fetch tracker details
        let tracker:Tracker|string 
          = await getTrackerDetails(provider, i, signedInAddress);
        console.log("TrackerDetails", tracker)
        if(typeof tracker === "object"){
          if (tracker.trackerId===4){
            newRefTracker = tracker;
          }
          if (tracker?.trackee?.toLowerCase() === signedInAddress.toLowerCase()) {
            newMyTrackers.push({...tracker});
          }
          if (tracker?.myProductsTotalEmissions>0) {
            newTrackersWithMyProducts.push({...tracker});
          }else{
            newMyIssuedTrackers.push({...tracker});
            //NFT.isMyIssuedTrackers = true;
          }
        }
      }
    } catch (error) {
      console.log(error);
      setError("Could not connect to carbon tracker contract on the selected network. Check your wallet provider settings.");
    }

    // setMyBalances(newMyBalances);
    setFetchingTrackers(false);
    setMyTrackers(newMyTrackers);
    setRefTracker(newRefTracker);
    setMyIssuedTrackers(newMyIssuedTrackers);
    setTrackersWithMyProducts(newTrackersWithMyProducts);
    setError("");
    setCount(_issuedCount);
    setPage(_page);
    setPageSize(_pageSize);
    setQuery(_query);
  }, [provider, signedInAddress, roles]);

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress) {
        if ((myTrackers !== [] 
          || myIssuedTrackers !== [] || trackersWithMyProducts !== []
          ) && !fetchingTrackers){
          console.log("fetching trackers")
          setFetchingTrackers(true);
          // TO-DO imlplement postgres backend for storing and tracking traker dataawait fetchTrackers(page, pageSize, query);
          await fetchTrackers(balancePage, balancePageSize, balanceQuery);

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
          {
            name+": "+tracker.products?.available[productId].toLocaleString('en-US')+" "+units
            //name+": "+amount+" ("+tracker.products?.available[productId]+") "+units
          }
        </div>
        <div key={tracker.trackerId+name+productId+"intensity"}>
            <>{tracker.products?.emissionFactors[productId]}
              {" kgCO2e/"+units}</>
        </div>
      </div>)
    }
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };
  function rowShading(emissionFactor: bigint){
    // TO-DO create an admin configurable reference tracking for product emissino factors
    // that share common units.
    let referenceEmissionFactor = refTracker?.products?.emissionFactors[1];
    if(!referenceEmissionFactor){return}

    let opacity = Number(BigInt(100) * (referenceEmissionFactor-emissionFactor) / referenceEmissionFactor) / 100;
    if(referenceEmissionFactor > emissionFactor){
      return 'rgba(60, 179, 113,'+opacity.toString()+')';
    }else if(referenceEmissionFactor < emissionFactor){
      return 'rgba(255, 99, 71,'+(-1*opacity).toString()+')';
    } else {
      return 'rgb(210, 210, 210, 0.5)';
    }
  }

  function renderTrackersTable(trackers: Tracker[],fetching:boolean,
    provider?: Web3Provider | JsonRpcProvider, myProducts?:boolean){
    if(trackers.length===0 || fetching){return}
    
    return (<><Table hover size="sm">
      <thead>
        <tr>
          <th>ID</th>
          <th>Total Emissions</th>
          <th>Products available </th>
          <th>Description</th>                  
        </tr>
      </thead>
      <tbody>
        {(trackers !== [] && !fetching) &&
          trackers.map((tracker:Tracker) => (
            <tr key={tracker.trackerId}
              style={{
                backgroundColor: rowShading(tracker?.products?.emissionFactors[1])
              }}
              onClick={() => handleOpenTrackerInfoModal(tracker)}
              onMouseOver={pointerHover}
            >
              <td>{tracker.trackerId}</td>
              <td>{tracker.totalEmissions.toLocaleString('en-US')+" kgCO2e"}</td>
              <td>{tracker.products?.ids?.map((productId,i) => (
                <div key={tracker.trackerId+"ProductInfo"+i}>
                  {displayProduct(tracker,i,myProducts)}  
                  {
                    /* TO-DO the following conditional should be set to owner of the C-NFT 
                     since it can be transferred from the trackee to a distributor 
                     using the ERC721Upgradeable transfer function*/
                  }       

                  { (signedInAddress.toLowerCase()===tracker.trackee.toLowerCase()
                    && tracker?.auditor.toLowerCase()
                      !=="0x0000000000000000000000000000000000000000"
                    && tracker.products?.available[i]>0) ?     
                    <Button 
                      className="mb-3"
                      variant="outline-dark" 
                      href={"/transferProduct/"+tracker.trackerId+"/"+productId} 
                    >Transfer</Button>
                    : null
                  }
                </div>
              ))}                  
              {(isDealer && tracker.auditor.toLowerCase()==="0x0000000000000000000000000000000000000000") ?
                <Button 
                  className="mb-3"
                  variant="outline-dark" 
                  href={"/addProduct/"+tracker.trackerId} 
                >Add product
                </Button>
                : null
              }</td>
              <td>
                <div key={"trackerId"+tracker.trackerId+"Description"}>{tracker.description}</div>
                {(isDealer && tracker.auditor=="0x0000000000000000000000000000000000000000") ?
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
            {(isIndustry && myTrackers.length>0 ? <>
              <h4>My Emission Certificates</h4>
              <h4>{"User: "+userWallet?.name}</h4> 
              {renderTrackersTable(myTrackers,fetchingTrackers,provider)}</> 
            : null)}
            {isDealer ? 
              <><h4>All Emission Certificates {(displayAddress ? 'They' : 'You')}'{'ve'} Issued</h4>
              {renderTrackersTable(myIssuedTrackers,fetchingTrackers,provider)}</>
              : null}
            {trackersWithMyProducts.length>0 ? 
              <><h4>Emission Certificates with My Product Balances </h4> 
              <h4>User: {userWallet?.name}</h4> 
              {renderTrackersTable(trackersWithMyProducts,fetchingTrackers,provider,true)}</>
              : null}
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
