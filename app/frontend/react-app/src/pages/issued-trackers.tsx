// SPDX-License-Identifier: Apache-2.0
import { 
  forwardRef, ForwardRefRenderFunction, useCallback, 
  useEffect, useImperativeHandle, useState, MouseEvent, 
  //ChangeEvent 
} from "react";
import Button from 'react-bootstrap/Button';
import Table from "react-bootstrap/Table";

import Row from 'react-bootstrap/Row';
import { FcCheckmark } from 'react-icons/fc';

import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton';

import { getNumOfUniqueTrackers, getTrackerDetails, verifyTracker } from "../services/contract-functions";
import TrackerInfoModal from "../components/tracker-info-modal";
//import Paginator from "../components/paginate";
import { RolesInfo, Tracker } from "../components/static-data";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";

import { trpc } from "../services/trpc";
import { Wallet, ProductToken } from "../components/static-data";

type SelectTrackers = 'my' | 'my_products' | 'issued' | 'unissued' | 'requested' | 'audited'

type IssuedTrackersProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string,
  displayAddress: string,
  operatorUuid?: string,
  roles: RolesInfo,
  _showTrackers?: SelectTrackers,
  handleTrackerSelect?:(tracker:Tracker|null) => void,
}

type IssuedTrackersHandle = {
  refresh: ()=>void
}


