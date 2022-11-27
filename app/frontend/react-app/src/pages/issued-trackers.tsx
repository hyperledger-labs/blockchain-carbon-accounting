// SPDX-License-Identifier: Apache-2.0
import { 
  forwardRef, ForwardRefRenderFunction, useCallback, 
  useEffect, useImperativeHandle, useState, MouseEvent, 
  ChangeEvent 
} from "react";
import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Table from "react-bootstrap/Table";

//import Row from 'react-bootstrap/Row';
import { FcCheckmark } from 'react-icons/fc';
import { GiOilDrum } from 'react-icons/gi';
import { IoIosFlame } from 'react-icons/io';
import { FcElectricity } from 'react-icons/fc'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton';

import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";

import { issueTracker } from "../services/contract-functions";

import { getTrackers,getTracker } from '../services/api.service';

import SubmissionModal from "../components/submission-modal";
import CreateTrackerForm from "../components/create-tracker-form";
import TrackerInfoModal, { getTotalEmissions } from "../components/tracker-info-modal";
import TrackerTransferForm from "../components/tracker-transfer-form";

import Paginator from "../components/paginate";
import { RolesInfo, Tracker, ProductToken, Wallet, Operator } from "../components/static-data";


type SelectTrackers = 'my' | 'my_requested' | 'my_products' | 'issued' | 'unissued' | 'requested' | 'audited'


type IssuedTrackersProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string,
  signedInWallet?: Wallet,
  displayAddress: string,
  operator?: Operator,
  roles: RolesInfo,
  _showTrackers?: SelectTrackers,
  handleTrackerSelect?:(tracker:Tracker|null) => void,
}

type IssuedTrackersHandle = {
  refresh: ()=>void
}


