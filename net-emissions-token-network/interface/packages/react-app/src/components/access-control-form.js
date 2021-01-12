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

import { FaCheck } from 'react-icons/fa'

function RolesListElements({ roles }) {
  const roleNames = ["Owner", "REC Dealer", "Offset Dealer", "Emissions Auditor", "Consumer"];
  return roles.map((role, id) => 
    <>{role && <li className="list-group-item" key="role">{roleNames[id]}&nbsp;&nbsp;<span className="text-success"><FaCheck/></span></li>}</>
  );
}

function RolesList({ roles }) {
  return (
    <ul className="list-group pt-1 pb-3">
      <RolesListElements roles={roles}/>
    </ul>
  );
}

export default function AccessControlForm({ provider, signedInAddress, roles }) {

  const [modalShow, setModalShow] = useState(false);

  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Consumer");
  const [result, setResult] = useState("");

  // Fetching roles of outside address
  const [theirAddress, setTheirAddress] = useState();
  const [theirRoles, setTheirRoles] = useState([]);

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

      <Row>
        <Col>
          <h4>My Roles</h4>
          {roles.length === 5 ? 
            <RolesList roles={roles}/>
            : 
            <div className="text-center mt-3 mb-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          }
        </Col>
        <Col>
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
            <RolesList roles={theirRoles}/>
          }
        </Col>
      </Row>

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
              <option value="REC">Renewable Energy Certificate (REC) Dealer</option>
              <option value="CEO">Offset Dealer</option>
              <option value="AE">Emissions Auditor</option>
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
