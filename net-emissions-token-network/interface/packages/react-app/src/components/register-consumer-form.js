import React, { useState } from "react";

import { registerConsumer, unregisterConsumer } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function RegisterConsumerForm({ provider }) {

  const [modalShow, setModalShow] = useState(false);

  const [address, setAddress] = useState("");
  const [result, setResult] = useState("");

  function onAddressChange(event) { setAddress(event.target.value); };

  function handleRegister() {
    register();
    setModalShow(true);
  }

  function handleUnregister() {
    unregister();
    setModalShow(true);
  }

  async function register() {
    let result = await registerConsumer(provider, address);
    setResult(result.toString());
  }

  async function unregister() {
    let result = await unregisterConsumer(provider, address);
    setResult(result.toString());
  }

  return (
    <>

      <SubmissionModal
        show={modalShow}
        title="Register/unregister consumer"
        body={result}
        onHide={() => {setModalShow(false); setResult("")} }
      />

      <h2>Register/unregister consumer</h2>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
      </Form.Group>
      <Row>
        <Col>
          <Button variant="success" size="lg" block onClick={handleRegister}>
            Register
          </Button>
        </Col>
        <Col>
          <Button variant="danger" size="lg" block onClick={handleUnregister}>
            Unregister
          </Button>
        </Col>
      </Row>
      {result &&
        <>
          <hr/>
          <h5>Result:</h5>
          <pre className="pre-scrollable" style={{"whiteSpace": "pre-wrap"}}>
            <code>
              {result}
            </code>
          </pre>
        </>
      }
    </>
  );
}