const IssuedTrackers: ForwardRefRenderFunction<IssuedTrackersHandle, IssuedTrackersProps> = ({ provider, signedInAddress, signedInWallet, roles, displayAddress, handleTrackerSelect, operator, _showTrackers='issued'}, ref) => {
  const isDealer = roles.hasDealerRole;
  const isAeDealer = roles.isAeDealer;
  //const isIndustry = roles.hasIndustryRole;
  // Modal display and token it is set to
  const [modalTrackerShow, setModalTrackerShow] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker|null>();
  const [tokenTypeId, setTokenTypeId] = useState<number>(0);
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
      {key: 'my', value: ':my issued'},
      {key: 'my_requested', value: ':my unissued'},
      {key: 'my_products',  value: ':with my product balances'}
    )
  } 

  localStorage.setItem('issueTo', displayAddress!)
  localStorage.setItem('issueFrom', signedInAddress!)
  localStorage.setItem('tokenTypeId', '3')

  const [showTrackers, setShowTrackers] = useState(_showTrackers);
  const [showTrackersLabel, setShowTrackersLabel] = useState(trackerSelectors[trackerSelectors.map(t=>t.key).indexOf(_showTrackers)].value);

  const [fetchingTrackers, setFetchingTrackers] = useState(false);

  const [error, setError] = useState("");

  // state vars for pagination
  const [ page, setPage ] = useState(1);
  const [ pagesCount, setPagesCount ] = useState(0);
  const [ pageSize, setPageSize ] = useState(20);
  const [ query, ] = useState<string[]>(operator ? [`operatorUuid,string,${operator.uuid},eq,true`] : []);
  //const [ userWallet, setUserWallet ] = useState<(Wallet)>();
  
  const [result, setResult] = useState("");
  const [showCreateTracker, setShowCreateTracker] = useState(false);
  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  const trackerCreate = (result:string) => {
    setResult(result)
    setSubmissionModalShow(true);
    setShowCreateTracker(false)
  };

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

  const fetchTrackers = useCallback(async (_page: number, _pageSize: number, _query: string[]) => {
    setFetchingTrackers(true);

    const { tracker } = await getTracker(Number(process.env.REACT_APP_REFERENCE_TRACKER_ID)||0);
    if(tracker) setRefTracker(tracker);

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
      let tokenTypeId = 0;
      switch(showTrackers){
        case 'issued':
          newQuery = _query.concat([`issuedBy,string,0x0000000000000000000000000000000000000000,neq,true`])
          break
        case 'unissued':
          newQuery = _query.concat([`issuedBy,string,0x0000000000000000000000000000000000000000,eq,true`])
          break
        case 'requested':
          newQuery = _query.concat([`issuedFrom,string,${signedInAddress},like,true`])
          break
        case 'audited':
          newQuery = _query.concat([`issuedBy,string,${signedInAddress},like,true`])
          break
        case 'my':
          newQuery = _query.concat([`trackee,string,${signedInAddress},like,true`,
            `issuedBy,string,0x0000000000000000000000000000000000000000,neq,true`])
          break
        case 'my_requested':
          newQuery = _query.concat([`trackee,string,${signedInAddress},like,true`,
            `issuedBy,string,0x0000000000000000000000000000000000000000,eq,true`])
          break
        case 'my_products':
          tokenTypeId = 2;
          break
        //default:
      }
      setTokenTypeId(tokenTypeId)

      const offset = (_page - 1) * _pageSize;

      // this count means total number of issued tokens
      const {trackers, count} = await getTrackers(offset, _pageSize, newQuery, signedInAddress, tokenTypeId);
    
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

  function productIcon(name:string) {
    const _name = name.toLowerCase();
    if(_name.includes('oil')){
      return <GiOilDrum/> 
    }else if(_name.includes('gas')){
      return <IoIosFlame/>
    }else if(_name.includes('electricity') || _name.includes('power')){ 
      return  <FcElectricity/>
    }  
  }

  function displayProduct(tracker: Tracker, product: ProductToken,signedInAddress: string){
    //const amount = (showTrackers==='my' ? product.balances : product.unitAmount)
    if(product.issued! >0){
      console.log(product)
      const unit = product?.unit!;
      return((tokenTypeId!==2 || product.balances![0]?.unitAvailable) &&
        <div className='mb-3' key={`trackerId-${tracker.trackerId}-productId-${ product.productId}`}>
          <span>{productIcon(product?.name!)}{tokenTypeId===2 ? product.balances![0]?.unitAvailable?.toLocaleString('en-US') : product?.unitAmount?.toLocaleString('en-US')} {unit}</span>&nbsp;
  
          <span className="float-end">{ (((signedInAddress.toLowerCase()===tracker.trackee.toLowerCase() || isAeDealer) && Number(product.available)>0) || product?.balances![0]?.available > 0) && tracker?.dateIssued!
            && <Button variant="outline-dark small" href={`/transferProduct/${  product.productId}`} >Transfer</Button>
          }</span>
          {/*<Row key={tracker.trackerId+name+product.productId+"intensity"}>
              <>{product.emissionsFactor!.toFixed(1)}
                {" kgCO2e/"+unit}</>
          </Row>*/}
  
          {
            /* TO-DO the following conditional should be set to owner of the C-NFT
             since it can be transferred from the trackee to a distributor
             using the ERC721Upgradeable transfer function*/
          }
        </div>
      )
    }
  }

  function rowShading(products: ProductToken[]){
    // TO-DO create an admin configurable reference tracking for product emission factors that share common units.
    let referenceEmissionsFactor; 
    if(refTracker?.products!){
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
          <th>{(showTrackers==='my_products' ? "My":"")+'Net Emissions (tons CO2e)'}</th>
          <th>Products</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {(!fetching) &&
          trackers!.map((tracker:Tracker) => (
            <tr key={tracker?.trackerId+showTrackers} style={{ borderTopWidth: '5px', borderColor: rowShading(tracker?.products!)}}>
              <td>{tracker.trackerId===selectedTracker?.trackerId! && <FcCheckmark/>}{tracker.trackerId}</td>
              <td onClick={() => handleOpenTrackerInfoModal(tracker)} onMouseOver={pointerHover}>
                {showTrackers === 'my_products' ? (Number(tracker?.myProductsTotalEmissions!)/1000.0).toLocaleString('en-US') : (getTotalEmissions(tracker)/1000.0).toLocaleString('en-US')}
                <p><b style={{backgroundColor: rowShading(tracker?.products!)}}>{tracker?.products && tracker?.products?.length>0 && tracker?.products[0]?.emissionsFactor?.toLocaleString('en-US')+" kgCO2e/"+tracker?.products[0]?.unit!}</b></p>
                {(isDealer && tracker.issuedBy === "0x0000000000000000000000000000000000000000") && '\n' && 
                  <p><Button className="mb-3" variant="outline-dark" href={"/track/"+tracker.trackerId}> Add emissions</Button></p>
                }
              </td>
              <td onClick={() => handleOpenTrackerInfoModal(tracker)} onMouseOver={pointerHover}>
                {tracker?.products?.map((product) => (displayProduct(tracker,product,signedInAddress)))}
              {(isAeDealer && tracker.issuedBy.toLowerCase()==="0x0000000000000000000000000000000000000000") &&
                <Button className="mb-3" variant="outline-dark" href={"/addProduct/"+tracker.trackerId}>Add product</Button>
              }</td>
              <td>
                <span key={"trackerId"+tracker.trackerId+"Description"}>{(tracker.metadata as any).description}</span>
                {provider && roles.isAeDealer && tracker.issuedBy.toLowerCase()==="0x0000000000000000000000000000000000000000" && <Button className="float-end mb-3" variant="outline-dark" onClick={async() => await issueTracker(provider, tracker.trackerId)}>Issue</Button>}
                &nbsp;
                { signedInAddress.toLowerCase()===tracker.trackee.toLowerCase() && tracker?.issuedBy.toLowerCase()!=="0x0000000000000000000000000000000000000000"
                  && <TrackerTransferForm provider={provider} roles={roles} signedInAddress={signedInAddress} signedInWallet={signedInWallet} trackerId={tracker?.trackerId}/>
                }
              </td>
            </tr>)
        )}
      </tbody>
    </Table>)
  }

  return (<>
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
        roles={roles}
        signedInAddress={signedInAddress}
        onHide={() => {
          setModalTrackerShow(false);
        }}
        provider={provider}
      />}
      <SubmissionModal
        show={submissionModalShow}
        title="Transfer products"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />

      <p className="text-danger">{error}</p>
      
      <Dropdown style={{display: 'inline'}}>
        <DropdownButton title={"Emission certificates "+(showTrackers ? showTrackersLabel : "Select Trackers")} style={{display: 'inline'}} id="dropdown-menu-align-right" onSelect={async (value) => { await handleTrackersSelect(value!)}}>
          { trackerSelectors.map((labelObj,index) => (<Dropdown.Item key={labelObj.key} eventKey={index}>{labelObj.value}</Dropdown.Item>))}
        </DropdownButton>
      </Dropdown>

      {isDealer && false ? <Button style={{display: 'inline'}} className="mb-3" variant="outline-dark" href={`/track/${selectedTracker?.trackerId || 0}`}> Create certificate </Button> : 
        <Button style={{display: 'inline'}} variant="outline-dark" onClick={() =>setShowCreateTracker(!showCreateTracker)} >New certificate</Button>
      }
      {showCreateTracker && <CreateTrackerForm provider={provider} signedInAddress={signedInAddress} signedInWallet={signedInWallet!} trackee={operator?.wallet_address || displayAddress } onSubmitHandle={trackerCreate} operator={operator}/>}
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
  </>);
}

export default forwardRef(IssuedTrackers);
