import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

export default function IssueForm({ provider }) {

  const [modalShow, setModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState("Renewable Energy Certificate");
  const [quantity, setQuantity] = useState("");
  const [uom, setUom] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [thruDate, setThruDate] = useState("");
  const [metadata, setMetadata] = useState("");
  const [manifest, setManifest] = useState("");
  const [automaticRetireDate, setAutomaticRetireDate] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedQuantityInput, setInitializedQuantityInput] = useState(false);

  function onAddressChange(event) { setAddress(event.target.value); };
  function onQuantityChange(event) { setQuantity(event.target.value); };
  function onUomChange(event) { setUom(event.target.value); };
  function onFromDateChange(event) { setFromDate(event._d); };
  function onThruDateChange(event) { setThruDate(event._d); };
  function onMetadataChange(event) { setMetadata(event.target.value); };
  function onManifestChange(event) { setManifest(event.target.value); };
  function onAutomaticRetireDateChange(event) { setAutomaticRetireDate(event._d) };
  function onDescriptionChange(event) { setDescription(event.target.value); };

  function toUnixTime(date) {
    // Return date if not a Date object
    if (Object.prototype.toString.call(date) !== '[object Date]')
      return date;
    return parseInt((date.getTime() / 1000).toFixed(0));
  }

  function handleSubmit() {
    submit(provider);
    setModalShow(true);
  }

  // Helper function to prevent ambiguous failure message when dates aren't passed
  function convertToZeroIfBlank(num) {
    return parseInt(num) || 0;
  }

  async function submit(w3provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = await contract.connect(signer);
    console.log(convertToZeroIfBlank(toUnixTime(fromDate)));
    let issue_result;
    try {
      let issue_result_raw = await signed.issue(
        address,
        tokenTypeId,
        quantity,
        uom,
        convertToZeroIfBlank(toUnixTime(fromDate)),
        convertToZeroIfBlank(toUnixTime(thruDate)),
        metadata,
        manifest,
        convertToZeroIfBlank(toUnixTime(automaticRetireDate)),
        description
      );

      // Format success message
      if (!issue_result_raw) {
        issue_result = "Success! Transaction has been submitted to the network. Please check your dashboard to see issued tokens.";
      }
      
    } catch (error) {
      console.error("Error calling issue()");
      console.error(["error.message: ", error.message]);

      // Format error message
      if (error.message.startsWith("resolver or addr is not configured for ENS name")) {
        issue_result = "Error: Invalid address. Please enter a valid address of the format 0x000...";
      } else if (error.message.startsWith("invalid BigNumber string (argument=\"value\"")) {
        issue_result = "Error: Invalid quantity. Please enter a valid quantity of tokens to issue."
      } else {
        issue_result = error.message;
      }

    }
    console.log(issue_result)
    setResult(issue_result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return (
    <>

      <SubmissionModal
        show={modalShow}
        title="Issue tokens"
        body={result}
        onHide={() => {setModalShow(false); setResult("")} }
      />

      <h2>Issue tokens</h2>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control
          type="input"
          placeholder="0x000..."
          value={address}
          onChange={onAddressChange}
          onBlur={() => setInitializedAddressInput(true)}
          style={(address || !initializedAddressInput) ? {} : inputError}
        />
        <Form.Text className="text-muted">
          Must be a registered consumer.
        </Form.Text>
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
        <Form.Control
          type="input"
          placeholder="100"
          value={quantity}
          onChange={onQuantityChange}
          onBlur={() => setInitializedQuantityInput(true)}
          style={(quantity || !initializedQuantityInput) ? {} : inputError}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Unit of measurement</Form.Label>
        <Form.Control type="input" placeholder="E.g. MWH, MtCO2e" value={uom} onChange={onUomChange} />
      </Form.Group>
      <Form.Row>
      <Form.Group as={Col}>
        <Form.Label>From date</Form.Label>
        <Datetime onChange={onFromDateChange}/>
      </Form.Group>
      <Form.Group as={Col}>
        <Form.Label>Through date</Form.Label>
        <Datetime onChange={onThruDateChange}/>
      </Form.Group>
      </Form.Row>
      <Form.Group>
        <Form.Label>Metadata</Form.Label>
        <Form.Control as="textarea" placeholder="E.g. Region and time of energy generated, type of project, location, etc." value={metadata} onChange={onMetadataChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Manifest</Form.Label>
        <Form.Control as="textarea" placeholder="E.g. URL linking to the registration for the REC, emissions offset purchased, etc." value={manifest} onChange={onManifestChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Automatic retire date</Form.Label>
        <Datetime onChange={onAutomaticRetireDateChange}/>
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Button variant="primary" size="lg" block onClick={handleSubmit}>
        Submit
      </Button>
    </>
  );
}