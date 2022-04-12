// SPDX-License-Identifier: Apache-2.0
import { useState, useRef, ChangeEventHandler, FC } from "react";

import { getRoles, registerConsumer, unregisterConsumer, registerIndustry, registerDealer, unregisterDealer, unregisterIndustry } from "../services/contract-functions";
import { registerUserRole, unregisterUserRole } from "../services/api.service"

import SubmissionModal from "./submission-modal";
import WalletLookupInput from "./wallet-lookup-input";
import {Role, RoleEnum, RolesInfo, rolesInfoToArray, Wallet} from "./static-data";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import { Web3Provider } from "@ethersproject/providers";

function RolesCodesToLi({currentRoles, roles, unregister}: {currentRoles: RolesInfo, roles: string | Role[] | undefined, unregister?: (r:Role)=>void}) {
  if (!roles) return null;
  const arr: Role[] = Array.isArray(roles) ? roles : roles.split(',') as Role[]
  return <>{arr.sort().map((r)=><li key={r}>
    {r}
    {unregister
      && ((currentRoles.isAdmin) || ((currentRoles.hasDealerRole || currentRoles.hasIndustryRole) && (r === 'Consumer')))
      && <Button variant="outline-danger" className="ml-2 my-1" size="sm" onClick={() => {unregister(r)}}>
      Unregister
    </Button>}
</li>)}</>
}

function RolesListElements({ roles }: {roles: Role[]}) {
  return <>{roles.map((role, id) =>  
    <div key={id}>{role && <li>{role}&nbsp;&nbsp;</li>}</div>
  )}</>
}

function RolesList({ roles }: {roles: RolesInfo}) {
  const r = rolesInfoToArray(roles);
  if (!r) {
    return <p>No roles found.</p>
  }

  return (
    <ul>
      <RolesListElements roles={r}/>
    </ul>
  );
}

type AccessControlFormProps = {
  provider?: Web3Provider
  signedInAddress: string
  roles: RolesInfo
  limitedMode: boolean 
}

