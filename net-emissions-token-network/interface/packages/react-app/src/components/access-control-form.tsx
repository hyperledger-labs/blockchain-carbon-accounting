// SPDX-License-Identifier: Apache-2.0
import { useState, useRef, ChangeEventHandler, FC, useCallback } from "react";

import { getRoles, registerConsumer, unregisterConsumer, registerIndustry, registerDealer, unregisterDealer, unregisterIndustry } from "../services/contract-functions";
import { lookupWallets, registerUserRole, postSignedMessage, unregisterUserRole } from "../services/api.service"

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
import { Alert } from "react-bootstrap";

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
  const [error_lookup, setLookupError] = useState("");
  const [registerFormValidated, setRegisterFormValidated] = useState(false);

  // Fetching roles of outside address
  const [lookupWallet, setLookupWallet] = useState<Wallet|null>(null);
  const [theirRoles, setTheirRoles] = useState<RolesInfo>({});

  const [fetchingTheirRoles, setFetchingTheirRoles] = useState(false);

  // called on the Lookup button click
  const lookupWalletRoles = useCallback(async () => {
    if ((lookupWallet && lookupWallet.address) || provider) {
      if (theirRoles.hasAnyRole) setTheirRoles({});
      setFetchingTheirRoles(true);
      setLookupError('');
      if (lookupWallet && lookupWallet.address) {
        const wallets = await lookupWallets(lookupWallet.address);
        if (wallets && wallets.length === 1) {
          setLookupWallet(wallets[0]);
          setAddress(wallets[0].address || '');
        } else {
          setLookupError(`Account ${lookupWallet.address} not found.`);
        }
      } else {
        if (provider) {
          let result = await getRoles(provider, address);
          if (!result.hasAnyRole) setLookupError(`Account ${address} not found.`);
          setAddress(address);
          setTheirRoles(result);
        }
      }
      setFetchingTheirRoles(false);
    }
  }, [lookupWallet, provider, address, theirRoles])


  // when the looked up wallet is set by the lookup
  const onWalletChange = useCallback((w:Wallet|null)=>{
    console.log('onWalletChange:',w)
    setLookupError('');
    setTheirRoles({});
    setLookupWallet(w);
    setAddress(w ? w.address! : '');
  }, [])
  const onLookupInputChange = useCallback((v: string) => {
    console.log('onLookupInputChange:',v)
    setAddress(v);
  }, [])

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) => { setName(event.target.value); };
  const onOrganizationChange: ChangeEventHandler<HTMLInputElement> = (event) => { setOrganization(event.target.value); };
  const onPublicKeyChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPublicKey(event.target.value); };
  const onPublicKeyNameChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPublicKeyName(event.target.value); };
  const onRoleChange: ChangeEventHandler<HTMLInputElement> = (event) => { setRole(event.target.value as Role); };

  async function handlePostSignedMessage() {
    if (!provider) return;
    const payload = {
      address,
      name,
      organization,
      public_key: publicKey,
      public_key_name: publicKeyName
    }
    const message = JSON.stringify(payload)
    const signature = await provider.getSigner().signMessage(message)
    await postSignedMessage(message, signature);
  }

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
      const newWallet = await registerUserRole(address, name, organization, publicKey, publicKeyName, newRoles);
      setModalShow(true);
      setLookupWallet({
        ...newWallet
      })
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

  const hasAssignRolePermissions = (roles.isAdmin || (!limitedMode && (!roles.isAdmin && (roles.hasIndustryRole || roles.hasDealerRole))))

  const rolesThatCanBeAssigned = []

  if (hasAssignRolePermissions) {
    // only show roles not already assigned
    const roleArr = (lookupWallet && lookupWallet.roles) ? lookupWallet.roles.split(',') : []
    if (!roleArr.includes(RoleEnum.Consumer)) rolesThatCanBeAssigned.push({value: RoleEnum.Consumer, label: 'Consumer'})
    if (!roleArr.includes(RoleEnum.Industry)) rolesThatCanBeAssigned.push({value: RoleEnum.Industry, label: 'Industry Member'})
    if (roles.isAdmin) {
      if (!roleArr.includes(RoleEnum.RecDealer)) rolesThatCanBeAssigned.push({value: RoleEnum.RecDealer, label: 'Renewable Energy Certificate (REC) Dealer'})
      if (!roleArr.includes(RoleEnum.OffsetDealer)) rolesThatCanBeAssigned.push({value: RoleEnum.OffsetDealer, label: 'Offset Dealer'})
      if (!roleArr.includes(RoleEnum.EmissionsAuditor)) rolesThatCanBeAssigned.push({value: RoleEnum.EmissionsAuditor, label: 'Emissions Auditor'})
      if (!roleArr.includes(RoleEnum.IndustryDealer)) rolesThatCanBeAssigned.push({value: RoleEnum.IndustryDealer, label: 'Registered Industry Dealer (CarbonTracker)'})
    }
    if (!rolesThatCanBeAssigned.find((r)=>r.value===role)) {
      if (rolesThatCanBeAssigned.length > 0) {
        setRole(rolesThatCanBeAssigned[0].value)
      }
    }
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

      <h4>Look-up User Wallet or New Address</h4>
      <InputGroup className="mb-3">
        <WalletLookupInput 
          onChange={onLookupInputChange} 
          onWalletChange={onWalletChange} />
        <InputGroup.Append>
          <Button variant="outline-secondary" onClick={lookupWalletRoles}>Look-up</Button>
        </InputGroup.Append>
      </InputGroup>
      {error_lookup &&
      <Alert variant="danger" onClose={() => setLookupError('')} dismissible>
        {error_lookup}
      </Alert>}
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

      {/* For existing wallet, display roles to add if owner has permissions for the roles. */}
      {lookupWallet && hasAssignRolePermissions && <>
          <h4>Add Role</h4>
          <Form ref={formRef} noValidate validated={registerFormValidated}>
            <Form.Group>
              {rolesThatCanBeAssigned && rolesThatCanBeAssigned.length > 0 ? 
                <Form.Control as="select" onChange={onRoleChange} isInvalid={!!error_role}>
                  {rolesThatCanBeAssigned.map((r,i) =>
                    <option key={i} value={r.value}>{r.label}</option>
                  )}
                </Form.Control> 
                :
              <p>You cannot assign any more role to this user.</p>
              }
              <Form.Control.Feedback type="invalid">
                {error_role}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Button variant="success" size="lg" block onClick={handleRegister}>
                Add Role
              </Button>
            </Form.Group>
            {/* <Form.Group> */}
            {/*   <Button variant="success" size="lg" block onClick={handlePostSignedMessage}> */}
            {/*     Update User Info */}
            {/*   </Button> */}
            {/* </Form.Group> */}
          </Form>
        </>}
      {/* Only display registration if owner has permissions for the roles, also hide this when the wallet was found already. */}
      {!lookupWallet && hasAssignRolePermissions &&
        <>
          <h4>Register new user wallet</h4>
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
              <Form.Label>Public Key Name</Form.Label>
              <Form.Control type="input" placeholder="User public key name" value={publicKeyName} onChange={onPublicKeyNameChange} />
            <Form.Group>
            </Form.Group>
              <Form.Label>Public Key</Form.Label>
              <Form.Control as="textarea" placeholder="User public key" value={publicKey} onChange={onPublicKeyChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              {(roles?.isAdmin) ? 
                <Form.Control as="select" value={role} onChange={onRoleChange} isInvalid={!!error_role}>
                  <option value={RoleEnum.Consumer}>Consumer</option>
                  <option value={RoleEnum.RecDealer}>Renewable Energy Certificate (REC) Dealer</option>
                  <option value={RoleEnum.OffsetDealer}>Offset Dealer</option>
                  <option value={RoleEnum.EmissionsAuditor}>Emissions Auditor</option>
                  <option value={RoleEnum.IndustryDealer}>Registered Industry Dealer (CarbonTracker)</option>
                </Form.Control> 
                :
                <Form.Control as="select" value={role} onChange={onRoleChange} isInvalid={!!error_role}>
                  <option value={RoleEnum.Consumer}>Consumer</option>
                  <option value={RoleEnum.Industry}>Industry Member</option>
                </Form.Control>
              }
              <Form.Control.Feedback type="invalid">
                {error_role}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group>
              <Button variant="success" size="lg" block onClick={handleRegister}>
                Register
              </Button>
            </Form.Group>
            {/* <Form.Group> */}
            {/*   <Button variant="success" size="lg" block onClick={handlePostSignedMessage}> */}
            {/*     Update User Info */}
            {/*   </Button> */}
            {/* </Form.Group> */}
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
