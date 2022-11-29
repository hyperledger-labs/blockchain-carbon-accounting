// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEvent, useCallback, useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton';

import { transferProducts, transferTrackerTokens, trackProduct } from "../services/contract-functions";
import { getTrackers, getTracker, getProduct, getTrackerBalance, getProductBalance } from '../services/api.service';

import SubmissionModal from "../components/submission-modal";
import CreateTrackerForm from "../components/create-tracker-form";

import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";
import WalletLookupInput from "../components/wallet-lookup-input";
import { InputGroup } from "react-bootstrap";
import { Tracker, ProductToken, TrackerBalance, ProductTokenBalance, Wallet } from "../components/static-data";

type ProductTransferFormProps = {
  provider?: Web3Provider | JsonRpcProvider,
  roles: RolesInfo,
  productId: number,
  signedInAddress: string,
  signedInWallet?: Wallet,
}
const ProductTransferForm: FC<ProductTransferFormProps> = ({ provider, roles, signedInAddress, signedInWallet, productId }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [trackeeAddress, setTrackeeAddress] = useState("");
  const [productToken, setProductToken] = useState<ProductToken>();
  const [sourceTracker, setSourceTracker] = useState<Tracker>();
  const [selectedTracker, setSelectedTracker] = useState<Tracker|null>(null);
  const [trackerBalance, setTrackerBalance] = useState<TrackerBalance>();
  const [productBalance, setProductBalance] = useState<ProductTokenBalance>();

  const [selectedTrackers, setSelectedTrackers] = useState<Tracker[]>([]);
  const [fetchingTrackers, setFetchingTrackers] = useState(false);
  const [error, setError] = useState("");
  // state vars for pagination
  //const [ page, setPage ] = useState(1);
  //const [ pagesCount, setPagesCount ] = useState(0);
  //const [ pageSize, setPageSize ] = useState(20);

  //const [trackerId, setTrackerId] = useState("");
  const [productAmount, setProductAmount] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for retransferquired inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedProductAmountInput, setInitializedProductAmountInput] = useState(false);

  const [showCreateTracker, setShowCreateTracker] = useState(false);

  const trackerCreate = (result:string) => {
    setResult(result)
    setSubmissionModalShow(true);
    setShowCreateTracker(false)
  };

  const onProductAmountChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductAmount(event.target.value); }, []);

  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  function handleTrackerAddressChange(trackeeAddress:string) {
    fetchTrackers(1,0,[],trackeeAddress)
  }

  const fetchTrackers = useCallback(async (_page: number, _pageSize: number, _query: string[], trackeeAddress=signedInAddress) => {
    setFetchingTrackers(true);
    let newSelectedTrackers:Tracker[]=[];
    //let _pagesCount = 0;
    let query = _query.concat([`trackee,string,${trackeeAddress},like,true`,  
      `issuedBy,string,0x0000000000000000000000000000000000000000,eq,true`]);
    try {
      const offset = (_page - 1) * _pageSize;

      const {trackers } = await getTrackers(offset, _pageSize, query, signedInAddress, 0);
      newSelectedTrackers=trackers;

      console.log('Trackers:', trackers)
      //_pagesCount = count % _pageSize === 0 ? count / _pageSize : Math.floor(count / _pageSize) + 1;
      
    } catch (error) {
      console.log(error);
      setError("Could not get emission certificates from the databse.");
    }

    setFetchingTrackers(false);
    setSelectedTrackers(newSelectedTrackers)
    setError("");
    //setPagesCount(_pagesCount);
    //setPage(_page);
    //setPageSize(_pageSize);
    //setQuery(query);
  }, [ signedInAddress ]);

  const trackerLabel = (tracker:Tracker) => {
    return `Tracker ID ${tracker.trackerId}: ${(tracker.metadata as any).description}`
  }

  const handleTrackerSelect = async (index:string|null) => {
    if (index){
      if(index==='createTracker'){
        setShowCreateTracker(true)
      }else{
        setSelectedTracker(selectedTrackers[Number(index)]);
      }
      //selectedTrackerLabel(trackerLabel(selectedTrackers[Number(index)]))
    }else{
      setSelectedTracker(null)
      //selectedTrackerLabel(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress && productId) {
        setFetchingProduct(true);
        const {product} = await getProduct(productId);
        if (product) {
          setProductToken(product)
          const {balance} = await getProductBalance(productId,signedInAddress);
          if(balance) setProductBalance(balance);
          const {tracker} = await getTracker(product.trackerId);
          if(tracker){
            setSourceTracker(tracker)
            const {balance} = await getTrackerBalance(product.trackerId,signedInAddress);
            if(balance) setTrackerBalance(balance);
          }
        }
      }
      await fetchTrackers(1, 0, []);
    }
    init();
  }, [provider, signedInAddress, productId, fetchingProduct, fetchTrackers]);

  // populate form with URL params if found
  useEffect(() => {
    let queryParams = new URLSearchParams(window.location.search);
    let addressQueryParam = queryParams.get('address');
    let quantityQueryParam = queryParams.get('quantity');
    if (addressQueryParam) {
      setAddress(addressQueryParam);
    }
    if (quantityQueryParam) {
      setProductAmount(quantityQueryParam);
    }
  }, []);

  async function submit() {
    if (!provider) return;
    const productAmount_formatted
      = Math.round(Number(productAmount)/productToken?.unitConversion!);

    let result;
    if(selectedTracker){
      console.log('track')
      result = await trackProduct(provider,signedInAddress,selectedTracker?.trackerId,productId,productAmount_formatted);
    }else{
      if(trackerBalance?.status==='available' && productToken?.available!>0){
        // If singedInAddress owns tracker transfer ProductToken available
        result = await transferProducts(provider,address,[Number(productId)],[productAmount_formatted],[]);
      }else{
        // transfer ProductTokenBalance of signed in address
        result = await transferTrackerTokens(provider,address,[productToken?.tokenId!],[productAmount_formatted],[]);
      }
    }
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return roles.hasAnyRole ? (
    <>
      <SubmissionModal
        show={submissionModalShow}
        title="Transfer products"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      {showCreateTracker && <CreateTrackerForm provider={provider} signedInAddress={signedInAddress} signedInWallet={signedInWallet!} trackee={signedInAddress} onSubmitHandle={trackerCreate}/>}
      <h2>Transfer product</h2>
      <p>{`Name: ${productToken?.name}`}</p>
      <p>From {sourceTracker && trackerLabel(sourceTracker)}</p>
      {trackerBalance?.status==='available' && productToken?.unitAvailable!>0 &&
        <Form.Group className="mb-3" controlId="trackerIdInput">
          <Form.Label>Transfer from source tracker ID</Form.Label>
          <Form.Control
            type="input"
            value={productToken?.trackerId}
            disabled={true}
          />
        </Form.Group>
      }
      <Form.Group className="mb-3" controlId="productIdInput">
        <Form.Label>Product ID</Form.Label>
        <Form.Control
          type="input"
          value={productId}
          disabled={true}
        />
      </Form.Group>
      <p className="text-danger">{error}</p>
      <div className={fetchingTrackers ? "dimmed" : ""}>
        {fetchingTrackers && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
      { roles.isAeDealer &&
        <Form.Group className="mb-3" controlId="addressInput">
          <Form.Label>Find certificate by address</Form.Label>
          <InputGroup>
            <WalletLookupInput
              onChange={(v: string) => { setTrackeeAddress(v) }}
              onWalletChange={(w)=>{
                setTrackeeAddress(w ? w.address! : '');
                handleTrackerAddressChange(w ? w.address! : '')
              }}
              onBlur={() => setInitializedAddressInput(true)}
              style={(trackeeAddress || !initializedAddressInput) ? {} : inputError}
              />
          </InputGroup>
        </Form.Group>
      }
        <Dropdown style={{display: 'inline'}}>
          <DropdownButton title={showCreateTracker ? "Create tracker":"Transfer product to " + (selectedTracker ? `${trackerLabel(selectedTracker!)}`:'')} style={{display: 'inline'}} id="dropdown-menu-align-right" onSelect={async (value) => { await handleTrackerSelect(value!)}}>
            { selectedTrackers.map((tracker,index) => (<Dropdown.Item key={`trackerId${tracker?.trackerId}`} eventKey={index}>{trackerLabel(tracker)}</Dropdown.Item>)
            )}{ sourceTracker?.trackee.toLowerCase()===signedInAddress.toLowerCase() && <Dropdown.Item key={`noSelectedTracker`} eventKey={undefined}>{`Transfer product to address`}</Dropdown.Item>}
            {<Dropdown.Item key={`createTracker`} eventKey={'createTracker'}>{`Transfer product to new tracker`}</Dropdown.Item>}
          </DropdownButton>
        </Dropdown>
      </div>
      { !selectedTracker && sourceTracker?.trackee.toLowerCase()===signedInAddress.toLowerCase() &&
        <Form.Group className="mb-3" controlId="addressInput">
          <Form.Label>Address</Form.Label>
          <InputGroup>
            <WalletLookupInput
              onChange={(v: string) => { setAddress(v) }}
              onWalletChange={(w)=>{
                setAddress(w ? w.address! : '');
              }}
              onBlur={() => setInitializedAddressInput(true)}
              style={(address || !initializedAddressInput) ? {} : inputError}
              />
          </InputGroup>
        </Form.Group>
      }
      <Form.Group className="mb-3" controlId="productInput">

        <Form.Label>
          Product amount
        </Form.Label>
        <Form.Control
          type="input"
          placeholder="0"
          value={productAmount}
          onChange={onProductAmountChange}
          onBlur={() => setInitializedProductAmountInput(true)}
          style={(productAmount || !initializedProductAmountInput) ? {} : inputError}
        />
        <Form.Text className="text-muted">
          <p>Available balance&nbsp; 
            {`${(Number(productBalance?.available!)*productBalance?.unitConversion! || 0).toLocaleString('en-US')}`}
            &nbsp;{`${productToken?.unit}`}
          </p>
          <p>{(roles.isAeDealer || trackerBalance?.status==='available') && productToken?.unitAvailable!>0 && `From tracker ID ${productToken?.trackerId}: ${productToken?.unitAvailable?.toLocaleString('en-US')} ${productToken?.unit}`
            }
          </p>
        </Form.Text>

      </Form.Group>
      <Row className="mt-4">

        <Col>
          {/* Only enable issue if any role is found */}
          { roles.hasAnyRole
            ?
              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleSubmit}
              >
                Transfer
              </Button>
            :
              <Button variant="primary" size="lg" disabled>Must be a registered dealer</Button>
          }
        </Col>

      </Row>

    </>
  ) : (
    <p>You must be a registered dealer to issue tokens.</p>
  );
}

export default ProductTransferForm;
