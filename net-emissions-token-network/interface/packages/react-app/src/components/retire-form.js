// SPDX-License-Identifier: Apache-2.0
import React, { useState, useEffect } from "react";

import { retire } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import "react-datetime/css/react-datetime.css";

export default function RetireForm({ provider, roles }) {

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
    let qty = Math.round(amount * 1000);
    let result = await retire(provider, tokenId, qty);
    setResult(result.toString());
  }

  // populate form with URL params if found
  useEffect(() => {
    let queryParams = new URLSearchParams(window.location.search);
    let tokenIdQueryParam = queryParams.get('tokenId');
    let quantityQueryParam = queryParams.get('quantity');

    if (tokenIdQueryParam) {
      setTokenId(tokenIdQueryParam);
    }
    if (quantityQueryParam) {
      setAmount(quantityQueryParam);
    }
  }, []);

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
      <p>Retire some or all tokens in your possession of a particular ID (as displayed on the dashboard). Audited Emissions tokens cannot be retired as they come retired on issuance.</p>
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
          placeholder="0.000"
          value={amount}
          onChange={onAmountChange}
          onBlur={() => setInitializedAmountInput(true)}
          style={(amount || !initializedAmountInput) ? {} : inputError}
        />
      </Form.Group>

      {/* Only enable retires if role is found */}
      { (roles.length === 6) && (roles.some(r => r === true))
        ? <Button variant="danger" size="lg" block onClick={handleRetire}>Retire</Button>
        : <Button disabled variant="danger" size="lg" block>Must be a registered user</Button>
      }
    </>
  );
}
