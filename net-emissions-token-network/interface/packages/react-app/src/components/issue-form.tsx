// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEvent, useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsTrash, BsPlus } from 'react-icons/bs';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { encodeParameters, getAdmin, issue } from "../services/contract-functions";
import CreateProposalModal from "./create-proposal-modal";
import SubmissionModal from "./submission-modal";
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo, TOKEN_TYPES } from "./static-data";
import WalletLookupInput from "./wallet-lookup-input";
import { InputGroup } from "react-bootstrap";

type KeyValuePair = {
  key: string
  value: string
}

type IssueFormProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo,
  limitedMode: boolean
}

const IssueForm: FC<IssueFormProps> = ({ provider, roles, signedInAddress, limitedMode }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);
  const [createModalShow, setCreateModalShow] = useState(false);

  // admin address (if contract is in limitedMode)
  const [adminAddress, setAdminAddress] = useState("");

  // Form inputs
  const [address, setAddress] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState(1);
  const [quantity, setQuantity] = useState("");
  const [fromDate, setFromDate] = useState<Date|null>(null);
  const [thruDate, setThruDate] = useState<Date|null>(null);
  const [description, setDescription] = useState("");
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

  const onTokenTypeIdChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setTokenTypeId(parseInt(event.target.value)); }, []);
  const onQuantityChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setQuantity(event.target.value); }, []);
  const onDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setDescription(event.target.value); }, []);
  const onScopeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setScope(parseInt(event.target.value)); }, []);
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
    console.log(tokenTypeId)

    const _metadata = castMetadata(metadata);
    const _manifest = castManifest(manifest);

    let result = await issue(provider, address, tokenTypeId, quantity_formatted, fromDate, thruDate, _metadata, _manifest, description);
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return roles.hasAnyRole ? (
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
      <h2>Issue tokens</h2>
      <p>Issue tokens (Renewable Energy Certificate, Carbon Emissions Offset, Audited Emissions, Carbon Tracker) to registered consumers.</p>

      { ((!limitedMode) || (tokenTypeId === 3))
        ?
        <Form.Group>
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
          <Form.Text className="text-muted">
            Must be a registered consumer or industry.
          </Form.Text>
        </Form.Group>
        :
        <Form.Group>
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


      <Form.Group>
        <Form.Label>Token Type</Form.Label>
        <Form.Control as="select" onChange={onTokenTypeIdChange}>
          <option value={0}>{}</option>
          {(roles.isAdmin || roles.isRecDealer) ? <option value={1}>{TOKEN_TYPES[0]}</option> : null}
          {(roles.isAdmin || roles.isCeoDealer) ? <option value={2}>{TOKEN_TYPES[1]}</option> : null}
          {(roles.isAdmin || roles.isAeDealer) ? <option value={3}>{TOKEN_TYPES[2]}</option> : null}
          {(roles.isAdmin || roles.isIndustry) ? <option value={4}>{TOKEN_TYPES[3]}</option> : null}
        </Form.Control>
      </Form.Group>
      <Form.Group>
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
      <Form.Row>
        <Form.Group as={Col}>
          <Form.Label>From date</Form.Label>
          {/* @ts-ignore : some weird thing with the types ... */}
          <Datetime onChange={(moment)=>{setFromDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>Through date</Form.Label>
          {/* @ts-ignore : some weird thing with the types ... */}
          <Datetime onChange={(moment)=>{setThruDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
        </Form.Group>
      </Form.Row>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Metadata</Form.Label>
        <Row>
          <Col sm={3}>
            <Row className="mb-3">
              <Form.Label column sm={3}>
                Scope
              </Form.Label>
              <Col sm={6}>
              <Form.Control as="select" onChange={onScopeChange}>
                <option value={0}>{}</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </Form.Control>
              </Col>
            </Row>
          </Col>
          <Col sm={6}>
            <Row className="mb-3">
              <Form.Label column sm={1}>
                Type
              </Form.Label>
              <Col sm={8}>
                <Form.Control type="text" placeholder="Type" onChange={onTypeChange} />
              </Col>
              <Col>
                <Button variant="outline-dark" onClick={addField}><BsPlus /></Button>
              </Col>
            </Row>
          </Col>
        </Row>
        <Form.Group>
          {metadata.map((field, key) => 
            <Row key={key} className="mt-2">
              <Col>
                <Form.Control 
                  type="input" 
                  value={field.key} 
                  onChange={e => { metadata[key].key = e.target.value; setMetadata([...metadata]); }}
                />
              </Col>
              <Col>
                <Form.Control 
                  type="input" 
                  value={field.value} 
                  onChange={e => { metadata[key].value = e.target.value; setMetadata([...metadata]); }}
                />
              </Col>
              <div>
                <Button variant="outline-dark" onClick={addField}><BsPlus /></Button>
              </div>
              <Col>
                <Button variant="outline-dark" onClick={() => removeField(key)}><BsTrash /></Button>
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
              <Col>
                <Form.Control
                  type="input"
                  value={field.key}
                  onChange={e => { manifest[key].key = e.target.value; setManifest([...manifest]); }}
                />
              </Col>
              <Col>
                <Form.Control
                  type="input"
                  value={field.value}
                  onChange={e => { manifest[key].value = e.target.value; setManifest([...manifest]); }}
                />
              </Col>
              <div>
                <Button variant="outline-dark" onClick={addFieldManifest}><BsPlus /></Button>
              </div>
              <Col>
                <Button variant="outline-dark" onClick={() => removeFieldManifest(key)}><BsTrash /></Button>
              </Col>
            </Row>
          )}
          <br />
        </Form.Group>
      </Form.Group>

      <Row className="mt-4">
        <Col>

          {/* if in limited mode, require dealer role (except AE & CarbonTacker) to make a DAO proposal */}
          { (limitedMode && (!roles.isAdmin && !roles.isRecDealer && !roles.isCeoDealer && !roles.isIndustry))
            ?
            <Button
              variant="success"
              size="lg"
              block
              disabled={true}
            >
              Must be a registered dealer
            </Button>
            :
            <Button
              variant="success"
              size="lg"
              block
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
                  block
                  onClick={handleSubmit}
                  disabled={disableIssueButton(calldata, quantity, address)}
                >
                  Issue
                </Button>
              :
                <Button variant="primary" size="lg" block disabled>Must be a registered dealer</Button>
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
