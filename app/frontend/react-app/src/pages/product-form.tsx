// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEvent, useCallback, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import "react-datetime/css/react-datetime.css";
import { productUpdate } from "../services/contract-functions";
import SubmissionModal from "../components/submission-modal";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { trpcClient } from "../services/trpc";
import { RolesInfo } from "../components/static-data";

type ProductFormProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string,
  roles: RolesInfo,
  limitedMode: boolean,
  trackerId: number,
}

const ProductForm: FC<ProductFormProps> = ({ provider, roles, limitedMode, trackerId }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  const [productName, setProductName] = useState("");
  const [productAmount, setProductAmount] = useState("");
  const [productUnitAmount, setProductUnitAmount] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
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

  async function submit() {
    if (!provider) return;
    let productAmount_formatted = BigInt(productAmount);
    let productUnitAmount_formatted = BigInt(productUnitAmount);

    let result = await productUpdate(
      provider,trackerId,productAmount_formatted,
      productName, productUnit, productUnitAmount_formatted);
      let address = await provider.getSigner().getAddress();
      console.log(result)
    try {
      await trpcClient.mutation('producToken.insert', {
        productId: 0,
        trackerId: trackerId,
        auditor: address,
        amount: productAmount_formatted,
        available: productAmount_formatted,
        name: productName,
        unit: productUnit,
        unitAmount: productUnitAmount_formatted,
        hash: result[1].hash.toString(),
      })
    } catch (error) {
      console.error('trpc error;', error)
    }

    setResult(result[0].toString());
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
      <h2>Add product to emission certificate</h2>

      <Form.Group className="mb-3" controlId="trackerIdInput">
        <Form.Label>TrackerId</Form.Label>
        <Form.Control
          type="input"
          value={trackerId}
          disabled={true}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="productInput">
        <Form.Label>Product details</Form.Label>
        <Form.Control
          type="input"
          placeholder="Product name (e.g., oil and gas)"
          value={productName}
          onChange={onProductNameChange}
          onBlur={() => setInitializedProductNameInput(true)}
          style={(productName || !initializedProductNameInput) ? {} : inputError}
        />
        <Form.Label>Product amount (unitless)</Form.Label>
        <Form.Control
          type="input"
          placeholder="0"
          value={productAmount}
          onChange={onProductAmountChange}
          onBlur={() => setInitializedProductAmountInput(true)}
          style={(productAmount || !initializedProductAmountInput) ? {} : inputError}
        />
        <Form.Text className="text-muted">
          Set a unitless amount of products to be distributed to other industries and consumers.
          This number will determine the weighting of emissions across multiple product types.
        </Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="productUnitsInput">
        <Form.Label>Product units</Form.Label>
        <Form.Control
          type="input"
          placeholder="product units (e.g., kwh)"
          value={productUnit}
          onChange={onProductUnitChange}
          onBlur={() => setInitializedProductUnitInput(true)}
          style={(productUnit || !initializedProductUnitInput) ? {} : inputError}
        />

        <Form.Label>Product amount (units)</Form.Label>
        <Form.Control
          type="input"
          placeholder="0"
          value={productUnitAmount}
          onChange={onProductUnitAmountChange}
          onBlur={() => setInitializedProductUnitAmountInput(true)}
          style={(productUnitAmount || !initializedProductUnitAmountInput) ? {} : inputError}
        />
        <Form.Text className="text-muted">
          This information is used to convert unitless product amounts into physical product units.
          If necessary it can be stored off network to conceal sensitive commercial data.
        </Form.Text>
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