const AccessControlForm: FC<AccessControlFormProps> = ({ provider, signedInAddress, roles, limitedMode }) => {

  const [modalShow, setModalShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [publicKeyName, setPublicKeyName] = useState("");
  const [role, setRole] = useState<Role>("Consumer");
  const [result, setResult] = useState("");
  const [error_role, setRoleError] = useState("");
  const [registerFormValidated, setRegisterFormValidated] = useState(false);

  // Fetching roles of outside address
  const [lookupWallet, setLookupWallet] = useState<Wallet|null>(null);
  const [theirAddress, setTheirAddress] = useState("");
  const [theirRoles, setTheirRoles] = useState<RolesInfo>({});

  const [fetchingTheirRoles, setFetchingTheirRoles] = useState(false);

  async function fetchTheirRoles() {
    if (!provider) return;
    setTheirRoles({});
    setFetchingTheirRoles(true);
    let result = await getRoles(provider, theirAddress);
    setTheirRoles(result);
    setFetchingTheirRoles(false);
  }

  const onAddressChange: ChangeEventHandler<HTMLInputElement> = (event) => { setAddress(event.target.value); };
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) => { setName(event.target.value); };
  const onOrganizationChange: ChangeEventHandler<HTMLInputElement> = (event) => { setOrganization(event.target.value); };
  const onPublicKeyChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPublicKey(event.target.value); };
  const onPublicKeyNameChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPublicKeyName(event.target.value); };
  const onRoleChange: ChangeEventHandler<HTMLInputElement> = (event) => { setRole(event.target.value as Role); };

  async function handleRegister() {
    if (!provider) return;
    // validate
    if (formRef.current && formRef.current.checkValidity() === false) {
      setRegisterFormValidated(true);
      return;
    }

    setRegisterFormValidated(false);
    // save wallet info
    const currentRoles = rolesInfoToArray(await getRoles(provider, address));
    if (currentRoles.indexOf(role) > -1) {
      console.error('Wallet ' + address + ' already has role ' + role);
      setRoleError('That address already has this role.');
      return;
    } else {
      setRoleError('');
      console.log('Current roles not include role', currentRoles, role);

      let result = null;
      switch (role) {
        case RoleEnum.Consumer:
          result = await fetchRegisterConsumer();
          break;
        case RoleEnum.RecDealer:
          result = await fetchRegisterDealer(1);
          break;
        case RoleEnum.OffsetDealer:
          result = await fetchRegisterDealer(2);
          break;
        case RoleEnum.EmissionsAuditor:
          result = await fetchRegisterDealer(3);
          break;
        case RoleEnum.Industry:
          result = await fetchRegisterIndustry();
          break;
        case RoleEnum.IndustryDealer:
          result = await fetchRegisterDealer(4);
          break;
        default:
          console.error("Can't find role", role);
          return;
      }
      if (!result || result.toString().indexOf('Success') === -1) {
        console.error('Transaction did not succeed');
        return;
      } else {
        console.log('Transaction successful', result.toString());
      }
      currentRoles.push(role);
      const newRoles = currentRoles.join(',');
      await registerUserRole(address, name, organization, publicKey, publicKeyName, newRoles);
      setModalShow(true);
      if (lookupWallet && lookupWallet.address === address) {
        // remove from the array as well
        setLookupWallet({
          ...lookupWallet,
          roles: newRoles
        })
      }
    }
  }


  async function handleSingleUnregister(wallet: Wallet, role: Role) {
    let result = null;

    switch (role) {
      case "Consumer":
        result = await fetchUnregisterConsumer();
        break;
      case RoleEnum.RecDealer:
        result = await fetchUnregisterDealer(1);
        break;
      case RoleEnum.OffsetDealer:
        result = await fetchUnregisterDealer(2);
        break;
      case RoleEnum.EmissionsAuditor:
        result = await fetchUnregisterDealer(3);
        break;
      case RoleEnum.Industry:
        result = await fetchUnregisterIndustry();
        break;
      case RoleEnum.IndustryDealer:
        result = await fetchUnregisterDealer(4);
        break;
      default:
      console.error("Can't find role", role);
    }
    if (!result || result.toString().indexOf('Success') === -1) {
      console.error('Transaction did not succeed');
      return;
    } else {
      console.log('Transaction successful', result.toString());
    }
    const newRoles = wallet.roles!.split(',').filter((r)=>r!==role).join(',');
    await unregisterUserRole(address, newRoles);
    setModalShow(true);
    if (lookupWallet && lookupWallet.address === address) {
      // remove from the array as well
      setLookupWallet({
        ...lookupWallet,
        roles: newRoles
      })
    }
  }

  async function handleUnregister() {
    if (!provider) return;
    // validate
    if (formRef.current && formRef.current.checkValidity() === false) {
      setRegisterFormValidated(true);
      return;
    }

    setRegisterFormValidated(false);
    // save wallet info
    const currentRoles = rolesInfoToArray(await getRoles(provider, address));
    if (currentRoles.indexOf(role) === -1) {
      console.error('Wallet ' + address + ' does not have role ' + role, currentRoles);
      setRoleError('That address does not have this role.');
      return;
    } else {
      setRoleError('');
      console.log('Current roles includes role', currentRoles, role);
      let result = null;

      switch (role) {
        case RoleEnum.Consumer:
          result = await fetchUnregisterConsumer();
          break;
        case RoleEnum.RecDealer:
          result = await fetchUnregisterDealer(1);
          break;
        case RoleEnum.OffsetDealer:
          result = await fetchUnregisterDealer(2);
          break;
        case RoleEnum.EmissionsAuditor:
          result = await fetchUnregisterDealer(3);
          break;
        case RoleEnum.Industry:
          result = await fetchUnregisterIndustry();
          break;
        case RoleEnum.IndustryDealer:
          result = await fetchUnregisterDealer(4);
          break;
        default:
        console.error("Can't find role", role);
      }
      if (!result || result.toString().indexOf('Success') === -1) {
        console.error('Transaction did not succeed');
        return;
      } else {
        console.log('Transaction successful', result.toString());
      }
      
      const newRoles = currentRoles.filter((r)=>r!==role).join(',');
      await unregisterUserRole(address, newRoles);
      setModalShow(true);
      if (lookupWallet && lookupWallet.address === address) {
        // remove from the array as well
        setLookupWallet({
          ...lookupWallet,
          roles: newRoles
        })
      }
    }
  }

  async function fetchRegisterConsumer() {
    if (!provider) return;
    let result = await registerConsumer(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterConsumer() {
    if (!provider) return;
    let result = await unregisterConsumer(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterIndustry() {
    if (!provider) return;
    let result = await registerIndustry(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterIndustry() {
    if (!provider) return;
    let result = await unregisterIndustry(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterIndustrySelf() {
    if (!provider) return;
    let result = await registerIndustry(provider, signedInAddress);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterDealer(tokenTypeId: number) {
    if (!provider) return;
    let result = await registerDealer(provider, address, tokenTypeId);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterDealer(tokenTypeId: number) {
    if (!provider) return;
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
          {roles
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
        <WalletLookupInput 
          onChange={(v: string) => { setTheirAddress(v) }} 
          onWalletChange={(w)=>{
            setLookupWallet(w);
            setAddress(w ? w.address! : '');
          }} />
        <InputGroup.Append>
          <Button variant="outline-secondary" onClick={fetchTheirRoles}>Look-up</Button>
        </InputGroup.Append>
      </InputGroup>
      {lookupWallet && lookupWallet.address && <ul>
        <li>Name: {lookupWallet.name}</li>
        <li>Address: {lookupWallet.address}</li>
        <li>Organization: {lookupWallet.organization}</li>
        <li>Roles: <ul>
          <RolesCodesToLi currentRoles={roles} roles={lookupWallet.roles} unregister={(r) => {
            handleSingleUnregister(lookupWallet, r)
          }}/>
        </ul></li>
        
      </ul>}
      {fetchingTheirRoles &&
        <div className="text-center mt-3 mb-3">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      }
      {theirRoles &&
        <RolesList roles={theirRoles}/>
      }

      {/* Only display registration/unregistration tokens if owner or dealer */}
      {roles?.isAdmin &&
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
                <option value={RoleEnum.Consumer}>Consumer</option>
                <option value={RoleEnum.RecDealer}>Renewable Energy Certificate (REC) Dealer</option>
                <option value={RoleEnum.OffsetDealer}>Offset Dealer</option>
                <option value={RoleEnum.EmissionsAuditor}>Emissions Auditor</option>
                <option value={RoleEnum.IndustryDealer}>Registered Industry Dealer (CarbonTracker)</option>
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

    {( (!limitedMode) && (!roles.isAdmin && (roles.hasIndustryRole || roles.hasDealerRole))) &&
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
                <option value={RoleEnum.Consumer}>Consumer</option>
                <option value={RoleEnum.Industry}>Industry Member</option>
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

    {(!roles.isAdmin && roles.isIndustry) &&
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

export default AccessControlForm;
