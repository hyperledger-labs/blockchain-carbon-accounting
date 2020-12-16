import React, { useState } from "react";

import { registerConsumer, unregisterConsumer, registerDealer, unregisterDealer } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function AccessControlForm({ provider }) {

  const [modalShow, setModalShow] = useState(false);

  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Consumer");
  const [result, setResult] = useState("");

  function onAddressChange(event) { setAddress(event.target.value); };

  function handleRegister() {
    switch (role) {
      case "Consumer":
        fetchRegisterConsumer();
        break;
      case "REC":
        fetchRegisterDealer(1);
        break;
      case "CEO":
        fetchRegisterDealer(2);
        break;
      case "AE":
        fetchRegisterDealer(3);
        break;
    }
    setModalShow(true);
  }

  function handleUnregister() {
    switch (role) {
      case "Consumer":
        fetchUnregisterConsumer();
        break;
      case "REC":
        fetchUnregisterDealer(1);
        break;
      case "CEO":
        fetchUnregisterDealer(2);
        break;
      case "AE":
        fetchUnregisterDealer(3);
        break;
    }
    setModalShow(true);
  }

  async function fetchRegisterConsumer() {
    let result = await registerConsumer(provider, address);
    setResult(result.toString());
  }

  async function fetchUnregisterConsumer() {
    let result = await unregisterConsumer(provider, address);
    setResult(result.toString());
  }

  async function fetchRegisterDealer(tokenTypeId) {
    let result = await registerDealer(provider, address, tokenTypeId);
    setResult(result.toString());
  }

  async function fetchUnregisterDealer(tokenTypeId) {
    let result = await unregisterDealer(provider, address, tokenTypeId);
    setResult(result.toString());
  }

  return (
    <>

      <SubmissionModal
        show={modalShow}
        title="Manage roles"
        body={result}
        onHide={() => {setModalShow(false); setResult("")} }
      />

      <h2>Manage roles</h2>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Role</Form.Label>
        <Form.Control as="select">
          <option onClick={() => {setRole("Consumer")}}>Consumer</option>
          <option onClick={() => {setRole("REC")}}>Renewable Energy Certificate Dealer</option>
          <option onClick={() => {setRole("CEO")}}>Carbon Emissions Offset Dealer</option>
          <option onClick={() => {setRole("AE")}}>Audited Emissions Dealer</option>
        </Form.Control>
      </Form.Group>
      <Form.Group>
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
      </Form.Group>
    </>
  );
}
