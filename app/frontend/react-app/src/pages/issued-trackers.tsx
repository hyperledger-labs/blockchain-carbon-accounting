// SPDX-License-Identifier: Apache-2.0
import { 
  forwardRef, ForwardRefRenderFunction, useCallback, 
  useEffect, useImperativeHandle, useState, MouseEvent, 
  ChangeEvent 
} from "react";
import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Table from "react-bootstrap/Table";

import Row from 'react-bootstrap/Row';
import { FcCheckmark } from 'react-icons/fc';
import { GiOilDrum } from 'react-icons/gi';
import { IoIosFlame } from 'react-icons/io';
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton';

import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";

import { verifyTracker } from "../services/contract-functions";
//getNumOfUniqueTrackers, getTrackerDetails, 

import { getTrackers,getTracker } from '../services/api.service';
//import { trpc } from "../services/trpc";

import TrackerInfoModal from "../components/tracker-info-modal";
import Paginator from "../components/paginate";
import { RolesInfo, Tracker, ProductToken } from "../components/static-data";

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

  const [refTracker, setRefTracker] = useState<Tracker>();
  const [selectedTrackers, setSelectedTrackers] = useState<Tracker[]>([]);

  type TrackerSelectors = {key: SelectTrackers; value: string}
  // show and select show trakers
  let trackerSelectors:TrackerSelectors[] = [
    {key: 'issued', value: "issued"},
    {key: 'unissued', value: "requested"},
    {key: 'requested', value: "I requested"},
  ]
  if(roles.isAeDealer){trackerSelectors.push({key: 'audited', value: "I issued"})} 
  if(signedInAddress){
    trackerSelectors.push(
      {key: 'my', value: 'issued to me'},
      //{key: 'my_products',  value: 'for my products'}
    )
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
  const [ pagesCount, setPagesCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, ] = useState<string[]>(operatorUuid ? [`operatorUuid,string,${operatorUuid},eq,true`] : []);
  //const [ userWallet, setUserWallet ] = useState<(Wallet)>();

  async function handlePageChange(_: ChangeEvent<HTMLInputElement>, value: number) {
    await fetchTrackers(value, pageSize, query);
  }

  async function handlePageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    await fetchTrackers(1, parseInt(event.target.value), query);
  }

  function handleOpenTrackerInfoModal(tracker: Tracker) {
      if(tracker === selectedTracker){
        setSelectedTracker(null)
        if(handleTrackerSelect) handleTrackerSelect! && handleTrackerSelect(null);
      }
      else{
        setSelectedTracker(tracker)
        if(handleTrackerSelect) handleTrackerSelect! && handleTrackerSelect(tracker);
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

  /*trpc.useQuery(['wallet.lookup', {query: signedInAddress}], {
    onSettled: (output) => {
      console.log('lookup query settled with', output?.wallets)
      if (output?.wallets) {
        setUserWallet([...output?.wallets][0])
      }
    }
  })*/

  const fetchTrackers = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {
    setFetchingTrackers(true);
    const { tracker } = await getTracker(3);
    setRefTracker(tracker);

    let newSelectedTrackers:Tracker[]=[];
    let _pagesCount = 0;

    try {
      // First, fetch number of unique tokens
      /* TO-DO implment below to getTrackers from api-server 
        instead of querying the blockchin direclty
        Requires setting up synchronized to read blockchain events TrackerUpdated, ProductsUpdated
       */
      
      let newQuery:string[] = [];
      //console.log(showTrackers)
      switch(showTrackers){
        case 'issued':
          newQuery = _query.concat([`auditor,string,0x0000000000000000000000000000000000000000,neq,true`])
          break
        case 'unissued':
          newQuery = _query.concat([`auditor,string,0x0000000000000000000000000000000000000000,eq,true`])
          break
        case 'requested':
          newQuery = _query.concat([`createdBy,string,${signedInAddress},like,true`])
          break
        case 'audited':
          newQuery = _query.concat([`auditor,string,${signedInAddress},like,true`])
          break
        case 'my':
          newQuery = _query.concat([`trackee,string,${signedInAddress},like,true`])
          break
        case 'my_products':
          newQuery = _query.concat([`trackee,string,${signedInAddress},like,true`])
          break
        //default:
      }

      const offset = (_page - 1) * _pageSize;

      // this count means total number of issued tokens
      const {trackers, count} = await getTrackers(offset, _pageSize, newQuery);
      console.log('Trackers:', trackers)
      _pagesCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;
      // Iterate over each trackerId and find balance of signed in address
      for (let i = 1; i <= _pageSize; i++) {
        // Fetch tracker details
        let trackerDetails = trackers[i-1]//:Tracker | string
        if (!trackerDetails) continue;
  
        const tracker: Tracker = {...trackerDetails};
        newSelectedTrackers.push(tracker)
      }
      
      /*if(!provider) return;
      const numOfUniqueTrackers = (await getNumOfUniqueTrackers(provider)).toNumber();
      // Iterate over each trackerId and find balance of signed in address
      for (let i = 1; i <= numOfUniqueTrackers; i++) {
        // Fetch tracker details
        const tracker:Tracker | string
          = await getTrackerDetails(provider, i, signedInAddress);
        console.log('--- trackerDetails', tracker, displayAddress);
        if ((tracker as Tracker)?.trackerId===3){
          newRefTracker = tracker as Tracker;
          //console.log("ref tracker", newRefTracker)
        }        

        if(typeof tracker === "object"){
          const metadata = tracker?.metadata as any;
          if([null,undefined,'0','0x0000000000000000000000000000000000000000'].includes(displayAddress)
            || (tracker.trackee.toLowerCase()===displayAddress.toLowerCase()
            && (metadata?.operator_uuid === operatorUuid || !metadata?.operator_uuid))
          ){
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
      }*/
      
    } catch (error) {
      console.log(error);
      setError("Could not get emission certificates from the databse.");
    }

    setFetchingTrackers(false);
    setSelectedTrackers(newSelectedTrackers)
    setError("");
    setPagesCount(_pagesCount);
    setPage(_page);
    setPageSize(_pageSize);
    //setQuery(_query);
  }, [ showTrackers, signedInAddress ]);


  const handleTrackersSelect = async (index:string) => {
    setShowTrackersLabel(trackerSelectors[Number(index)].value)
    setShowTrackers(trackerSelectors[Number(index)].key as SelectTrackers)
    setFetchingTrackers(true);
    await fetchTrackers(1, pageSize, query);
  }

  // If address and provider detected then fetch balances
  useEffect(() => {
    const init = async () => {

      await fetchTrackers(1, 20, query);
    }
    if (signedInAddress) {
      init();
    } else {
      // pending for signedInAddress. display the spinner ...
      setFetchingTrackers(true);
    }
  }, [signedInAddress, fetchTrackers, query, setFetchingTrackers]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  }

  function displayProduct(tracker: Tracker, product: ProductToken,signedInAddress: string){
    //const amount = (showTrackers==='my' ? product.myBalance : product.unitAmount)
    const amount = product.unitAmount
    if(amount!>0){
      const name = product.name.toLowerCase();
      const unit = product.unit;
      return(
      <Row key={tracker.trackerId+"ProductInfo"+product.productId}>
        <span key={tracker.trackerId+name+product.productId+"Amount"}>
          <span>{name === 'oil'&& <GiOilDrum/>}{name === 'gas'&& <IoIosFlame/>}{`${Math.round(product.unitAmount!).toLocaleString('en-US')} ${unit}`}</span>
          <span>{product.myBalance!>0 && product.myBalance !== product.unitAmount && (
            "My balance = "+Math.round(product.myBalance!).toLocaleString('en-US')+" "+unit
          )}</span>&nbsp;

          { ((signedInAddress.toLowerCase()===tracker.trackee.toLowerCase() && Number(product.available)>0) || product?.myBalance! > 0) && tracker?.auditor.toLowerCase()!=="0x0000000000000000000000000000000000000000"
            && <Button variant="outline-dark" href={"/transferProduct/"+tracker.trackerId+"/"+product.productId} >Transfer</Button>
          }
          {/*<Row key={tracker.trackerId+name+product.productId+"intensity"}>
              <>{product.emissionsFactor!.toFixed(1)}
                {" kgCO2e/"+unit}</>
          </Row>*/}

          {
            /* TO-DO the following conditional should be set to owner of the C-NFT
             since it can be transferred from the trackee to a distributor
             using the ERC721Upgradeable transfer function*/
          }
        </span>
      </Row>)
    }
  }

  function rowShading(products: ProductToken[]){
    // TO-DO create an admin configurable reference tracking for product emission factors that share common units.
    let referenceEmissionsFactor; 
    if(refTracker?.products && refTracker?.products.length!>0){
      referenceEmissionsFactor = refTracker?.products[0]?.emissionsFactor!;
    }
    if(!referenceEmissionsFactor){return}
    if(products?.length>0){
      let emissionsFactor = products[0]?.emissionsFactor!
      let opacity = 1-emissionsFactor/referenceEmissionsFactor;
      if(referenceEmissionsFactor > emissionsFactor){
        return 'rgba(60, 179, 113,'+opacity.toString()+')';
      }else if(referenceEmissionsFactor < emissionsFactor){
        return 'rgba(255, 99, 71,'+(-1*opacity).toString()+')';
      } else {
        return 'rgb(210, 210, 210, 0.5)';
      }
    }
    return
  }

  function renderTrackersTable(trackers: Tracker[], fetching:boolean, provider?: Web3Provider | JsonRpcProvider){
    if(trackers.length===0 || fetching){return}

    return(<Table hover size="sm" key={showTrackers+"Table"}>
      <thead>
        <tr>
          <th>ID</th>
          <th>{(showTrackers==='my_products' ? "My Emissions":"Emissions")+', tons CO2e'}</th>
          <th>Products</th>
          <th>Description</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {(!fetching) &&
          trackers!.map((tracker:Tracker) => (
            <tr key={tracker?.trackerId+showTrackers} style={{ borderTopWidth: '5px', borderColor: rowShading(tracker?.products!)}} onClick={() => handleOpenTrackerInfoModal(tracker)} onMouseOver={pointerHover}>
              
              <td>{tracker.trackerId===selectedTracker?.trackerId! && <FcCheckmark/>}{tracker.trackerId}</td>
              <td>{showTrackers === 'my_products' ? (Number(tracker?.myProductsTotalEmissions!)/1000.0).toLocaleString('en-US') : (Number(tracker?.totalEmissions!)/1000.0).toLocaleString('en-US')}
                <p><b style={{backgroundColor: rowShading(tracker?.products!)}}>{tracker?.products && tracker?.products?.length>0 && tracker?.products[0]?.emissionsFactor?.toLocaleString('en-US')+" kgCO2e/"+tracker?.products[0]?.unit!}</b></p>
                {(isDealer && tracker.auditor === "0x0000000000000000000000000000000000000000") && '\n' && 
                  <p><Button className="mb-3" variant="outline-dark" href={"/track/"+tracker.trackerId}> Add emissions</Button></p>
                }
              </td>
              <td>{tracker?.products?.map((product) => (
                  displayProduct(tracker,product,signedInAddress)
              ))}
              {(isDealer && tracker.auditor.toLowerCase()==="0x0000000000000000000000000000000000000000") &&
                <Button className="mb-3" variant="outline-dark" href={"/addProduct/"+tracker.trackerId}>Add product</Button>
              }</td>
              <td>
                { signedInAddress.toLowerCase()===tracker.trackee.toLowerCase() && tracker?.auditor.toLowerCase()!=="0x0000000000000000000000000000000000000000"
                  && <Button disabled={true} variant="outline-dark" href={"/transferTracker/"+tracker.trackerId} >Transfer Certificate</Button>
                }
                &nbsp;<span key={"trackerId"+tracker.trackerId+"Description"}>{tracker.description}</span>
              </td>
              <td>{provider && roles.isAeDealer && <Button className="mb-3" variant="outline-dark" onClick={async() => await verifyTracker(provider, tracker.trackerId)}>Verify</Button>}</td>
            </tr>)
        )}
      </tbody>
    </Table>)
  }

  return (
    <div className={fetchingTrackers ? "dimmed" : ""}>
      {fetchingTrackers && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
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

      
      <Dropdown style={{display: 'inline'}}>
        <DropdownButton title={"Emission certificates "+(showTrackers ? showTrackersLabel : "Select Trackers")} style={{display: 'inline'}} id="dropdown-menu-align-right" onSelect={async (value) => { await handleTrackersSelect(value!)}}>
          { trackerSelectors.map((labelObj,index) => (<Dropdown.Item key={labelObj.key} eventKey={index}>{labelObj.value}</Dropdown.Item>))}
        </DropdownButton>
      </Dropdown>

      {isDealer && <Button style={{display: 'inline'}} className="mb-3" variant="outline-dark" href={`/track/${selectedTracker?.trackerId || 0}`}> Request certificate </Button>}
      <div className="mt-4">

        {selectedTrackers.length===0 ? <h4>None Available</h4> : renderTrackersTable(selectedTrackers,fetchingTrackers,provider)}

        {selectedTrackers.length !== 0 && pagesCount>1 && <Paginator
          count={pagesCount}
          page={page}
          pageSize={pageSize}
          pageChangeHandler={handlePageChange}
          pageSizeHandler={handlePageSizeChange}
        />}
      </div>
    </div>
  );
}

export default forwardRef(IssuedTrackers);
