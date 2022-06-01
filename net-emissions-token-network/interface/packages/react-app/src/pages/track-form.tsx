// SPDX-License-Identifier: Apache-2.0
import { FC, ChangeEventHandler, useCallback, useState } from "react";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { InputGroup } from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { track } from "../services/contract-functions";
import SubmissionModal from "../components/submission-modal";
import WalletLookupInput from "../components/wallet-lookup-input";
import { RolesInfo } from "../components/static-data";

type TrackFormProps = {
  provider?: Web3Provider | JsonRpcProvider
  roles: RolesInfo
}

const TrackForm:FC<TrackFormProps> = ({ provider, roles }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [tokenIds, setTokenIds] = useState("");
  const [inAmounts, setInAmounts] = useState("");
  const [outAmounts, setOutAmounts] = useState("");
  const [trackerIds, setTrackerIds] = useState("");
  const [fromDate, setFromDate] = useState<Date|null>(null);
  const [thruDate, setThruDate] = useState<Date|null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedQuantityInput, setInitializedQuantityInput] = useState(false);

  const onTokenIdsChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => { setTokenIds(event.target.value); }, []);
  const onInAmountsChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => { setInAmounts(event.target.value); }, []);
  const onOutAmountsChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => { setOutAmounts(event.target.value); }, []);
  const onTrackerIdsChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => { setTrackerIds(event.target.value); }, []);
  const onDescriptionChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => { setDescription(event.target.value); }, []);

  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  async function submit() {
    if (!provider) return;
    if (!fromDate) {
      setResult("Invalid from date");
      return;
    }
    if (!thruDate) {
      setResult("Invalid thru date");
      return;
    }
    // we consider inAmounts has 3 decimals, multiply by 1000 before passing to the contract
    let result = await track(provider,
      address,
      tokenIds,
      inAmounts,
      fromDate,
      thruDate,
      description);
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return (
    <>
      {(!roles.isAeDealer) ?
        <div className="mt-4">
          <h4>Only emission auditor can issue a tracker</h4>
        </div>
        :
        <div className="mt-4">
          <SubmissionModal
            show={submissionModalShow}
            title="Create carbon tracker NFT"
            body={result}
            onHide={() => {setSubmissionModalShow(false); setResult("")} }
          />
          <h2>Carbon Tracker NFT</h2>
          <p>Create emission profile (C-NFT) using voluntary carbon tracker tokens, audited emission certificates, RECs, and offset credits. </p>
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
            <Form.Text className="text-muted">
              Must be a registered industry.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="tokenInput">
            <Form.Label>Token IDs</Form.Label>
            <Form.Control
              type="input"
              placeholder="1,2,..."
              value={tokenIds}
              onChange={onTokenIdsChange}
              onBlur={() => setInitializedQuantityInput(true)}
              style={(inAmounts || !initializedQuantityInput) ? {} : inputError}
            />
            {/* Display whether decimal is needed or not */}
            <Form.Text className="text-muted">
              Must be expressed as integer kg.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="retiredAmountsInput">
            <Form.Label>Retired Amounts</Form.Label>
            <Form.Control
              type="input"
              placeholder="1,2,..."
              value={inAmounts}
              onChange={onInAmountsChange}
              onBlur={() => setInitializedQuantityInput(true)}
              style={(inAmounts || !initializedQuantityInput) ? {} : inputError}
            />
            {/* Display whether decimal is needed or not */}
            <Form.Text className="text-muted">
              Must be expressed as integer kgs.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="transferredAmountsInput">
            <Form.Label>Transferred Amounts</Form.Label>
            <Form.Control
              type="input"
              placeholder="1,2,..."
              value={outAmounts}
              onChange={onOutAmountsChange}
              onBlur={() => setInitializedQuantityInput(true)}
              style={(outAmounts || !initializedQuantityInput) ? {} : inputError}
            />
            {/* Display whether decimal is needed or not */}
            <Form.Text className="text-muted">
              Must be expressed as integer kgs.
            </Form.Text>
          </Form.Group>
          <Row>
            <Form.Group as={Col} className="mb-3" controlId="fromDateInput">
              <Form.Label>From date</Form.Label>
              {/* @ts-ignore : some weird thing with the types ... */}
              <Datetime onChange={(moment)=>{setFromDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
            </Form.Group>
            <Form.Group as={Col} className="mb-3" controlId="thruDateInput">
              <Form.Label>Through date</Form.Label>
              {/* @ts-ignore : some weird thing with the types ... */}
              <Datetime onChange={(moment)=>{setThruDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
            </Form.Group>
          </Row>
          <Form.Group className="mb-3" controlId="trackerIdsInput">
            <Form.Label>Tracker IDs</Form.Label>
            <Form.Control
              type="input"
              placeholder="0"
              value={trackerIds}
              onChange={onTrackerIdsChange}
              onBlur={() => setInitializedQuantityInput(true)}
              style={(trackerIds || !initializedQuantityInput) ? {} : inputError}
            />
            {/* Display whether decimal is needed or not */}
            <Form.Text className="text-muted">
              Provide the source tracker nft here.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
          </Form.Group>
          <Row className="mt-4">
            <Col>
              <Button
                className="w-100"
                variant="primary"
                size="lg"
                onClick={handleSubmit}
              >
                Track
              </Button>
            </Col>
          </Row>
        </div>
      }
    </>
  )
}


export default TrackForm;
