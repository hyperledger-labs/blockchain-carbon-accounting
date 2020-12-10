import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export function IssueForm({ provider }) {

  const [address, setAddress] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [uom, setUom] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [thruDate, setThruDate] = useState("");
  const [metadata, setMetadata] = useState("");
  const [manifest, setManifest] = useState("");
  const [automaticRetireDate, setAutomaticRetireDate] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");

  function onAddressChange(event) { setAddress(event.target.value); };
  function onQuantityChange(event) { setQuantity(event.target.value); };
  function onUomChange(event) { setUom(event.target.value); };
  function onFromDateChange(event) { setFromDate(event.target.value); };
  function onThruDateChange(event) { setThruDate(event.target.value); };
  function onMetadataChange(event) { setMetadata(event.target.value); };
  function onManifestChange(event) { setManifest(event.target.value); };
  function onAutomaticRetireDateChange(event) { setAutomaticRetireDate(event.target.value); };
  function onDescriptionChange(event) { setDescription(event.target.value); };

  async function submit(w3provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = await contract.connect(signer);
    let issue_result;
    try {
      let issue_result_raw = await signed.issue(
        address,
        tokenTypeId,
        quantity,
        uom,
        fromDate,
        thruDate,
        metadata,
        manifest,
        automaticRetireDate,
        description
      );
      issue_result = issue_result_raw.message;
    } catch (error) {
      console.error("Error calling issue()")
      issue_result = error.message;
    }
    console.log(issue_result)
    setResult(issue_result.toString());
  }

  return (
    <>
      <h2>Issue tokens</h2>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Token Type</Form.Label>
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