// SPDX-License-Identifier: Apache-2.0
import React, { useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { encodeParameters, getAdmin, issue, TOKEN_TYPES } from "../services/contract-functions";
import CreateProposalModal from "./create-proposal-modal";
import SubmissionModal from "./submission-modal";




export default function IssueForm({ provider, roles, signedInAddress, limitedMode }) {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);
  const [createModalShow, setCreateModalShow] = useState(false);

  // admin address (if contract is in limitedMode)
  const [adminAddress, setAdminAddress] = useState("");

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

  // Calldata
  const [calldata, setCalldata] = useState("");

  // After initial onFocus for required inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [initializedQuantityInput, setInitializedQuantityInput] = useState(false);

  const onAddressChange = useCallback((event) => { setAddress(event.target.value); }, []);
  const onTokenTypeIdChange = useCallback((event) => { setTokenTypeId(event.target.value); }, []);
  const onQuantityChange = useCallback((event) => { setQuantity(event.target.value); }, []);
  const onFromDateChange = useCallback((event) => { setFromDate(event._d); }, []);
  const onThruDateChange = useCallback((event) => { setThruDate(event._d); }, []);
  const onAutomaticRetireDateChange = useCallback((event) => { setAutomaticRetireDate(event._d); }, []);
  const onMetadataChange = useCallback((event) => { setMetadata(event.target.value); }, []);
  const onManifestChange = useCallback((event) => { setManifest(event.target.value); }, []);
  const onDescriptionChange = useCallback((event) => { setDescription(event.target.value); }, []);

  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  // update calldata on input change
  useEffect(() => {
    console.log('useEffect setCalldata...');
    if (signedInAddress) {
      let encodedCalldata;
      try {
        encodedCalldata = encodeParameters(
          // types of params
          [
            'address',
            'address',
            'uint8',
            'uint256',
            'uint256',
            'uint256',
            'uint256',
            'string',
            'string',
            'string'
          ],
          // value of params
          [
            (limitedMode === true ? adminAddress : address),
            signedInAddress,
            tokenTypeId,
            Number(quantity),
            Number(fromDate)/1000,
            Number(thruDate)/1000,
            Number(automaticRetireDate)/1000,
            metadata,
            manifest,
            ("Issued by DAO. " + description)
          ]
        );
      } catch (error) {
        encodedCalldata = "";
      }
      setCalldata(encodedCalldata);
    }
  }, [
    signedInAddress,
    limitedMode,
    adminAddress,
    address,
    tokenTypeId,
    quantity,
    fromDate,
    thruDate,
    automaticRetireDate,
    metadata,
    manifest,
    description,
  ]);

  useEffect(() => {
    console.log('useEffect fetchAdmin...');
    async function fetchAdmin() {
      setAdminAddress(await getAdmin(provider));
    }
    if (limitedMode === true) {
      fetchAdmin();
    }
  }, [limitedMode, provider]);

  async function submit() {
    // If quantity has 3 decimals, multiply by 1000 before passing to the contract
    let quantity_formatted;
    if (tokenTypeId === "3") {
      quantity_formatted = Math.round(quantity * 1000);
    } else {
      quantity_formatted = quantity;
    }

    let result = await issue(provider, address, tokenTypeId, quantity_formatted, fromDate, thruDate, automaticRetireDate, metadata, manifest, description);
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return (roles[0] || roles[1] || roles[2] || roles[3]) ? (
    <>

      <CreateProposalModal
        show={createModalShow}
        title="Create a proposal"
        onHide={() => {
          setCreateModalShow(false);
        }}
        token={tokenTypeId}
        provider={provider}
        calldata={calldata}
        description={description}
      />

      <SubmissionModal
        show={submissionModalShow}
        title="Issue tokens"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <h2>Issue tokens</h2>
      <p>Issue tokens (Renewable Energy Certificate, Carbon Emissions Offset, or Audited Emissions) to registered consumers.</p>

      { ((!limitedMode) || (tokenTypeId === "3"))
        ?
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
        :
        <Form.Group>
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="input"
            value={adminAddress}
            disabled
            onBlur={() => setInitializedAddressInput(true)}
            style={(address || !initializedAddressInput) ? {} : inputError}
          />
          <Form.Text className="text-muted">
            Always set to admin address in limited mode.
          </Form.Text>
        </Form.Group>
      }


      <Form.Group>
        <Form.Label>Token Type</Form.Label>
        <Form.Control as="select" onChange={onTokenTypeIdChange}>
          {(roles[0] || roles[1]) ? <option value={1}>{TOKEN_TYPES[0]}</option> : null}
          {(roles[0] || roles[2]) ? <option value={2}>{TOKEN_TYPES[1]}</option> : null}
          {(roles[0] || roles[3]) ? <option value={3}>{TOKEN_TYPES[2]}</option> : null}
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Quantity</Form.Label>
        <Form.Control
          type="input"
          placeholder={(tokenTypeId === "3") ? "100.000" : "100"}
          value={quantity}
          onChange={onQuantityChange}
          onBlur={() => setInitializedQuantityInput(true)}
          style={(quantity || !initializedQuantityInput) ? {} : inputError}
        />
        {/* Display whether decimal is needed or not */}
        <Form.Text className="text-muted">
          {(tokenTypeId === "3")
            ? "Must not contain more than three decimal values."
            : "Must be an integer value."
          }
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
        <Form.Group as={Col}>
          <Form.Label>Automatic retire date</Form.Label>
          <Datetime onChange={onAutomaticRetireDateChange}/>
        </Form.Group>
      </Form.Row>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Metadata</Form.Label>
        <Form.Control as="textarea" placeholder="E.g. Region and time of energy generated, type of project, location, etc." value={metadata} onChange={onMetadataChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Manifest</Form.Label>
        <Form.Control as="textarea" placeholder="E.g. URL linking to the registration for the REC, emissions offset purchased, etc." value={manifest} onChange={onManifestChange} />
      </Form.Group>

      <Row className="mt-4">
        <Col>

          {/* if in limited mode, require dealer role (except AE) to make a DAO proposal */}
          { (limitedMode && (!roles[0] && !roles[1] && !roles[2]))
            ?
            <Button
              variant="success"
              size="lg"
              block
              disabled={true}
            >
              Must be a registered dealer
            </Button>
            :
            <Button
              variant="success"
              size="lg"
              block
              onClick={() => setCreateModalShow(true)}
              disabled={
                (calldata.length === 0) ||
                String(quantity).length === 0 ||
                tokenTypeId === "3"
              }
            >
              Create a DAO proposal token
            </Button>
          }

        </Col>

        { ( !limitedMode || tokenTypeId === "3" ) &&
          <Col>
            {/* Only enable issue if role is found */}
            { (roles[0] || roles[1] || roles[2] || roles[3])
              ?
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={handleSubmit}
              disabled={(calldata.length === 0) || String(quantity).length === 0 || String(address).length === 0}
                >
                  Issue
                </Button>
              :
                <Button variant="primary" size="lg" block disabled>Must be a registered dealer</Button>
            }
          </Col>
        }

      </Row>

    </>
  ) : (
    <p>You must be a registered dealer to issue tokens.</p>
  );
}
