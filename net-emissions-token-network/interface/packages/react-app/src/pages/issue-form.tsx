// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEvent, useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsTrash, BsPlus } from 'react-icons/bs';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { addresses } from "@project/contracts";
import { encodeParameters, getAdmin, issue, track, issueAndTrack,getTrackerDetails } from "../services/contract-functions";
import CreateProposalModal from "../components/create-proposal-modal";
import SubmissionModal from "../components/submission-modal";
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo, TOKEN_TYPES, Tracker } from "../components/static-data";
import WalletLookupInput from "../components/wallet-lookup-input";
import { InputGroup } from "react-bootstrap";

type KeyValuePair = {
  key: string
  value: string
}

type IssueFormProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo,
  limitedMode: boolean,
  trackerId?: number,
}
 
const IssueForm: FC<IssueFormProps> = ({ provider, roles, signedInAddress, limitedMode, trackerId }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);
  const [createModalShow, setCreateModalShow] = useState(false);

  // admin address (if contract is in limitedMode)
  const [adminAddress, setAdminAddress] = useState("");

  // Form inputs
  const [address, setAddress] = useState("");
  const [issuedFrom, setIssuedFrom] = useState('');
  
  let andTrack = (typeof trackerId !== 'undefined');
  //const [trackerId, setTrackerId] = useState("");
  const [tracker, setTracker] = useState<any>(null);
  const [tokenTypeId, setTokenTypeId] = useState(1);
  const [quantity, setQuantity] = useState("");
  const [fromDate, setFromDate] = useState<Date|null>(null);
  const [thruDate, setThruDate] = useState<Date|null>(null);
  const [description, setDescription] = useState("");
  const [trackerDescription, setTrackerDescription] = useState("");
  const [result, setResult] = useState("");

  const [scope, setScope] = useState<number|null>(null);
  const [type, setType] = useState("");

  const [metajson, setMetajson] = useState("");
  const [metadata, setMetadata] = useState<KeyValuePair[]>([]);

  const [manifestjson, setManifestjson] = useState("");
  const [manifest, setManifest] = useState<KeyValuePair[]>([]);

  // Calldata
  const [calldata, setCalldata] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedQuantityInput, setInitializedQuantityInput] = useState(false);
  const [initializedTrackerIdInput, setInitializedTrackerIdInput] = useState(false);
  const [initializedProductNameInput, setinitializedProductNameInput] = useState(false);
  const [initializedProductAmountInput, setinitializedProductAmountInput] = useState(false);

  //const onTrackerIdChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setTrackerId(event.target.value); }, []);
  const onTokenTypeIdChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => { setTokenTypeId(parseInt(event.target.value)); }, []);
  const onQuantityChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setQuantity(event.target.value); }, []);
  const onDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setDescription(event.target.value); }, []);
  const onTrackerDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setTrackerDescription(event.target.value); }, []);
  const onScopeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => { setScope(parseInt(event.target.value)); }, []);
  const onTypeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setType(event.target.value); }, []);

  // params: key-value object list
  const castMetadata = (pairlist: KeyValuePair[]) => {
    const metaObj: any = {};
    pairlist.forEach((elem) => {
      metaObj[elem.key] = elem.value;
    });

    // add scope and type too.
    if (scope) metaObj["scope"] = scope;
    if (type) metaObj["type"] = type;

    return JSON.stringify(metaObj);
  }

  // handle metadata field list
  const removeField = (idx: number) => {
    let array = [...metadata];
    array.splice(idx, 1);
    setMetadata(array);
    setMetajson(castMetadata(metadata));
  }

  const addField = () => {
    metadata.push({key: "", value: ""});
    setMetadata([...metadata]);
    setMetajson(castMetadata(metadata));
  }

  const castManifest = (pairlist: KeyValuePair[]) => {
    const manifestObj: any = {};
    pairlist.forEach((elem) => {
      manifestObj[elem.key] = elem.value;
    });

    return JSON.stringify(manifestObj);
  }

  const addFieldManifest = () => {
    manifest.push({key: "", value: ""});
    setManifest([...manifest]);
    setManifestjson(castManifest(manifest));
  }

  const removeFieldManifest = (idx: number) => {
    let array = [...manifest];
    array.splice(idx, 1);
    setManifest(array);
    setManifestjson(castManifest(manifest));
  }

  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  function disableIssueButton(calldata: string, quantity: number|string, address: string) {
    let qty = Number(quantity);
    return (calldata.length === 0) || (qty === 0) || (String(address).length === 0)
  }

  useEffect(() => {
    async function fetchTrackerDetails() {
      if(!provider || !andTrack){
        return;
      }
      const result = 
        await getTrackerDetails(provider,Number(trackerId),signedInAddress);
      if (Number(trackerId)>0 && typeof result === 'object'  ) {
        //setTrackerId(result.trackerId);
        setAddress(result.trackee)
      }
    }
    fetchTrackerDetails();
  }, [provider, trackerId]);


  // update calldata on input change
  useEffect(() => {
    if (signedInAddress) {
      let encodedCalldata;
      const qty = Math.round(Number(quantity) * 1000);
      const fromDateNum = fromDate ? fromDate.getTime()/1000 : null;
      const thruDateNum = thruDate ? thruDate.getTime()/1000 : null;

      try {
        encodedCalldata = encodeParameters(
          // types of params
          [
            'address',
            'address',
            'uint8',
            'uint256',
            'uint256',
            'uint256',
            'string',
            'string',
            'string'
          ],
          // value of params
          [
            (limitedMode === true ? adminAddress : address),
            signedInAddress,
            tokenTypeId,
            qty,
            fromDateNum,
            thruDateNum,
            metajson,
            manifestjson,
            ("Issued by DAO. " + description)
          ]
        );
      } catch (error) {
        encodedCalldata = "";
      }
      setCalldata(encodedCalldata);
    }
  }, [
    signedInAddress,
    limitedMode,
    adminAddress,
    address,
    tokenTypeId,
    quantity,
    fromDate,
    thruDate,
    metajson,
    manifestjson,
    description,
  ]);

  useEffect(() => {
    async function fetchAdmin() {
      if (provider) setAdminAddress(await getAdmin(provider));
    }
    if (limitedMode === true) {
      fetchAdmin();
    }
  }, [limitedMode, provider]);

  useEffect(() => {
    if (roles.isAdmin || roles.isRecDealer) {
      setTokenTypeId(1);
    } else if (roles.isAdmin || roles.isCeoDealer) {
      setTokenTypeId(2);
    } else if (roles.isAdmin || roles.isAeDealer) {
      setTokenTypeId(3);
    }
  }, [roles]);

  async function submit() {
    if (!provider) return;
    if (!fromDate) {
      setResult("Invalid from date");
      return;
    }
    if (!thruDate) {
      setResult("Invalid thru date");
      return;
    }
    // we consider quantity has 3 decimals, multiply by 1000 before passing to the contract
    let quantity_formatted = Math.round(Number(quantity) * 1000);

    const _metadata = castMetadata(metadata);
    const _manifest = castManifest(manifest);
    let result;
    if(andTrack && typeof trackerId !== 'undefined'){
      result = await issueAndTrack(provider, issuedFrom, address, Number(trackerId), trackerDescription, tokenTypeId, quantity_formatted, fromDate, thruDate, _metadata, _manifest, description);
    }else{
      result = await issue(provider, issuedFrom, address, tokenTypeId, quantity_formatted, fromDate, thruDate, _metadata, _manifest, description);
    }
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  // consumer do not have access to this page
  if (!roles.isAdmin && !roles.hasDealerRole) return <p>You do not have the required role to Issue tokens.</p>

  return (roles.hasAnyRole && provider!==null) ? (
    <>

      <CreateProposalModal
        show={createModalShow}
        title="Create a proposal"
        onHide={() => {
          setCreateModalShow(false);
        }}
        token={tokenTypeId}
        provider={provider}
        calldata={calldata}
        description={description}
      />

      <SubmissionModal
        show={submissionModalShow}
        title="Issue tokens"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <h2>
        Issue tokens
      </h2>
      <p>
        {(andTrack) ? "for emissions tracker contract: "+ addresses.carbonTracker.address : null } 
      </p>

      {(andTrack) ? 
        <Form.Group className="mb-3" controlId="trackerIdInput">
          <Form.Label>TrackerId</Form.Label>
          <Form.Control
            type="input"
            placeholder="set to 0 to issue a new tracker"
            value={trackerId}
            //onChange={onTrackerIdChange}
            disabled
            onBlur={() => setInitializedTrackerIdInput(true)}
            style={(trackerId || !initializedTrackerIdInput) ? {} : inputError}
          />

          {/*<Form.Label>Tracker Description</Form.Label>
            <Form.Control 
              as="textarea" 
              placeholder="" 
              value={trackerDescription} 
              onChange={onTrackerDescriptionChange} />*/}
        </Form.Group>
      : null}
      <p>Issue tokens (Renewable Energy Certificate, Carbon Emissions Offset, Audited Emissions, Carbon Tracker) to registered {(andTrack) ? "industry" : "consumers"}.</p>
      <Form.Group className="mb-3">
          <Form.Label>
            Issue From Address
          </Form.Label>
          <InputGroup>
            <WalletLookupInput 
              onChange={(v: string) => { setIssuedFrom(v) }} 
              onWalletChange={(w)=>{
                setIssuedFrom(w ? w.address! : '');
              }} 
              onBlur={() => setInitializedAddressInput(true)}
              style={(issuedFrom || !initializedAddressInput) ? {} : inputError}
              />
          </InputGroup>
        </Form.Group>

      { ((!limitedMode) || (tokenTypeId === 3))
        ?
        <Form.Group className="mb-3">
          <Form.Label>
            {(andTrack) ? "Issue To Address" : "Issue Tracker To Address" }
          </Form.Label>
          {(!andTrack || trackerId==0) ?
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
          :
            <Form.Control
              type="input"
              value={address}
              disabled
            />            
          }

          <Form.Text className="text-muted">
            Must be a registered consumer or industry.
          </Form.Text>
        </Form.Group>
        :
        <Form.Group className="mb-3" controlId="addressInput">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="input"
            value={adminAddress}
            disabled
            onBlur={() => setInitializedAddressInput(true)}
            style={(address || !initializedAddressInput) ? {} : inputError}
          />
          <Form.Text className="text-muted">
            Always set to admin address in limited mode.
          </Form.Text>
        </Form.Group>
      }

      <Form.Group className="mb-3" controlId="tokenTypeInput">
        <Form.Label>Token Type</Form.Label>
        <Form.Select onChange={onTokenTypeIdChange}>
          <option value={0}>{}</option>
          {(roles.isAdmin || roles.isRecDealer) ? <option value={1}>{TOKEN_TYPES[0]}</option> : null}
          {(roles.isAdmin || roles.isCeoDealer) ? <option value={2}>{TOKEN_TYPES[1]}</option> : null}
          {(roles.isAdmin || roles.isAeDealer) && !andTrack ? <option value={3}>{TOKEN_TYPES[2]}</option> : null}
          {(roles.isAdmin || roles.isAeDealer) ? <option value={4}>{TOKEN_TYPES[3]}</option> : null}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3" controlId="quantityInput">
        <Form.Label>Quantity</Form.Label>
        <Form.Control
          type="input"
          placeholder="0.000"
          value={quantity}
          onChange={onQuantityChange}
          onBlur={() => setInitializedQuantityInput(true)}
          style={(quantity || !initializedQuantityInput) ? {} : inputError}
        />
        {/* Display whether decimal is needed or not */}
        <Form.Text className="text-muted">
          Must not contain more than three decimal values.
        </Form.Text>
      </Form.Group>
      <Row>
        <Form.Group as={Col} className="mb-3" controlId="fromDateInput">
          <Form.Label>From date</Form.Label>
          {/* @ts-ignore : some weird thing with the types ... */}
          <Datetime onChange={(moment)=>{setFromDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
        </Form.Group>
        <Form.Group as={Col} className="mb-3" controlId="thruDateInput">
          <Form.Label>Through date</Form.Label>
          {/* @ts-ignore : some weird thing with the types ... */}
          <Datetime onChange={(moment)=>{setThruDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
        </Form.Group>
      </Row>
      <Form.Group className="mb-3" controlId="descriptionInput">
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="metadataInput">
        <Form.Label>Metadata</Form.Label>
        <Row>
          <Col md={3}>
            <Row className="mb-3">
              <Form.Label column md={3}>Scope</Form.Label>
              <Col md={9}>
                <Form.Select onChange={onScopeChange}>
                  <option value={0}>{}</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </Form.Select>
              </Col>
            </Row>
          </Col>
          <Col md={7}>
            <Row className="mb-3">
              <Form.Label column md={2}>Type</Form.Label>
              <Col md={10}>
                <Form.Control type="text" placeholder="Type" onChange={onTypeChange} />
              </Col>
            </Row>
          </Col>
          <Col md={2}>
            <Row className="mb-3 g-0 gx-2">
              <Col className="col-md-auto col-6">
                <Button className="w-100" variant="outline-dark" onClick={addField}><BsPlus /></Button>
              </Col>
              <div className="col"></div>
            </Row>
          </Col>
        </Row>
        <Form.Group>
          {metadata.map((field, key) => 
            <Row key={key}>
              <Col md={3}>
                <Form.Control 
                  type="input" 
                  placeholder="Key"
                  value={field.key} 
                  onChange={e => { metadata[key].key = e.target.value; setMetadata([...metadata]); }}
                />
              </Col>
              <Col md={7}>
                <Row className="mb-3">
                  <Form.Label column md={2}>
                  </Form.Label>
                  <Col md={10}>
                    <Form.Control 
                      type="input" 
                      value={field.value} 
                      placeholder="Value"
                      onChange={e => { metadata[key].value = e.target.value; setMetadata([...metadata]); }}
                      />
                  </Col>
                </Row>
              </Col>
              <Col md={2}>
                <Row className="mb-3 g-0 gx-2">
                  <Col className="col-md-auto col-6">
                    <Button className="w-100" variant="outline-dark" onClick={addField}><BsPlus /></Button>
                  </Col>
                  <Col className="col-md-auto col-6">
                    <Button className="w-100" variant="outline-dark" onClick={() => removeField(key)}><BsTrash /></Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
          <br />
        </Form.Group>
      </Form.Group>
      <Form.Group>
        <Form.Group>
          <Form.Label>Manifest</Form.Label>
          <Button className="label-button" variant="outline-dark" onClick={addFieldManifest}><BsPlus /></Button>
        </Form.Group>
        <Form.Group>
          {manifest.map((field, key) =>
            <Row key={key} className="mt-2">
              <Col md={3}>
                <Form.Control
                  className="mb-3"
                  type="input"
                  value={field.key}
                  placeholder="Key"
                  onChange={e => { manifest[key].key = e.target.value; setManifest([...manifest]); }}
                />
              </Col>
              <Col md={7}>
                <Form.Control
                  className="mb-3"
                  type="input"
                  value={field.value}
                  placeholder="Value"
                  onChange={e => { manifest[key].value = e.target.value; setManifest([...manifest]); }}
                />
              </Col>
              <Col md={2}>
                <Row className="mb-3 g-0 gx-2">
                  <Col className="col-md-auto col-6">
                    <Button className="w-100" variant="outline-dark" onClick={addFieldManifest}><BsPlus /></Button>
                  </Col>
                  <Col className="col-md-auto col-6">
                    <Button className="w-100" variant="outline-dark" onClick={() => removeFieldManifest(key)}><BsTrash /></Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
          <br />
        </Form.Group>
      </Form.Group>

      <Row className="mt-4">
        <Col>

          {/* if in limited mode, require dealer role (except AE & CarbonTacker) to make a DAO proposal */}
          { (limitedMode && (!roles.isAdmin && !roles.isRecDealer && !roles.isCeoDealer))
            ?
            <Button
              variant="success"
              size="lg"
              className="w-100"
              disabled={true}
            >
              Must be a registered dealer
            </Button>
            :
            <Button
              variant="success"
              size="lg"
              className="w-100"
              onClick={() => setCreateModalShow(true)}
              disabled={
                (calldata.length === 0) ||
                Number(quantity) === 0 ||
                tokenTypeId === 3
              }
            >
              Create a DAO proposal token
            </Button>
          }

        </Col>

        { ( !limitedMode || tokenTypeId === 3 ) &&
          <Col>
            {/* Only enable issue if any role is found */}
            { roles.hasAnyRole
              ?
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={handleSubmit}
                  disabled={disableIssueButton(calldata, quantity, address)}
                >
                  Issue
                </Button>
              :
                <Button variant="primary" size="lg" disabled>Must be a registered dealer</Button>
            }
          </Col>
        }

      </Row>

    </>
  ) : (
    <p>You must be a registered dealer to issue tokens.</p>
  );
}

export default IssueForm;
