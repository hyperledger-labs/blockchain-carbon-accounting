import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export function IssueForm({ provider }) {

  const [address, setAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [uom, setUom] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [thruDate, setThruDate] = useState("");
  const [metadata, setMetadata] = useState("");
  const [manifest, setManifest] = useState("");
  const [automaticRetireDate, setAutomaticRetireDate] = useState("");
  const [result, setResult] = useState("");

  function onAddressChange(event) { setAddress(event.target.value); };
  function onTokenIdChange(value) { setTokenId(value); };
  function onQuantityChange(event) { setQuantity(event.target.value); };
  function onIssuerIdChange(event) { setIssuerId(event.target.value); };
  function onRecipientIdChange(event) { setRecipientId(event.target.value); };
  function onUomChange(event) { setUom(event.target.value); };
  function onFromDateChange(event) { setFromDate(event.target.value); };
  function onThruDateChange(event) { setThruDate(event.target.value); };
  function onMetadataChange(event) { setMetadata(event.target.value); };
  function onManifestChange(event) { setManifest(event.target.value); };
  function onAutomaticRetireDateChange(event) { setAutomaticRetireDate(event.target.value); };

  async function submit(w3provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = await contract.connect(signer);
    let addcarbontoken_result;
    try {
      let addcarbontoken_result_raw = await signed.addCarbonToken(
        address,
        tokenId,
        quantity,
        issuerId,
        recipientId,
        uom,
        fromDate,
        thruDate,
        metadata,
        manifest,
        automaticRetireDate
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
        <Form.Label>Address</Form.Label>
        <Form.Control type="input" placeholder="0x477573f212a7bdd5f7c12889bd1ad0aa44fb82aa" value={address} onChange={onAddressChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Token Type</Form.Label>
        <Form.Control as="select">
          <option onClick={() => {setTokenId(0)}}>Renewable Energy Certificate</option>
          <option onClick={() => {setTokenId(1)}}>Carbon Emissions Offset</option>
          <option onClick={() => {setTokenId(2)}}>Audited Emissions</option>
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
        <Form.Label>UOM</Form.Label>
        <Form.Control type="input" placeholder="" value={uom} onChange={onUomChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>From Date</Form.Label>
        <Form.Control type="input" placeholder="" value={fromDate} onChange={onFromDateChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Through Date</Form.Label>
        <Form.Control type="input" placeholder="" value={thruDate} onChange={onThruDateChange} />
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
        <Form.Label>Automatic Retire Date</Form.Label>
        <Form.Control type="input" placeholder="" value={automaticRetireDate} onChange={onAutomaticRetireDateChange} />
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