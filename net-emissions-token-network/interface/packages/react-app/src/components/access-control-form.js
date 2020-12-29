import React, { useState, useEffect } from "react";

import { getRoles, registerConsumer, unregisterConsumer, registerDealer, unregisterDealer } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function AccessControlForm({ provider, signedInAddress }) {

  const [modalShow, setModalShow] = useState(false);

  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Consumer");
  const [result, setResult] = useState("");
  const [myRoles, setMyRoles] = useState();
  const [fetchingMyRoles, setFetchingMyRoles] = useState(false);

  useEffect(() => {
    if (provider && signedInAddress) {
      if (!myRoles && !fetchingMyRoles) {
        setFetchingMyRoles(true);
        fetchMyRoles();
      }
    }
  }, [signedInAddress]);

  function xOrCheck(value) {
    if (value) {
      return <span className="text-success">✔</span>;
    } else {
      return <span className="text-danger">✖</span>;
    }
  }

  async function fetchMyRoles() {
    let result = await getRoles(provider, signedInAddress);
    setMyRoles(result);
    setFetchingMyRoles(false);
  }

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

      <h4>My Roles</h4>
      {myRoles ? 
        <Row className="text-center mb-3">
          <Col><small>Owner</small> {xOrCheck(myRoles[0])}</Col>
          <Col><small>Renewable Energy Certificate Dealer</small> {xOrCheck(myRoles[1])}</Col>
          <Col><small>Carbon Emissions Offset Dealer</small> {xOrCheck(myRoles[2])}</Col>
          <Col><small>Audited Emissions Dealer</small> {xOrCheck(myRoles[3])}</Col>
          <Col><small>Consumer</small> {xOrCheck(myRoles[4])}</Col>
        </Row>
        : 
        <div className="text-center mt-3 mb-3">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      }

      <h4>Register/unregister dealers and consumers</h4>
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
