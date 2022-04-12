// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEventHandler, useState, useEffect } from "react";

import { transfer } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo } from "./static-data";
import { InputGroup } from "react-bootstrap";
import WalletLookupInput from "./wallet-lookup-input";

type TransferFormProps = {
  provider?: Web3Provider
  roles: RolesInfo
}

const TransferForm:FC<TransferFormProps> = ({ provider, roles }) => {

  const [modalShow, setModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [tokenId, setTokenId] = useState(1);
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for retransferquired inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedTokenIdInput, setInitializedTokenIdInput] = useState(false);
  const [initializedAmountInput, setInitializedAmountInput] = useState(false);

  const onAddressChange: ChangeEventHandler<HTMLInputElement> = (event) => { setAddress(event.target.value); };
  const onTokenIdChange: ChangeEventHandler<HTMLInputElement> = (event) => { setTokenId(parseInt(event.target.value)); };
  const onAmountChange: ChangeEventHandler<HTMLInputElement> = (event) => { setAmount(event.target.value); };

  function handleTransfer() {
    fetchTransfer();
    setModalShow(true);
  }

  async function fetchTransfer() {
    if (!provider) return;
    const qty = Math.round(Number(amount) * 1000);
    const result = await transfer(provider, address, tokenId, qty);
    setResult(result.toString());
  }

  // populate form with URL params if found
  useEffect(() => {
    let queryParams = new URLSearchParams(window.location.search);
    let addressQueryParam = queryParams.get('address');
    let tokenIdQueryParam = queryParams.get('tokenId');
    let quantityQueryParam = queryParams.get('quantity');

    if (addressQueryParam) {
      setAddress(addressQueryParam);
    }
    if (tokenIdQueryParam) {
      setTokenId(parseInt(tokenIdQueryParam));
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
        title="Transfer tokens"
        body={result}
        onHide={() => {setModalShow(false); setResult("")} }
      />

      <h2>Transfer tokens</h2>
      <p>Send available tokens in your possession of a particular ID (as displayed on the dashboard) to any address. Audited Emissions tokens cannot be transferred as they come automatically retired.</p>
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
          placeholder="0.000"
          value={amount}
          onChange={onAmountChange}
          onBlur={() => setInitializedAmountInput(true)}
          style={(amount || !initializedAmountInput) ? {} : inputError}
        />
      </Form.Group>
      {/* Only enable transfers if role is found */}
      { roles.hasAnyRole
        ? <Button variant="success" size="lg" block onClick={handleTransfer}>Transfer</Button>
        : <Button disabled variant="success" size="lg" block>Must be a registered user</Button>
      }
    </>
  );
}

export default TransferForm;
