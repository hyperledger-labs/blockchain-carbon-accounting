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
import Button from 'react-bootstrap/Button';
import Table from "react-bootstrap/Table";
import {
  getNumOfUniqueTrackers,
  getTrackerDetails,
  verifyTracker,
} from "../services/contract-functions";
import TrackerInfoModal from "../components/tracker-info-modal";
import Paginator from "../components/paginate";
import { RolesInfo, Tracker } from "../components/static-data";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";

import { trpc } from "../services/trpc";
import { Wallet, ProductToken } from "../components/static-data";

type IssuedTrackersProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string,
  displayAddress: string,
  roles: RolesInfo
}

type IssuedTokensHandle = {
  refresh: ()=>void
}


const IssuedTrackers: ForwardRefRenderFunction<IssuedTokensHandle, IssuedTrackersProps> = ({ provider, signedInAddress, roles, displayAddress }, ref) => {
  // Modal display and token it is set to
  const [modalTrackerShow, setModalTrackerShow] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker>();

  // Balances of my tokens and tokens I've issued
  const [myTrackers, setMyTrackers] = useState<Tracker[]>([]);
  const [refTracker, setRefTracker] = useState<Tracker>();
  const [myIssuedTrackers, setMyIssuedTrackers] = useState<Tracker[]>([]);
  const [trackersWithMyProducts, setTrackersWithMyProducts] = useState<Tracker[]>([]);

  const [fetchingTrackers, setFetchingTrackers] = useState(false);

  const [error, setError] = useState("");

  const isDealer = roles.hasDealerRole;
  const isIndustry = roles.hasIndustryRole;

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, setQuery ] = useState<string[]>([]);
  const [userWallet, setUserWallet] = useState<(Wallet)>();


  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchTrackers(value, pageSize, query);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchTrackers(1, parseInt(event.target.value), query);
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
  }

  trpc.useQuery(['wallet.lookup', {query: signedInAddress}], {
    onSettled: (output) => {
      console.log('lookup query settled with', output?.wallets)
      if (output?.wallets) {
        setUserWallet([...output?.wallets][0])
      }
    }
  })

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
      // Iterate over each trackerId and find balance of signed in address
      for (let i = 1; i <= numOfUniqueTrackers; i++) {
        // Fetch tracker details
        let tracker:Tracker | string
          = await getTrackerDetails(provider, i, signedInAddress);
        console.log('--- trackerDetails', tracker);
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
          }
        }
      }
    } catch (error) {
      console.log(error);
      setError("Could not connect to carbon tracker contract on the selected network. Check your wallet provider settings.");
    }

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
  }, [provider, signedInAddress]);

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {
      await fetchTrackers(1, 20, []);
    }
    if (signedInAddress) {
      init();
    } else {
      // pending for signedInAddress. display the spinner ...
      setFetchingTrackers(true);
    }
  }, [signedInAddress, fetchTrackers]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  }

  function displayProduct(trackerId: number,product:ProductToken,myProducts?:boolean){
    let amount = (myProducts ? product.myBalance : product.amount
    )
    if(amount>0){
      let name = product.name;
      let unit = product.unit;
      return(
      <div key={trackerId+"ProductInfo"+product.id}>
        <div key={trackerId+name+product.id+"Amount"}>
          {
            name+": "+Math.round(product.available).toLocaleString('en-US')+" "+unit
            //name+": "+amount+" ("+product.available+") "+unit
          }
        </div>
        <div key={trackerId+name+product.id+"intensity"}>
            <>{product.emissionFactor.toFixed(1)}
              {" kgCO2e/"+unit}</>
        </div>
      </div>)
    }
  }

  function rowShading(emissionFactor: number){
    // TO-DO create an admin configurable reference tracking for product emission factors
    // that share common units.
    let referenceEmissionFactor = refTracker?.products[1]?.emissionFactor;
    if(!referenceEmissionFactor){return}

    let opacity = 1-emissionFactor/referenceEmissionFactor;
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
                backgroundColor: rowShading(tracker?.products[1]?.emissionFactor)
              }}
              onClick={() => handleOpenTrackerInfoModal(tracker)}
              onMouseOver={pointerHover}
            >
              <td>{tracker.trackerId}</td>
              <td>{tracker.totalEmissions.toLocaleString('en-US')+" kgCO2e"}</td>
              <td>{tracker.products.map((product) => (
                <div key={tracker.trackerId+product.id}>
                  {displayProduct(tracker.trackerId,product,myProducts)}
                  {
                    /* TO-DO the following conditional should be set to owner of the C-NFT
                     since it can be transferred from the trackee to a distributor
                     using the ERC721Upgradeable transfer function*/
                  }

                  { (signedInAddress.toLowerCase()===tracker.trackee.toLowerCase()
                    && tracker?.auditor.toLowerCase()
                      !=="0x0000000000000000000000000000000000000000"
                    && product.available>0) ?
                    <Button
                      className="mb-3"
                      variant="outline-dark"
                      href={"/transferProduct/"+tracker.trackerId+"/"+product.id}
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
                {(isDealer && tracker.auditor === "0x0000000000000000000000000000000000000000") ?
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
      {selectedTracker! && <TrackerInfoModal
        show={modalTrackerShow}
        tracker={selectedTracker}
        isDealer={isDealer}
        onHide={() => {
          setModalTrackerShow(false);
          setSelectedTracker(undefined);
        }}
        provider={provider}
      />}

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
              <><h4>Emission certificates with my product balances</h4>
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
