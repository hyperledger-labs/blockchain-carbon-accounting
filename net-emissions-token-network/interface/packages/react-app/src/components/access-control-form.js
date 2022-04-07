// SPDX-License-Identifier: Apache-2.0
import React, { useState, useRef } from "react";

import { getRoles, registerConsumer, unregisterConsumer, registerIndustry, registerDealer, unregisterDealer } from "../services/contract-functions";
import { registerUserRole, unregisterUserRole } from "../services/api.service"

import SubmissionModal from "./submission-modal";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

const roleNames = ["Owner", "REC Dealer", "Offset Dealer", "Emissions Auditor", "Registered Industry Dealer", "Consumer"];
const roleCodes = ["Owner", "REC", "CEO", "AE", "REGISTERED_INDUSTRY_DEALER", "Consumer"];

// function RolesBoolsToNames(roles) {
//   if (!roles || roles.length !== 6) return null;
//   return roles.map((v,i) => v?roleNames[i]:null).filter((v)=>v!=null);
// }

function RolesBoolsToCodes(roles) {
  if (!roles || roles.length !== 6) return null;
  return roles.map((v,i) => v?roleCodes[i]:null).filter((v)=>v!=null);
}

function RolesListElements({ roles }) {
  return roles.map((role, id) => 
    <div key={id}>{role && <li>{roleNames[id]}&nbsp;&nbsp;</li>}</div>
  );
}

function RolesList({ roles }) {
  if (roles.every(r => r === false)) {
    return <p>No roles found.</p>
  }

  return (
    <ul>
      <RolesListElements roles={roles}/>
    </ul>
  );
}

