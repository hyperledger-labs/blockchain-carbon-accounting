import React, { useState } from "react";

import { retire } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

export default function RetireForm({ provider }) {

  const [modalShow, setModalShow] = useState(false);

  // Form inputs
  const [tokenId, setTokenId] = useState();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedTokenIdInput, setInitializedTokenIdInput] = useState(false);
  const [initializedAmountInput, setInitializedAmountInput] = useState(false);

  function onTokenIdChange(event) { setTokenId(event.target.value); };
  function onAmountChange(event) { setAmount(event.target.value); };

  function handleRetire() {
    fetchRetire();
    setModalShow(true);
  }

  async function fetchRetire() {
    let result = await retire(provider, tokenId, amount);
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
        title="Retire tokens"
        body={result}
        onHide={() => {setModalShow(false); setResult("")} }
      />

      <h2>Retire tokens</h2>
      <Form.Group>
        <Form.Label>Token ID</Form.Label>
        <Form.Control
          type="input"
          placeholder="1, 2, 3, ..."
          value={tokenId}
          onChange={onTokenIdChange}
          onBlur={() => setInitializedTokenIdInput(true)}
          style={(tokenId || !initializedTokenIdInput) ? {} : inputError}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Quantity</Form.Label>
        <Form.Control
          type="input"
          placeholder="100"
          value={amount}
          onChange={onAmountChange}
          onBlur={() => setInitializedAmountInput(true)}
          style={(amount || !initializedAmountInput) ? {} : inputError}
        />
      </Form.Group>
      <Button variant="primary" size="lg" block onClick={handleRetire}>
        Submit
      </Button>
    </>
  );
}