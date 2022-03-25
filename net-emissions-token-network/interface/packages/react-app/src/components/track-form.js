// SPDX-License-Identifier: Apache-2.0
import React, { useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { encodeParameters, track, registerTracker } from "../services/contract-functions";
import SubmissionModal from "./submission-modal";

export default function TrackForm({ provider, registeredTracker, signedInAddress }) {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [tokenIds, setTokenIds] = useState("");
  const [inAmounts, setInAmounts] = useState("");
  const [outAmounts, setOutAmounts] = useState("");
  const [trackerIds, setTrackerIds] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [thruDate, setThruDate] = useState("");
  const [result, setResult] = useState("");


  // Calldata
  const [calldata, setCalldata] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedQuantityInput, setInitializedQuantityInput] = useState(false);

  const onAddressChange = useCallback((event) => { setAddress(event.target.value); }, []);
  const onTokenIdsChange = useCallback((event) => { setTokenIds(event.target.value); }, []);
  const onInAmountsChange = useCallback((event) => { setInAmounts(event.target.value); }, []);
  const onOutAmountsChange = useCallback((event) => { setOutAmounts(event.target.value); }, []);
  const onTrackerIdsChange = useCallback((event) => { setTrackerIds(event.target.value); }, []);
  const onFromDateChange = useCallback((event) => { setFromDate(event._d); }, []);
  const onThruDateChange = useCallback((event) => { setThruDate(event._d); }, []);

  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  // function disableIssueButton(calldata, inAmounts, address) {
  //   let qty = Number(inAmounts);
  //   return (calldata.length === 0) || (qty === 0) || (String(address).length === 0)
  // }

  // update calldata on input change
  useEffect(() => {
    if (signedInAddress) {
      let encodedCalldata;
      // let qty = Number(inAmounts);
      // qty = Math.round(inAmounts * 1000);

      try {
        encodedCalldata = encodeParameters(
          // types of params
          [
            'address',
            'address',
            'uint256[]',
            'uint256',
            'uint256',
            'uint256',
            'string',
            'string'
          ],
          // value of params
          [
            address,
            signedInAddress,
            tokenIds,
            inAmounts,
            outAmounts,
            trackerIds,
            fromDate,
            thruDate
          ]
        );
      } catch (error) {
        encodedCalldata = "";
      }
      setCalldata(encodedCalldata);
    }
  }, [
    address,
    signedInAddress,
    tokenIds,
    inAmounts,
    outAmounts,
    trackerIds,
    fromDate,
    thruDate
  ]);

  async function submit() {
    // we consider inAmounts has 3 decimals, multiply by 1000 before passing to the contract
    //let quantity_formatted;
    //quantity_formatted = Math.round(inAmounts * 1000);
    let result = await track(provider, address, tokenIds, inAmounts, outAmounts, trackerIds, fromDate, thruDate);
    setResult(result.toString());
  }

  async function register() {
    // we consider inAmounts has 3 decimals, multiply by 1000 before passing to the contract
    //let quantity_formatted;
    //quantity_formatted = Math.round(inAmounts * 1000);
    let result = await registerTracker(provider, address);
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return (
    <>
      {(!registeredTracker) ?
        <div className="mt-4">{registeredTracker}
          <h4>Register tracker</h4>
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Control as="select" disabled>
              <option value="REGISTERED_TRACKER">Registered Tracker</option>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Row>
              <Col>
                <Button variant="success" size="lg" block onClick={register}>
                  Register
                </Button>
              </Col>
            </Row>
          </Form.Group>
        </div>
        : 
        <div className="mt-4">
          <SubmissionModal
            show={submissionModalShow}
            title="Create carbon tracker NFT"
            body={result}
            onHide={() => {setSubmissionModalShow(false); setResult("")} }
          />
          <h2>Track</h2>
          <p>Create emission profile using RECs, offsets, audited emission certificates, and voluntary carbon tracker tokens.</p>
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
              Must be a registered industry.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>token IDs</Form.Label>
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
          <Form.Group>
            <Form.Label>retired Amounts</Form.Label>
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
          <Form.Group>
            <Form.Label>transferred Amounts</Form.Label>
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
          <Row className="mt-4">
            <Col>
              <Button
                variant="primary"
                size="lg"
                block
                onClick={handleSubmit}
                //disabled={disableIssueButton(calldata, quantity, address)}
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
