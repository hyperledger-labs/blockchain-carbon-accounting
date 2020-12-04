import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export function AddCarbonToken({ provider }) {

  const [tokenId, setTokenId] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [assetType, setAssetType] = useState("");
  const [uom, setUom] = useState("");
  const [dateStamp, setDateStamp] = useState("");
  const [metadata, setMetadata] = useState("");
  const [manifest, setManifest] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");

  function onTokenIdChange(event) { setTokenId(event.target.value); };
  function onQuantityChange(event) { setQuantity(event.target.value); };
  function onIssuerIdChange(event) { setIssuerId(event.target.value); };
  function onRecipientIdChange(event) { setRecipientId(event.target.value); };
  function onAssetTypeChange(event) { setAssetType(event.target.value); };
  function onUomChange(event) { setUom(event.target.value); };
  function onDateStampChange(event) { setDateStamp(event.target.value); };
  function onMetadataChange(event) { setMetadata(event.target.value); };
  function onManifestChange(event) { setManifest(event.target.value); };
  function onDescriptionChange(event) { setDescription(event.target.value); };

  async function submit(w3provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = await contract.connect(signer);
    let addcarbontoken_result;
    try {
      let addcarbontoken_result_raw = await signed.addCarbonToken(
        tokenId,
        tokenTypeId,
        quantity,
        issuerId,
        recipientId,
        assetType,
        uom,
        dateStamp,
        metadata,
        manifest,
        description
      );
      addcarbontoken_result = addcarbontoken_result_raw.message;
    } catch (error) {
      console.error("Error calling addCarbonToken()")
      addcarbontoken_result = error.message;
    }
    console.log(addcarbontoken_result)
    setResult(addcarbontoken_result.toString());
  }

  return (
    <>
      <Form.Group>
        <Form.Label>Token ID</Form.Label>
        <Form.Control type="input" placeholder="0" value={tokenId} onChange={onTokenIdChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Token Type ID</Form.Label>
        {/*<Form.Control type="input" placeholder="Renewable Energy Certificate" value={tokenTypeId} onChange={onTokenTypeIdChange} />*/}
        <Form.Control as="select">
          <option onClick={() => {setTokenTypeId("Renewable Energy Certificate")}}>Renewable Energy Certificate</option>
          <option onClick={() => {setTokenTypeId("Carbon Emissions Offset")}}>Carbon Emissions Offset</option>
          <option onClick={() => {setTokenTypeId("Audited Emissions")}}>Audited Emissions</option>
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Quantity</Form.Label>
        <Form.Control type="input" placeholder="100" value={quantity} onChange={onQuantityChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Issuer ID</Form.Label>
        <Form.Control type="input" placeholder="0x477573f212a7bdd5f7c12889bd1ad0aa44fb82aa" value={issuerId} onChange={onIssuerIdChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Recipient ID</Form.Label>
        <Form.Control type="input" placeholder="0x477573f212a7bdd5f7c12889bd1ad0aa44fb82aa" value={recipientId} onChange={onRecipientIdChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Asset Type</Form.Label>
        <Form.Control type="input" placeholder="" value={assetType} onChange={onAssetTypeChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>UOM</Form.Label>
        <Form.Control type="input" placeholder="" value={uom} onChange={onUomChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Date Stamp</Form.Label>
        <Form.Control type="input" placeholder="" value={dateStamp} onChange={onDateStampChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Metadata</Form.Label>
        <Form.Control as="textarea" placeholder="" value={metadata} onChange={onMetadataChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Manifest</Form.Label>
        <Form.Control as="textarea" placeholder="" value={manifest} onChange={onManifestChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Button variant="primary" size="lg" block onClick={() => submit(provider)}>
        Submit
      </Button>
      {result &&
        <>
          <hr/>
          <h5>Result:</h5>
          <pre className="pre-scrollable" style={{"whiteSpace": "pre-wrap"}}>
            <code>
              {result}
            </code>
          </pre>
        </>
      }
    </>
  );
}