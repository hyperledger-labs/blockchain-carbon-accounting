// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEventHandler, useState, useEffect } from "react";

import { transferProduct } from "../services/contract-functions";

import SubmissionModal from "../components/submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";
import { InputGroup } from "react-bootstrap";
import WalletLookupInput from "../components/wallet-lookup-input";

type ProductTransferFormProps = {
  provider?: Web3Provider
  roles: RolesInfo
  productIdParam: number
  trackerIdParam: number
}

const ProductTransferForm:FC<ProductTransferFormProps> = ({ provider, roles, trackerIdParam, productIdParam }) => {

  const [modalShow, setModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [productId, setProductId] = useState(1);
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for retransferquired inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedProductIdInput, setInitializedProductIdInput] = useState(false);
  const [initializedAmountInput, setInitializedAmountInput] = useState(false);

  setProductId(Number(productIdParam));
  const onProductIdChange: ChangeEventHandler<HTMLInputElement> = (event) => { setProductId(parseInt(event.target.value)); };
  const onAmountChange: ChangeEventHandler<HTMLInputElement> = (event) => { setAmount(event.target.value); };

  function handleTransfer() {
    fetchTransfer();
    setModalShow(true);
  }

  async function fetchTransfer() {
    if (!provider ) return;
    console.log('s')
    const qty = Number(amount);//Math.round(Number(amount) * 1000);
    const result = await transferProduct(provider, productId, qty, trackerIdParam, address);
    setResult(result.toString());
  }

  // populate form with URL params if found
  useEffect(() => {
    let queryParams = new URLSearchParams(window.location.search);
    let addressQueryParam = queryParams.get('address');
    let productIdQueryParam = queryParams.get('productId');
    let quantityQueryParam = queryParams.get('quantity');

    if (addressQueryParam) {
      setAddress(addressQueryParam);
    }
    if (productIdQueryParam) {
      setProductId(parseInt(productIdQueryParam));
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

      <h2>Transfer products</h2>
      <p>Send available products in your possession of a particular ID (as displayed on the dashboard) to any address.</p>
      <Form.Group className="mb-3" controlId="addressInput">
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
      <Form.Group className="mb-3" controlId="tokenInput">
        <Form.Label>Product ID</Form.Label>
        <Form.Control
          type="input"
          placeholder="1, 2, 3, ..."
          value={productId}
          onChange={onProductIdChange}
          disabled={Number(productIdParam)>0}
          onBlur={() => setInitializedProductIdInput(true)}
          style={(productId || !initializedProductIdInput) ? {} : inputError}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="tokenInput">
        <Form.Label>Product ID</Form.Label>
        <Form.Control
          type="input"
          placeholder="1, 2, 3, ..."
          value={trackerIdParam}
          //onChange={onProductIdChange}
          disabled={Number(trackerIdParam)>0}
          //onBlur={() => setInitializedProductIdInput(true)}
          //style={(productId || !initializedProductIdInput) ? {} : inputError}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="quantityInput">
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
        ? <Button className="w-100" variant="success" size="lg" onClick={handleTransfer}>Transfer</Button>
        : <Button className="w-100" disabled variant="success" size="lg">Must be a registered user</Button>
      }
    </>
  );
}

export default ProductTransferForm;