export default function AccessControlForm({ provider, signedInAddress, roles, limitedMode }) {

  const [modalShow, setModalShow] = useState(false);
  const formRef = useRef(null);

  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [publicKeyName, setPublicKeyName] = useState("");
  const [role, setRole] = useState("Consumer");
  const [result, setResult] = useState("");
  const [error_role, setRoleError] = useState("");
  const [registerFormValidated, setRegisterFormValidated] = useState(false);

  // Fetching roles of outside address
  const [theirAddress, setTheirAddress] = useState();
  const [theirRoles, setTheirRoles] = useState([]);

  const [fetchingTheirRoles, setFetchingTheirRoles] = useState(false);

  async function fetchTheirRoles() {
    setTheirRoles("");
    setFetchingTheirRoles(true);
    let result = await getRoles(provider, theirAddress);
    setTheirRoles(result);
    setFetchingTheirRoles(false);
  }

  function onAddressChange(event) { setAddress(event.target.value); };
  function onNameChange(event) { setName(event.target.value); };
  function onOrganizationChange(event) { setOrganization(event.target.value); };
  function onPublicKeyChange(event) { setPublicKey(event.target.value); };
  function onPublicKeyNameChange(event) { setPublicKeyName(event.target.value); };
  function onTheirAddressChange(event) { setTheirAddress(event.target.value); };
  function onRoleChange(event) { setRole(event.target.value); };

  async function handleRegister() {
    // validate
    if (formRef && formRef.current.checkValidity() === false) {
      setRegisterFormValidated(true);
      return;
    }

    setRegisterFormValidated(false);
    // save wallet info
    const currentRoles = RolesBoolsToCodes(await getRoles(provider, address));
    if (currentRoles.indexOf(role) > -1) {
      console.error('Wallet ' + address + ' already has role ' + role);
      setRoleError('That address already has this role.');
      return;
    } else {
      setRoleError('');
      console.log('Current roles not include role', currentRoles, role);

      let result = null;
      switch (role) {
        case "Consumer":
          result = await fetchRegisterConsumer();
          break;
        case "REC":
          result = await fetchRegisterDealer(1);
          break;
        case "CEO":
          result = await fetchRegisterDealer(2);
          break;
        case "AE":
          result = await fetchRegisterDealer(3);
          break;
        case "REGISTERED_INDUSTRY":
          result = await fetchRegisterIndustry();
          break;
        case "REGISTERED_INDUSTRY_DEALER":
          result = await fetchRegisterDealer(4);
          break;
        default:
          console.error("Can't find role");
          return;
      }
      if (!result || result.toString().indexOf('Success') === -1) {
        console.error('Transaction did not succeed');
        return;
      } else {
        console.log('Transaction successful', result.toString());
      }
      currentRoles.push(role);
      await registerUserRole(address, name, organization, publicKey, publicKeyName, currentRoles.join(','));
      setModalShow(true);
    }
  }

  async function handleUnregister() {
    // validate
    if (formRef && formRef.current.checkValidity() === false) {
      setRegisterFormValidated(true);
      return;
    }

    setRegisterFormValidated(false);
    // save wallet info
    const currentRoles = RolesBoolsToCodes(await getRoles(provider, address));
    if (currentRoles.indexOf(role) === -1) {
      console.error('Wallet ' + address + ' does not have role ' + role, currentRoles);
      setRoleError('That address does not have this role.');
      return;
    } else {
      setRoleError('');
      console.log('Current roles includes role', currentRoles, role);
      let result = null;

      switch (role) {
        case "Consumer":
          result = await fetchUnregisterConsumer();
          break;
        case "REC":
          result = await fetchUnregisterDealer(1);
          break;
        case "CEO":
          result = await fetchUnregisterDealer(2);
          break;
        case "AE":
          result = await fetchUnregisterDealer(3);
          break;
        case "REGISTERED_INDUSTRY":
          result = await fetchUnregisterDealer(4);
          break;
        case "REGISTERED_INDUSTRY_DEALER":
          result = await fetchUnregisterDealer(4);
          break;
        default:
        console.error("Can't find role");
      }
      if (!result || result.toString().indexOf('Success') === -1) {
        console.error('Transaction did not succeed');
        return;
      } else {
        console.log('Transaction successful', result.toString());
      }
      
      await unregisterUserRole(address, currentRoles.filter((r)=>r!=role).join(','));
      setModalShow(true);
    }
  }

  async function fetchRegisterConsumer() {
    let result = await registerConsumer(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterConsumer() {
    let result = await unregisterConsumer(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterIndustry() {
    let result = await registerIndustry(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterIndustrySelf() {
    let result = await registerIndustry(provider, signedInAddress);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterDealer(tokenTypeId) {
    let result = await registerDealer(provider, address, tokenTypeId);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterDealer(tokenTypeId) {
    let result = await unregisterDealer(provider, address, tokenTypeId);
    setResult(result.toString());
    return result;
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

      {signedInAddress &&
        <>
          <h4>My Roles</h4>
          {roles.length === 6
           ? <RolesList roles={roles}/>
           : <div className="text-center mt-3 mb-3">
               <Spinner animation="border" role="status">
                 <span className="sr-only">Loading...</span>
               </Spinner>
             </div>
          }
        </>
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
      {fetchingTheirRoles &&
        <div className="text-center mt-3 mb-3">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      }
      {theirRoles.length === 6 &&
        <RolesList roles={theirRoles}/>
      }

      {/* Only display registration/unregistration tokens if owner or dealer */}
      {( (roles[0] === true)) &&
        <>
          <h4>Register/unregister dealers and consumers</h4>
          <Form ref={formRef} noValidate validated={registerFormValidated}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control type="input" placeholder="User name" value={name} onChange={onNameChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Organization</Form.Label>
              <Form.Control type="input" placeholder="User organization" value={organization} onChange={onOrganizationChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Address</Form.Label>
              <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Public Key Name</Form.Label>
              <Form.Control type="input" placeholder="User public key name" value={publicKeyName} onChange={onPublicKeyNameChange} />
            <Form.Group>
            </Form.Group>
              <Form.Label>Public Key</Form.Label>
              <Form.Control as="textarea" placeholder="User public key" value={publicKey} onChange={onPublicKeyChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Control as="select" onChange={onRoleChange} isInvalid={!!error_role}>
                <option value="Consumer">Consumer</option>
                <option value="REC">Renewable Energy Certificate (REC) Dealer</option>
                <option value="CEO">Offset Dealer</option>
                <option value="AE">Emissions Auditor</option>
                <option value="REGISTERED_INDUSTRY_DEALER">Registered Industry Dealer (CarbonTracker)</option>
              </Form.Control>
              <Form.Control.Feedback type="invalid">
                {error_role}
              </Form.Control.Feedback>
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
          </Form>
        </>
      }

    {( (!limitedMode) && (roles[0] === false && (roles[1] === true || roles[2] === true || roles[3] === true || roles[4] === true))) &&
     <>
          <h4>Register/unregister consumer or industry member</h4>
          <Form ref={formRef} noValidate validated={registerFormValidated}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control type="input" placeholder="User name" value={name} onChange={onNameChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Organization</Form.Label>
              <Form.Control type="input" placeholder="User organization" value={organization} onChange={onOrganizationChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Address</Form.Label>
              <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} required />
              <Form.Control.Feedback type="invalid">
                Please enter a valid wallet address.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Form.Label>Public Key Name</Form.Label>
              <Form.Control type="input" placeholder="User public key name" value={publicKeyName} onChange={onPublicKeyNameChange} />
            <Form.Group>
            </Form.Group>
              <Form.Label>Public Key</Form.Label>
              <Form.Control as="textarea" placeholder="User public key" value={publicKey} onChange={onPublicKeyChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Control as="select" onChange={onRoleChange} isInvalid={!!error_role}>
                <option value="Consumer">Consumer</option>
                <option value="REGISTERED_INDUSTRY">Industry Member</option>
              </Form.Control>
              <Form.Control.Feedback type="invalid">
                {error_role}
              </Form.Control.Feedback>
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
          </Form>
        </>
    }

    {(roles[0] === false && roles[4] === false) &&
     <>
          <h4>Register my account as industry</h4>
          <Form.Group>
            {/*<Form.Label>Address</Form.Label>*/}
            <Form.Control type="input" disabled hidden value={signedInAddress}/>
          </Form.Group>
          <Form.Group>
            {/*<Form.Label>Role</Form.Label>*/}
            <Form.Control as="select" disabled hidden>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Row>
              <Col>
                <Button variant="success" size="lg" block onClick={fetchRegisterIndustrySelf}>
                  Register
                </Button>
              </Col>
            </Row>
          </Form.Group>
        </>
    }


    </>
  );
}
