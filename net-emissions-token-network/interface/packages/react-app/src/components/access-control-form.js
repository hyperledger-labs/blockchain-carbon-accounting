import React, { useState } from "react";

import { getRoles, registerConsumer, unregisterConsumer, registerDealer, unregisterDealer } from "../services/contract-functions";

import SubmissionModal from "./submission-modal";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

export default function AccessControlForm({ provider, signedInAddress, roles }) {

  const [modalShow, setModalShow] = useState(false);

  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Consumer");
  const [result, setResult] = useState("");

  // Fetching roles of outside address
  const [theirAddress, setTheirAddress] = useState();
  const [theirRoles, setTheirRoles] = useState([]);

  function xOrCheck(value) {
    if (value) {
      return <span className="text-success">✔</span>;
    } else {
      return <span className="text-danger">✖</span>;
    }
  }

  async function fetchTheirRoles() {
    let result = await getRoles(provider, theirAddress);
    setTheirRoles(result);
  }

  function onAddressChange(event) { setAddress(event.target.value); };
  function onTheirAddressChange(event) { setTheirAddress(event.target.value); };
  function onRoleChange(event) { setRole(event.target.value); };

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
      default:
        console.error("Can't find role");
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
      default:
        console.error("Can't find role");
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
      <p>Register or unregister roles for different addresses on the network. Must be an owner to register dealers, and must be a dealer to register consumers.</p>

      <h4>My Roles</h4>
      {roles.length === 5 ? 
        <Row className="text-center mb-3">
          <Col className="align-self-center"><small>Owner</small> {xOrCheck(roles[0])}</Col>
          <Col className="align-self-center"><small>Renewable Energy Certificate Dealer</small> {xOrCheck(roles[1])}</Col>
          <Col className="align-self-center"><small>Carbon Emissions Offset Dealer</small> {xOrCheck(roles[2])}</Col>
          <Col className="align-self-center"><small>Audited Emissions Dealer</small> {xOrCheck(roles[3])}</Col>
          <Col className="align-self-center"><small>Consumer</small> {xOrCheck(roles[4])}</Col>
        </Row>
        : 
        <div className="text-center mt-3 mb-3">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      }

      <h4>Look-up Roles</h4>
      <InputGroup className="mb-3">
        <FormControl
          placeholder="0x000..."
          onChange={onTheirAddressChange}
        />
        <InputGroup.Append>
          <Button variant="outline-secondary" onClick={fetchTheirRoles}>Look-up</Button>
        </InputGroup.Append>
      </InputGroup>
      {theirRoles.length === 5 &&
        <Row className="text-center mb-3">
          <Col className="align-self-center"><small>Owner</small> {xOrCheck(theirRoles[0])}</Col>
          <Col className="align-self-center"><small>Renewable Energy Certificate Dealer</small> {xOrCheck(theirRoles[1])}</Col>
          <Col className="align-self-center"><small>Carbon Emissions Offset Dealer</small> {xOrCheck(theirRoles[2])}</Col>
          <Col className="align-self-center"><small>Audited Emissions Dealer</small> {xOrCheck(theirRoles[3])}</Col>
          <Col className="align-self-center"><small>Consumer</small> {xOrCheck(theirRoles[4])}</Col>
        </Row>
      }

      {/* Only display registration/unregistration tokens if owner or dealer */}
      {(roles[0] === true || roles[1] === true || roles[2] === true || roles[3] === true) &&
        <>
          <h4>Register/unregister dealers and consumers</h4>
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Control as="select" onChange={onRoleChange}>
              <option value="Consumer">Consumer</option>
              <option value="REC">Renewable Energy Certificate Dealer</option>
              <option value="CEO">Carbon Emissions Offset Dealer</option>
              <option value="AE">Audited Emissions Dealer</option>
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
      }
    </>
  );
}