const IssuedTrackers: ForwardRefRenderFunction<IssuedTrackersHandle, IssuedTrackersProps> = ({ provider, signedInAddress, roles, displayAddress, handleTrackerSelect, operatorUuid, _showTrackers='issued'}, ref) => {
  
  const isDealer = roles.hasDealerRole;
  //const isIndustry = roles.hasIndustryRole;

  // Modal display and token it is set to
  const [modalTrackerShow, setModalTrackerShow] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker|null>();

  // Balances of my tokens and tokens I've issued
  const [myTrackers, setMyTrackers] = useState<Tracker[]>([]);
  const [refTracker, setRefTracker] = useState<Tracker>();
  const [issuedTrackers, setIssuedTrackers] = useState<Tracker[]>([]);
  const [unIssuedTrackers, setUnissuedTrackers] = useState<Tracker[]>([]);
  const [trackersIRequested, setTrackersICreated] = useState<Tracker[]>([]);
  const [trackersWithMyProducts, setTrackersWithMyProducts] = useState<Tracker[]>([]);
  //const [selectedTrackers, setSelecterTrackers] = useState<Tracker[]>([]);

  type TrackerSelectors = {key: SelectTrackers; value: string}
  // show and select show trakers
  let trackerSelectors:TrackerSelectors[] = [
    {key: 'issued', value: "issued"},
    {key: 'unissued', value: "requested"},
    {key: 'requested', value: "I requested"},
    
  ]
  if(roles.isAeDealer){trackerSelectors.push({key: 'audited', value: "I issued"})} 
  if(displayAddress===signedInAddress){
    trackerSelectors.concat([
      {key: 'my', value: 'issued to me'},
      {key: 'my_products',  value: 'for my products'}])
  } 

  localStorage.setItem('issueTo', displayAddress!)
  localStorage.setItem('issueFrom', signedInAddress!)
  localStorage.setItem('tokenTypeId', '4')

  const [showTrackers, setShowTrackers] = useState(_showTrackers);
  const [showTrackersLabel, setShowTrackersLabel] = useState(trackerSelectors[trackerSelectors.map(t=>t.key).indexOf(_showTrackers)].value);


  const [fetchingTrackers, setFetchingTrackers] = useState(false);

  const [error, setError] = useState("");

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  //const [ count, setCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, setQuery ] = useState<string[]>([]);
  const [ userWallet, setUserWallet ] = useState<(Wallet)>();


  /*async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchTrackers(value, pageSize, query);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchTrackers(1, parseInt(event.target.value), query);
  }*/

  function handleOpenTrackerInfoModal(tracker: Tracker) {
    if(tracker === selectedTracker){
      setSelectedTracker(null)
      handleTrackerSelect! && handleTrackerSelect(null);
    }
    else{
      setSelectedTracker(tracker)
      handleTrackerSelect! && handleTrackerSelect(tracker);
    };
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
    localStorage.setItem('issueTo', '');
    localStorage.setItem('issueFrom', '');
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

  const handleTrackersSelect = (index:string)=>{
    setShowTrackersLabel(trackerSelectors[Number(index)].value)
    setShowTrackers(trackerSelectors[Number(index)].key as SelectTrackers)
  }

  const fetchTrackers = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {

    let newMyTrackers:Tracker[] =[];
    let newRefTracker;
    let newIssuedTrackers:Tracker[] = [];
    let newTrackersICreated:Tracker[] = [];
    let newUnIssuedTrackers:Tracker[] = [];
    let newTrackersWithMyProducts:Tracker[] =[];
    //let _issuedCount = 0;

    try {
      // First, fetch number of unique tokens
      /* TO-DO implment below to getTrackers from api-server 
        instead of querying the blockchin direclty
        Requires setting up synchronized to read blockchain events TrackerUpdated, ProductsUpdated
      const query = `${issuedType},string,${signedInAddress},eq`;
      const offset = (_page - 1) * _pageSize;

      // this count means total number of issued tokens
      let {trackers, count} = await getTrackers(offset, _pageSize, [..._query, query]);

      _issuedCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;
      // Iterate over each trackerId and find balance of signed in address
      for (let i = 1; i <= _pageSize; i++) {
        // Fetch tracker details
        let trackerDetails = trackers[i-1]//:Tracker | string
        if (!trackerDetails) continue;

        const tracker: Tracker = {
          ...trackerDetails,
          tokenType: TOKEN_TYPES[tokenDetails.tokenTypeId - 1],
          isMyIssuedToken: true
        };

      */
      if(!provider) return;
      const numOfUniqueTrackers = (await getNumOfUniqueTrackers(provider)).toNumber();
      // Iterate over each trackerId and find balance of signed in address
      for (let i = 1; i <= numOfUniqueTrackers; i++) {
        // Fetch tracker details
        const tracker:Tracker | string
          = await getTrackerDetails(provider, i, signedInAddress);
        //console.log('--- trackerDetails', tracker, displayAddress);
        

        if(typeof tracker === "object"){
          const metadata = JSON.parse(tracker.metadata as any) 
          if([null,undefined,'0','0x0000000000000000000000000000000000000000'].includes(displayAddress)
            || (tracker.trackee.toLowerCase()===displayAddress.toLowerCase()
            && metadata?.operator_uuid === operatorUuid)
          ){
            if (tracker.trackerId===4){
              newRefTracker = tracker;
            }
            if (tracker?.trackee?.toLowerCase() === signedInAddress.toLowerCase()) {
              newMyTrackers.push({...tracker});
            }else if (tracker?.createdBy?.toLowerCase() === signedInAddress.toLowerCase()) {
              newTrackersICreated.push({...tracker});
            }
            else if (tracker?.myProductsTotalEmissions!>0) {
              newTrackersWithMyProducts.push({...tracker});
            }
            if(tracker.auditor!=="0x0000000000000000000000000000000000000000"){
              newIssuedTrackers.push({...tracker});
            }else{
              newUnIssuedTrackers.push({...tracker});
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
      setError("Could not connect to carbon tracker contract on the selected network. Check your wallet provider settings.");
    }
    // exclude trackersWithMyProducts that overlap with myTrackers
    newTrackersWithMyProducts = newTrackersWithMyProducts.filter(o1 => !newMyTrackers.some(o2 => o1.trackerId === o2.trackerId))

    setFetchingTrackers(false);
    setMyTrackers(newMyTrackers);
    setRefTracker(newRefTracker);
    setIssuedTrackers(newIssuedTrackers);
    setUnissuedTrackers(newUnIssuedTrackers);
    setTrackersICreated(newTrackersICreated);
    setTrackersWithMyProducts(newTrackersWithMyProducts);
    setError("");
    //setCount(_issuedCount);
    setPage(_page);
    setPageSize(_pageSize);
    setQuery(_query);
  }, [provider, signedInAddress, displayAddress, operatorUuid]);

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

  function displayProduct(tracker: Tracker, product: ProductToken){
    let amount = (showTrackers==='my' ? product.myBalance : product.unitAmount
    )
    if(amount!>0){
      let name = product.name;
      let unit = product.unit;
      return(
      <Row key={tracker.trackerId+"ProductInfo"+product.productId}>
        <Row key={tracker.trackerId+name+product.productId+"Amount"}>
          {
            name+": "+Math.round(product.unitAmount!).toLocaleString('en-US')+" "+unit
          }
          <span>{product.myBalance!>0 && product.myBalance !== product.unitAmount && (
            "My balance = "+Math.round(product.myBalance!).toLocaleString('en-US')+" "+unit
          )}</span>
        </Row>
        <Row key={tracker.trackerId+name+product.productId+"intensity"}>
            <>{product.emissionsFactor!.toFixed(1)}
              {" kgCO2e/"+unit}</>
        </Row>

        <Row sm={12} xs={12}>
          {
            /* TO-DO the following conditional should be set to owner of the C-NFT
             since it can be transferred from the trackee to a distributor
             using the ERC721Upgradeable transfer function*/
          }
          { ((signedInAddress.toLowerCase()===tracker.trackee.toLowerCase() && product.available>0) || product?.myBalance!>0) && tracker?.auditor.toLowerCase()!=="0x0000000000000000000000000000000000000000"
            && <Button className="mb-3" variant="outline-dark" href={"/transferProduct/"+tracker.trackerId+"/"+product.productId} >Transfer</Button>
          }
        </Row>
      </Row>)
    }
  }

  function rowShading(emissionsFactor: number){
    // TO-DO create an admin configurable reference tracking for product emission factors
    // that share common units.
    const referenceEmissionFactor = refTracker?.products![1]?.emissionsFactor!;
    if(!referenceEmissionFactor){return}

    let opacity = 1-emissionsFactor/referenceEmissionFactor;
    if(referenceEmissionFactor > emissionsFactor){
      return 'rgba(60, 179, 113,'+opacity.toString()+')';
    }else if(referenceEmissionFactor < emissionsFactor){
      return 'rgba(255, 99, 71,'+(-1*opacity).toString()+')';
    } else {
      return 'rgb(210, 210, 210, 0.5)';
   }
  }

  function renderTrackersTable(trackers: Tracker[], fetching:boolean, provider?: Web3Provider | JsonRpcProvider){
    if(trackers.length===0 || fetching){return}

    return(<Table hover size="sm" key={showTrackers+"Table"}>
      <thead>
        <tr>
          <th>ID</th>
          <th>{(showTrackers==='my_products' ? "My Emissions":"Total Emissions")+' kg CO2e'}</th>
          <th>Products</th>
          <th>Description</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {(trackers !== [] && !fetching) &&
          trackers.map((tracker:Tracker) => (
            <tr key={tracker.trackerId+showTrackers} style={{ backgroundColor: rowShading(tracker?.products![1]?.emissionsFactor!)}} onClick={() => handleOpenTrackerInfoModal(tracker)} onMouseOver={pointerHover}>
              
              <td>{tracker.trackerId===selectedTracker?.trackerId! && <FcCheckmark/>}{tracker.trackerId}</td>
              <td>{showTrackers === 'my_products' ? tracker?.myProductsTotalEmissions!.toLocaleString('en-US') : tracker.totalEmissions.toLocaleString('en-US')}
                {(isDealer && tracker.auditor === "0x0000000000000000000000000000000000000000") && '\n' &&
                  <p><Button className="mb-3" variant="outline-dark" href={"/track/"+tracker.trackerId}> Add emissions</Button></p>
                }
              </td>
              <td>{tracker.products!.map((product) => (
                  displayProduct(tracker,product)
              ))}
              {(isDealer && tracker.auditor.toLowerCase()==="0x0000000000000000000000000000000000000000") &&
                <Button className="mb-3" variant="outline-dark" href={"/addProduct/"+tracker.trackerId}>Add product</Button>
              }</td>
              <td>
                <span key={"trackerId"+tracker.trackerId+"Description"}>{tracker.description}</span>
              </td>
              <td>{provider && roles.isAeDealer && <Button className="mb-3" variant="outline-dark" onClick={async() => await verifyTracker(provider, tracker.trackerId)}>Verify</Button>}</td>
            </tr>)
        )}
      </tbody>
    </Table>)
  }

  return (
    <>
      {selectedTracker! && <TrackerInfoModal
        show={modalTrackerShow}
        tracker={selectedTracker}
        isDealer={isDealer}
        onHide={() => {
          setModalTrackerShow(false);
        }}
        provider={provider}
      />}

      <p className="text-danger">{error}</p>

      {(issuedTrackers?.length>0||unIssuedTrackers?.length>0) && <>
        <Dropdown style={{display: 'inline'}}>
          <DropdownButton title={"Emission certificates "+(showTrackers ? showTrackersLabel : "Select Trackers")} style={{display: 'inline'}} id="dropdown-menu-align-right" onSelect={(value) => { handleTrackersSelect(value!)}}>
            { trackerSelectors.map((labelObj,index) => (<Dropdown.Item key={labelObj.key} eventKey={index}>{labelObj.value}</Dropdown.Item>))}
          </DropdownButton>
        </Dropdown>
      </>}

      {isDealer && <Button style={{display: 'inline'}} className="mb-3" variant="outline-dark" href={`/track/${selectedTracker?.trackerId || 0}`}> Request performance certificate </Button>}
      <div className="mt-4">
        {showTrackers==='my' && <>
          <h4>{myTrackers.length>0 ? "My emission certificates: "+userWallet?.name : "No Trackers Issued"}</h4>
          {renderTrackersTable(myTrackers,fetchingTrackers,provider)}
        </>}
        {showTrackers==='my_products' &&
          trackersWithMyProducts.length===0 ? <h4>None Available</h4> :
          renderTrackersTable(trackersWithMyProducts,fetchingTrackers,provider)
        }
        {showTrackers==='issued' && issuedTrackers.length>0 && <>
          {renderTrackersTable(issuedTrackers,fetchingTrackers,provider)}
        </>}
        {showTrackers==='unissued' && unIssuedTrackers.length>0 && <>
          {renderTrackersTable(unIssuedTrackers,fetchingTrackers,provider)}
        </>}
        {showTrackers==='requested' && trackersIRequested.length>0 && <>
          {renderTrackersTable(trackersIRequested,fetchingTrackers,provider)}
        </>}
        {/*issuedTrackers.length !== 0 ? <Paginator
          count={count}
          page={page}
          pageSize={pageSize}
          pageChangeHandler={handlePageChange}
          pageSizeHandler={handlePageSizeChange}
        /> : null*/}
      </div>
    </>
  );
}

export default forwardRef(IssuedTrackers);
