// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEvent, useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsTrash, BsPlus } from 'react-icons/bs';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { addresses } from "@project/contracts";
import { encodeParameters, getAdmin, productUpdate } from "../services/contract-functions";
import CreateProposalModal from "../components/create-proposal-modal";
import SubmissionModal from "../components/submission-modal";
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo, TOKEN_TYPES } from "../components/static-data";
import WalletLookupInput from "../components/wallet-lookup-input";
import { InputGroup } from "react-bootstrap";

type KeyValuePair = {
  key: string
  value: string
}

type ProductFormProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo,
  limitedMode: boolean,
  trackerId: number,
}
 
const ProductForm: FC<ProductFormProps> = ({ provider, roles, signedInAddress, limitedMode, trackerId }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);
  const [createModalShow, setCreateModalShow] = useState(false);

  // admin address (if contract is in limitedMode)
  const [adminAddress, setAdminAddress] = useState("");

  // Form inputs
  const [address, setAddress] = useState("");
  const [issuedFrom, setIssuedFrom] = useState("");
  
  //const [trackerId, setTrackerId] = useState("");
  const [productName, setProductName] = useState("");
  const [productAmount, setProductAmount] = useState("");
  const [productUnitAmount, setProductUnitAmount] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [result, setResult] = useState("");

  const [manifestjson, setManifestjson] = useState("");
  const [manifest, setManifest] = useState<KeyValuePair[]>([]);

  // Calldata
  const [calldata, setCalldata] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  //const [initializedTrackerIdInput, setInitializedTrackerIdInput] = useState(false);
  const [initializedProductNameInput, setInitializedProductNameInput] = useState(false);
  const [initializedProductAmountInput, setInitializedProductAmountInput] = useState(false);
  const [initializedProductUnitAmountInput, setInitializedProductUnitAmountInput] = useState(false);
  const [initializedProductUnitInput, setInitializedProductUnitInput] = useState(false);

  const onProductNameChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductName(event.target.value); }, []);
  const onProductAmountChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductAmount(event.target.value); }, []);
  const onProductUnitAmountChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductUnitAmount(event.target.value); }, []);
  const onProductUnitChange  = useCallback((event: ChangeEvent<HTMLInputElement>) => { setProductUnit(event.target.value); }, []);
  
  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  function disableIssueButton(calldata: string, productAmount: number|string, address: string) {
    let qty = Number(productAmount);
    return (calldata.length === 0) || (qty === 0)
  }

  useEffect(() => {
    async function fetchAdmin() {
      if (provider) setAdminAddress(await getAdmin(provider));
    }
    if (limitedMode === true) {
      fetchAdmin();
    }
  }, [limitedMode, provider]);


  async function submit() {
    if (!provider) return;
    let productAmount_formatted = Math.round(Number(productAmount));
    let productUnitAmount_formatted = Math.round(Number(productUnitAmount));

    let result = await productUpdate(
      provider,trackerId,productAmount_formatted,
      productName, productUnit, productUnitAmount_formatted);
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return roles.hasAnyRole ? (
    <>
      <SubmissionModal
        show={submissionModalShow}
        title="Issue tokens"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <h2>Add product to tracker</h2>

      <p>Issue tokens (Renewable Energy Certificate, Carbon Emissions Offset, Audited Emissions, Carbon Tracker) to registered consumers.</p>

      <Form.Group className="mb-3" controlId="trackerIdInput">
        <Form.Label>TrackerId</Form.Label>
        <Form.Control
          type="input"
          value={trackerId}
          disabled={true}
          //onChange={onTrackerIdChange}
          //onBlur={() => setInitializedTrackerIdInput(true)}
          //style={(trackerId || !initializedTrackerIdInput) ? {} : inputError}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="productInput">
        <Form.Label>Add product</Form.Label>
        <Form.Control
          type="input"
          placeholder="Product name (e.g., oil and gas)"
          value={productName}
          onChange={onProductNameChange}
          onBlur={() => setInitializedProductNameInput(true)}
          style={(productName || !initializedProductNameInput) ? {} : inputError}
        />
        <Form.Label>Product amount</Form.Label>
        <Form.Control
          type="input"
          placeholder="0"
          value={productAmount}
          onChange={onProductAmountChange}
          onBlur={() => setInitializedProductAmountInput(true)}
          style={(productAmount || !initializedProductAmountInput) ? {} : inputError}
        />

        <Form.Label>Product unit</Form.Label>
        <Form.Control
          type="input"
          placeholder="product units (e.g., kwh)"
          value={productUnit}
          onChange={onProductUnitChange}
          onBlur={() => setInitializedProductUnitInput(true)}
          style={(productUnit || !initializedProductUnitInput) ? {} : inputError}
        />
        <Form.Label>Product unit amount</Form.Label>
        <Form.Control
          type="input"
          placeholder="amount of product in unit (e.g., 1000 kwh)"
          value={productUnitAmount}
          onChange={onProductUnitAmountChange}
          onBlur={() => setInitializedProductUnitAmountInput(true)}
          style={(productUnitAmount || !initializedProductUnitAmountInput) ? {} : inputError}
        />

      </Form.Group>
      <Row className="mt-4">

        { ( !limitedMode) &&
          <Col>
            {/* Only enable issue if any role is found */}
            { roles.hasAnyRole
              ?
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={handleSubmit}
                  //disabled={disableIssueButton(calldata, quantity, address)}
                >
                  Issue
                </Button>
              :
                <Button variant="primary" size="lg" disabled>Must be a registered dealer</Button>
            }
          </Col>
        }

      </Row>

    </>
  ) : (
    <p>You must be a registered dealer to issue tokens.</p>
  );
}

export default ProductForm;
