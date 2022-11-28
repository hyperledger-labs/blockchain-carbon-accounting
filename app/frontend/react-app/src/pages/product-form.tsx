// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEvent, useCallback, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsPlus } from 'react-icons/bs';

import "react-datetime/css/react-datetime.css";
import { issueProduct } from "../services/contract-functions";
import SubmissionModal from "../components/submission-modal";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { RolesInfo, Wallet } from "../components/static-data";
import FormGroupJSON, { KeyValuePair } from "../components/form-group-json";

export type ProductFormSeeds ={
  metadata: string;
  manifest: string;
  /*productName?: string,
  productAmount?: number,
  productUnitAmount?: number,
  productUnit?:string*/
}
type ProductFormProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress?: string,
  signedInWallet?: Wallet,
  roles: RolesInfo,
  limitedMode?: boolean,
  trackerId: number,
  seeds?: ProductFormSeeds
}

const ProductForm: FC<ProductFormProps> = ({ provider, roles, limitedMode, trackerId, signedInWallet, signedInAddress, seeds }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  const _metadata =  seeds?.metadata ? JSON.parse(seeds?.metadata!) : {};
  //const [metajson, setMetajson] = useState("");
  const [metadata, setMetadata] = useState<KeyValuePair[]>(_metadata! ? Object.keys(_metadata).map((key)=>({key: key,value: _metadata[key]})) :[] );

  const _manifest =  seeds?.manifest ? JSON.parse(seeds?.manifest!) : {};
  //const [manifestjson, setManifestjson] = useState("");
  const [manifest, setManifest] = useState<KeyValuePair[]>(_manifest! ? Object.keys(_manifest).map((key)=>({key: key,value: _manifest[key]})) :[] );

  const [productName, setProductName] = useState<string>(_metadata?.productName);
  const [productAmount, setProductAmount] = useState<number>(_metadata?.productAmount||0);
  const [productUnitAmount, setProductUnitAmount] = useState<number>(Number(_metadata?.productUnitAmount!||0));
  const [productUnit, setProductUnit] = useState<string>(_metadata?.productUnit);
  const [source, setSource] = useState<string>(_manifest?.source);

  const [result, setResult] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedProductNameInput, setInitializedProductNameInput] = useState(false);
  const [initializedProductAmountInput, setInitializedProductAmountInput] = useState(false);
  const [initializedProductUnitAmountInput, setInitializedProductUnitAmountInput] = useState(false);
  const [initializedProductUnitInput, setInitializedProductUnitInput] = useState(false);
  const [initializedSourceInput, setInitializedSourceInput] = useState(false);

  const onProductAmountChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductAmount(Number(event.target.value.replace(/,/g, ''))); }, []);
  const onProductNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductName(event.target.value); }, []);
  const onProductUnitAmountChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductUnitAmount(Number(event.target.value.replace(/,/g, ''))); }, []);
  const onProductUnitChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductUnit(event.target.value); }, []);
  const onSourceChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setSource(event.target.value); }, []);

  const castMetadata = (pairlist: KeyValuePair[]) => {
    const metaObj: any = {};
    pairlist.forEach((elem) => {
      metaObj[elem.key] = elem.value;
    });
    if(productName) metaObj["name"] = productName;
    if(productUnit) metaObj["unit"] = productUnit;
    if(productUnitAmount) metaObj["unitAmount"] = productUnitAmount;
    return JSON.stringify(metaObj);
  }

  // handle metadata field list
  const removeField = (idx: number) => {
    let array = [...metadata];
    array.splice(idx, 1);
    setMetadata(array);
    //setMetajson(castMetadata(metadata));
    console.log(metadata)
  }

  const addField = () => {
    metadata.push({key: "", value: ""});
    setMetadata([...metadata]);
    //setMetajson(castMetadata(metadata));
  }

  const castManifest = (pairlist: KeyValuePair[]) => {
    const manifestObj: any = {};
    pairlist.forEach((elem) => {
      manifestObj[elem.key] = elem.value;
    });
    if(source) manifestObj["source"] = source;
    return JSON.stringify(manifestObj);
  }

  const addFieldManifest = () => {
    manifest.push({key: "", value: ""});
    setManifest([...manifest]);
    //setManifestjson(castManifest(manifest));
  }

  const removeFieldManifest = (idx: number) => {
    let array = [...manifest];
    array.splice(idx, 1);
    setManifest(array);
    //setManifestjson(castManifest(manifest));
  }


  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  async function submit() {
    if (!provider) return;
    let productAmount_formatted = BigInt(productAmount);

    let result = await issueProduct(provider,trackerId,productAmount_formatted,castMetadata(metadata),castManifest(manifest),signedInWallet?.has_private_key_on_server);

    setResult(result[0].toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return roles.hasAnyRole ? (
    <>
      <SubmissionModal
        show={submissionModalShow}
        title="Issue tokens"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <h2>Add product to emission certificate</h2>

      <Form.Group className="mb-3" controlId="trackerIdInput">
        <Form.Label>TrackerId</Form.Label>
        <Form.Control
          type="input"
          value={trackerId}
          disabled={true}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="productInput">
        <Form.Label>Product amount (emission weights)</Form.Label>
        <Form.Control
          type="input"
          placeholder="0"
          value={productAmount}
          onChange={onProductAmountChange}
          onBlur={() => setInitializedProductAmountInput(true)}
          style={(productAmount || !initializedProductAmountInput) ? {} : inputError}
        />
        <Form.Text className="text-muted">
          Integer quantity of products to be distributed.
          Also used to determine the weighting of emissions across different products assigned to the emissions certificate.
        </Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="productUnitsInput">

      </Form.Group>
      <Form.Group className="mb-3" controlId="metadataInput">
        <Form.Label>Metadata</Form.Label>
        <Row>
          <Row className="mb-3">
            <Form.Label column md={3}>Name</Form.Label>
            <Col md={9}>
              <Form.Control
                type="input"
                placeholder="Product name (e.g., oil and gas)"
                value={_metadata?.name}
                onChange={onProductNameChange}
                onBlur={() => setInitializedProductNameInput(true)}
                style={(productName || !initializedProductNameInput) ? {} : inputError}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Form.Label column md={3}>Unit</Form.Label>
            <Col md={9}>
              <Form.Control
                type="input"
                placeholder="product units (e.g., kwh)"
                value={_metadata?.unit}
                onChange={onProductUnitChange}
                onBlur={() => setInitializedProductUnitInput(true)}
                style={(productUnit || !initializedProductUnitInput) ? {} : inputError}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Form.Label column md={3}>Unit Amount</Form.Label>
            <Col md={9}><Form.Control
              type="input"
              placeholder="0"
              value={_metadata?.unitAmount}
              onChange={onProductUnitAmountChange}
              onBlur={() => setInitializedProductUnitAmountInput(true)}
              style={(productUnitAmount || !initializedProductUnitAmountInput) ? {} : inputError}
            />
            <Form.Text className="text-muted">
              Convert product emission weights into product units, if weights and units are different.
            </Form.Text></Col>
          </Row>
          <Row className="mb-3 g-0 gx-2">
            <Col className="col-md-auto col-6">
              <Button className="w-100" variant="outline-dark" onClick={addField}><BsPlus /></Button>
            </Col>
            <div className="col"></div>
          </Row>
        </Row>
        {FormGroupJSON({keyValuePair: metadata, handles: {setKeyValuePair: setMetadata, addField: addField, removeField: removeField}})}
      </Form.Group>
      <Form.Group>
        <Form.Group>
          <Form.Label>Manifest</Form.Label>
          <Row className="mb-3">
            <Form.Label column md={3}>source</Form.Label>
            <Col md={9}><Form.Control
              type="input"
              placeholder="0"
              value={_metadata?.source}
              onChange={onSourceChange}
              onBlur={() => setInitializedSourceInput(true)}
              style={(source || !initializedSourceInput) ? {} : inputError}
            /></Col>
          </Row>          
          <Button className="label-button" variant="outline-dark" onClick={addFieldManifest}><BsPlus /></Button>
        </Form.Group>
        {FormGroupJSON({keyValuePair: manifest!, handles: {setKeyValuePair:setManifest, addField: addFieldManifest, removeField: removeFieldManifest}})}
      </Form.Group>
      <Row className="mt-4">

        { ( !limitedMode) &&
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

export default ProductForm;
