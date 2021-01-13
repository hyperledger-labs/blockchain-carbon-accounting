import React, { useState } from "react";

import { issue } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

export default function IssueForm({ provider }) {

  const [modalShow, setModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [tokenTypeId, setTokenTypeId] = useState(1);
  const [quantity, setQuantity] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [thruDate, setThruDate] = useState("");
  const [automaticRetireDate, setAutomaticRetireDate] = useState("");
  const [metadata, setMetadata] = useState("");
  const [manifest, setManifest] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedQuantityInput, setInitializedQuantityInput] = useState(false);

  function onAddressChange(event) { setAddress(event.target.value); };
  function onTokenTypeIdChange(event) { setTokenTypeId(event.target.value); };
  function onQuantityChange(event) { setQuantity(event.target.value); };
  function onFromDateChange(event) { setFromDate(event._d); };
  function onThruDateChange(event) { setThruDate(event._d); };
  function onAutomaticRetireDateChange(event) { setAutomaticRetireDate(event._d) };
  function onMetadataChange(event) { setMetadata(event.target.value); };
  function onManifestChange(event) { setManifest(event.target.value); };
  function onDescriptionChange(event) { setDescription(event.target.value); };

  function handleSubmit() {
    submit();
    setModalShow(true);
  }

  async function submit() {
    let result = await issue(provider, address, tokenTypeId, quantity, fromDate, thruDate, automaticRetireDate, metadata, manifest, description);
    setResult(result.toString());
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
      <p>Issue tokens (Renewable Energy Certificate, Carbon Emissions Offset, or Audited Emissions) to registered consumers.</p>
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
        <Form.Control as="select" onChange={onTokenTypeIdChange}>
          <option value={1}>Renewable Energy Certificate</option>
          <option value={2}>Carbon Emissions Offset</option>
          <option value={3}>Audited Emissions</option>
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
      <Form.Row>
        <Form.Group as={Col}>
          <Form.Label>From date</Form.Label>
          <Datetime onChange={onFromDateChange}/>
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>Through date</Form.Label>
          <Datetime onChange={onThruDateChange}/>
        </Form.Group>
        <Form.Group as={Col}>
          <Form.Label>Automatic retire date</Form.Label>
          <Datetime onChange={onAutomaticRetireDateChange}/>
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
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Button variant="primary" size="lg" block onClick={handleSubmit}>
        Issue
      </Button>
    </>
  );
}