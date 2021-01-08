import React, { useState } from "react";

import { transfer } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export default function TransferForm({ provider }) {

  const [modalShow, setModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState();
  const [tokenId, setTokenId] = useState();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for retransferquired inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedTokenIdInput, setInitializedTokenIdInput] = useState(false);
  const [initializedAmountInput, setInitializedAmountInput] = useState(false);

  function onAddressChange(event) { setAddress(event.target.value); };
  function onTokenIdChange(event) { setTokenId(event.target.value); };
  function onAmountChange(event) { setAmount(event.target.value); };

  function handleTransfer() {
    fetchTransfer();
    setModalShow(true);
  }

  async function fetchTransfer() {
    let result = await transfer(provider, address, tokenId, amount);
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
        title="Transfer tokens"
        body={result}
        onHide={() => {setModalShow(false); setResult("")} }
      />

      <h2>Transfer tokens</h2>
      <p>Send available tokens in your possession of a particular ID (as displayed on the dashboard) to any address.</p>
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
      </Form.Group>
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
      <Button variant="primary" size="lg" block onClick={handleTransfer}>
        Transfer
      </Button>
    </>
  );
}