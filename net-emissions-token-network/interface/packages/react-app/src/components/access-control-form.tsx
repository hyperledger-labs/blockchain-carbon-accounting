// SPDX-License-Identifier: Apache-2.0
import { useState, useRef, ChangeEventHandler, FC, useCallback, ReactNode, useContext } from "react";

import { getRoles, registerConsumer, unregisterConsumer, registerIndustry, registerDealer, unregisterDealer, unregisterIndustry } from "../services/contract-functions";
import {  postSignedMessage } from "../services/api.service"

import SubmissionModal from "./submission-modal";
import WalletLookupInput from "./wallet-lookup-input";
import {Role, RoleEnum, RolesInfo, rolesInfoToArray, Wallet} from "./static-data";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Web3Provider } from "@ethersproject/providers";
import { Accordion, AccordionContext, Alert, OverlayTrigger, Tooltip, useAccordionButton } from "react-bootstrap";
import { trpcClient } from "../services/trpc";
import { TRPCClientError } from "@trpc/client";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaRegClipboard } from "react-icons/fa";


function RolesCodesToLi({currentRoles, roles, unregister}: {currentRoles: RolesInfo, roles: string | Role[] | undefined, unregister?: (r:Role)=>void}) {
  if (!roles) return null;
  const arr: Role[] = Array.isArray(roles) ? roles : roles.split(',') as Role[]
  return <>{arr.sort().map((r)=><li key={r}>
    {r}
    {unregister
      && ((currentRoles.isAdmin) || ((currentRoles.hasDealerRole || currentRoles.hasIndustryRole) && (r === 'Consumer')))
      && <Button variant="outline-danger" className="ms-2 my-1" size="sm" onClick={() => {unregister(r)}}>
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

function CustomToggle({ children, eventKey }: {children:ReactNode, eventKey:string}) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);
  console.log('CustomToggle', eventKey, activeEventKey)
  const isCurrentEventKey = activeEventKey === eventKey;

  return (
    <div>
      <span className="me-3">{children}</span>
      {isCurrentEventKey ? 
        <Button onClick={decoratedOnClick} size="sm" variant="outline-secondary">Hide</Button> 
        : <Button onClick={decoratedOnClick} size="sm" variant="outline-primary">Show</Button>
      }
    </div>
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
  const [role, setRole] = useState<Role>("None");
  const [result, setResult] = useState("");
  const [roleError, setRoleError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [registerFormValidated, setRegisterFormValidated] = useState(false);

  // Fetching roles of outside address
  const [lookupWallet, setLookupWallet] = useState<Wallet|null>(null);
  const [theirRoles, setTheirRoles] = useState<RolesInfo>({});

  const [fetchingTheirRoles, setFetchingTheirRoles] = useState(false);
  const [zodErrors, setZodErrors] = useState<any>(null);

  // called on the Lookup button click
  const lookupWalletRoles = useCallback(async () => {
    if ((lookupWallet && lookupWallet.address) || provider) {
      if (theirRoles.hasAnyRole) setTheirRoles({});
      setFetchingTheirRoles(true);
      setLookupError('');
      setLookupMessage('');
      if (lookupWallet && lookupWallet.address) {
        try { 
          const lookup = await trpcClient.query('wallet.lookup', { query: lookupWallet.address});
          if (lookup?.wallets && lookup?.wallets.length === 1) {
            setLookupWallet(lookup?.wallets[0]);
            setAddress(lookup?.wallets[0].address || '');
          } else {
            setLookupWallet(null)
            setLookupMessage(`Account ${lookupWallet.address} not found.  Use the form below to add it.`);
          }
        } catch (error) {
          console.error('trpc error: ', error)
        }
      } else if (address) {
        if (provider) {
          let result = await getRoles(provider, address);
          if (lookupWallet) setLookupWallet(null)
          if (!result.hasAnyRole) setLookupMessage(`Account ${address} not found. Use the form below to add it.`);
          setAddress(address);
          setTheirRoles(result);
        }
      }
      setFetchingTheirRoles(false);
    }
  }, [lookupWallet, provider, address, theirRoles])

  const clearAllFormMessages = useCallback(()=>{
    setZodErrors(null)
    setLookupError('')
    setLookupMessage('')
    setRoleError('')
  }, [])


  const clearFormFields = useCallback(() => {
    setName('')
    setOrganization('')
    setPublicKey('')
    setPublicKeyName('')
    clearAllFormMessages()
  }, [clearAllFormMessages])

  // when the looked up wallet is set by the lookup
  const onWalletChange = useCallback((w:Wallet|null)=>{
    console.log('onWalletChange:',w)
    clearAllFormMessages()
    setTheirRoles({});
    setLookupWallet(w);
    setAddress(w ? w.address! : '');
  }, [clearAllFormMessages])
  const onLookupInputChange = useCallback((v: string) => {
    console.log('onLookupInputChange:',v)
    setAddress(v);
    if (!v) {
      setLookupWallet(null);
      clearAllFormMessages()
    }
  }, [clearAllFormMessages])

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) => { setName(event.target.value); };
  const onOrganizationChange: ChangeEventHandler<HTMLInputElement> = (event) => { setOrganization(event.target.value); };
  const onPublicKeyChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPublicKey(event.target.value); };
  const onPublicKeyNameChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPublicKeyName(event.target.value); };
  const onRoleChange: ChangeEventHandler<HTMLSelectElement> = (event) => { setRole(event.target.value as Role); };

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

  const registerRoleInContract = useCallback(async (provider: Web3Provider, address: string, role: Role) => {
    let result = null;
    switch (role) {
      case RoleEnum.None:
        return null;
      case RoleEnum.Consumer:
        result = await fetchRegisterConsumer(provider, address);
        break;
      case RoleEnum.RecDealer:
        result = await fetchRegisterDealer(provider, address, 1);
        break;
      case RoleEnum.OffsetDealer:
        result = await fetchRegisterDealer(provider, address, 2);
        break;
      case RoleEnum.EmissionsAuditor:
        result = await fetchRegisterDealer(provider, address, 3);
        break;
      case RoleEnum.Industry:
        result = await fetchRegisterIndustry(provider, address);
        break;
      case RoleEnum.IndustryDealer:
        result = await fetchRegisterDealer(provider, address, 4);
        break;
      default:
        const err = `Invalid role was given: ${role}`
        console.error(err);
        return err;
    }
    if (!result || result.toString().indexOf('Success') === -1) {
      console.error('Transaction did not succeed', result);
      return 'The transaction could not be sent to the blockchain: ' + result;
    } else {
      console.log('Transaction successful', result.toString());
      return null;
    }
  }, [])

  const unregisterRoleInContract = useCallback(async (provider: Web3Provider, address: string, role: Role) => {
    let result = null;

    switch (role) {
      case RoleEnum.Consumer:
        result = await fetchUnregisterConsumer(provider, address);
        break;
      case RoleEnum.RecDealer:
        result = await fetchUnregisterDealer(provider, address, 1);
        break;
      case RoleEnum.OffsetDealer:
        result = await fetchUnregisterDealer(provider, address, 2);
        break;
      case RoleEnum.EmissionsAuditor:
        result = await fetchUnregisterDealer(provider, address, 3);
        break;
      case RoleEnum.Industry:
        result = await fetchUnregisterIndustry(provider, address);
        break;
      case RoleEnum.IndustryDealer:
        result = await fetchUnregisterDealer(provider, address, 4);
        break;
      default:
        const err = `Invalid role was given: ${role}`
        console.error(err);
        return err;
    }
    if (!result || result.toString().indexOf('Success') === -1) {
      console.error('Transaction did not succeed');
      return 'The transaction could not be sent to the blockchain: ' + result;
    } else {
      console.log('Transaction successful', result.toString());
      return null;
    }
  }, [])

  async function handleRegister() {
    if (!provider) return;
    clearAllFormMessages()
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
      console.log('Current roles not include role', currentRoles, role);

      const error = await registerRoleInContract(provider, address, role)
      if (error) {
        setRoleError(error);
        return;
      }

      if (role !== RoleEnum.None) currentRoles.push(role);
      try {
        const register = await trpcClient.mutation('wallet.register', {address, name, organization, public_key: publicKey, public_key_name: publicKeyName, roles: currentRoles})
        setLookupWallet(register?.wallet || null)
        // reset the form values
        clearFormFields()
      } catch (error) {
        console.error('trpc error;', error)
        let errorSet = false
        if (error instanceof TRPCClientError && error?.data?.zodError) {
          const zodError = error.data.zodError
          setZodErrors(zodError);
          // handle address errors into lookupError
          if (zodError.fieldErrors?.address?.length > 0) {
            const addressError = zodError.fieldErrors?.address?.join("\n")
            setLookupError(addressError)
            errorSet = true
          }
        }
        if (!errorSet) setLookupError('An error occurred while registering the wallet.')
      }
      if (role !== RoleEnum.None) setModalShow(true);
    }
  }

  async function handleSingleRegister() {
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

      const error = await registerRoleInContract(provider, address, role)
      if (error) {
        setRoleError(error);
        return;
      }
      try {
        const register = await trpcClient.mutation('wallet.registerRoles', {address, roles: [role]})
        setLookupWallet(register?.wallet || null)
        setLookupError('')
      } catch (error) {
        console.error('trpc error;', error)
        setLookupError('An error occurred while registering the wallet role.')
      }
      setModalShow(true);
    }
  }

  async function handleSingleUnregister(wallet: Wallet, role: Role) {
    if (!provider) return;
    const error = await unregisterRoleInContract(provider, wallet.address!, role);
    if (error) {
      setLookupError(error);
      return;
    }
    try {
      const unregister = await trpcClient.mutation('wallet.unregisterRoles', {address: wallet.address!, roles: [role]})
      setLookupWallet(unregister?.wallet || null)
      setLookupError('')
    } catch (error) {
      console.error('trpc error;', error)
      setLookupError('An error occurred while unregistering the wallet role.')
    }
    setModalShow(true);
  }

  async function fetchRegisterConsumer(provider: Web3Provider, address: string) {
    let result = await registerConsumer(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterConsumer(provider: Web3Provider, address: string) {
    let result = await unregisterConsumer(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterIndustry(provider: Web3Provider, address: string) {
    let result = await registerIndustry(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterIndustry(provider: Web3Provider, address: string) {
    let result = await unregisterIndustry(provider, address);
    setResult(result.toString());
    return result;
  }

  async function fetchRegisterDealer(provider: Web3Provider, address: string, tokenTypeId: number) {
    let result = await registerDealer(provider, address, tokenTypeId);
    setResult(result.toString());
    return result;
  }

  async function fetchUnregisterDealer(provider: Web3Provider, address: string, tokenTypeId: number) {
    let result = await unregisterDealer(provider, address, tokenTypeId);
    setResult(result.toString());
    return result;
  }

  const hasAssignRolePermissions = (roles.isAdmin || (!limitedMode && (!roles.isAdmin && (roles.hasIndustryRole || roles.hasDealerRole))))

  const rolesThatCanBeAssigned = []

  if (hasAssignRolePermissions) {
    // only show roles not already assigned
    const roleArr = (lookupWallet && lookupWallet.roles) ? lookupWallet.roles.split(',') : []
    if (!lookupWallet) rolesThatCanBeAssigned.push({value: RoleEnum.None, label: 'None'})
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

      <h4>Find or Set Up a User</h4>
      <InputGroup className="mb-3">
        <WalletLookupInput 
          onChange={onLookupInputChange} 
          onWalletChange={onWalletChange} />
        <Button variant="outline-secondary" onClick={lookupWalletRoles}>Look-up</Button>
      </InputGroup>
      {lookupError &&
      <Alert variant="danger" onClose={() => setLookupError('')} dismissible>
        {lookupError}
      </Alert>}
      {lookupMessage && <p>{lookupMessage}</p>}
      {lookupWallet && lookupWallet.address && <ul>
        <li>Name: {lookupWallet.name}</li>
        <li>Address: {lookupWallet.address}</li>
        {lookupWallet.organization && <li>Organization: {lookupWallet.organization}</li>}
        {lookupWallet.public_key_name && <li>Public Key Name: {lookupWallet.public_key_name}</li>}
        {lookupWallet.public_key && <li>
          <Accordion>
            <CustomToggle eventKey="0">
              Public Key:
              {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
              <CopyToClipboard text={lookupWallet.public_key_name}>
                <span className="text-secondary">
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    rootClose={true}
                    delay={{ show: 250, hide: 400 }}
                    overlay={<Tooltip id='copied-pubkey-tooltip'>Copied to clipboard!</Tooltip>}
                  >
                    <sup style={{cursor: "pointer"}}>&nbsp;<FaRegClipboard/></sup>
                  </OverlayTrigger>
                </span>
              </CopyToClipboard>
            </CustomToggle>

            <Accordion.Collapse eventKey="0">
              <pre>{lookupWallet.public_key}</pre>
            </Accordion.Collapse>
          </Accordion>
        </li>
        }
        {lookupWallet.roles ? 
        <li>Roles: <ul>
          <RolesCodesToLi currentRoles={roles} roles={lookupWallet.roles} unregister={(r) => {
            handleSingleUnregister(lookupWallet, r)
          }}/>
        </ul></li>
        : <li>No roles found.</li>}
        
      </ul>}
      {fetchingTheirRoles &&
        <div className="text-center mt-3 mb-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
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
            <Form.Group className="mb-3" controlId="rolesInput">
              {rolesThatCanBeAssigned && rolesThatCanBeAssigned.length > 0 ? 
                <Form.Select onChange={onRoleChange} isInvalid={!!roleError}>
                  {rolesThatCanBeAssigned.map((r,i) =>
                    <option key={i} value={r.value}>{r.label}</option>
                  )}
                </Form.Select> 
                :
              <p>You cannot assign any more role to this user.</p>
              }
              <Form.Control.Feedback type="invalid">{roleError}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="d-grid gap-2 mt-3">
              <Button variant="success" size="lg" onClick={handleSingleRegister}>
                Add Role
              </Button>
            </Form.Group>
            {/* <Form.Group> */}
            {/*   <Button variant="success" size="lg" onClick={handlePostSignedMessage}> */}
            {/*     Update User Info */}
            {/*   </Button> */}
            {/* </Form.Group> */}
          </Form>
        </>}
      {/* Only display registration if owner has permissions for the roles, also hide this when the wallet was found already. */}
      {!lookupWallet && hasAssignRolePermissions &&
        <>
          <Form ref={formRef} noValidate validated={registerFormValidated}>
            <Form.Group className="mb-3" controlId="nameInput">
              <Form.Control type="input" placeholder="User name" value={name} onChange={onNameChange} isInvalid={zodErrors?.fieldErrors?.name?.length > 0}/>
              <Form.Control.Feedback type="invalid">{zodErrors?.fieldErrors?.name?.length > 0 && zodErrors?.fieldErrors?.name.map((e:string,i:number)=><span key={i}>{e}</span>)}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="organizationInput">
              <Form.Control type="input" placeholder="User organization" value={organization} onChange={onOrganizationChange} isInvalid={zodErrors?.fieldErrors?.organization?.length > 0}/>
              <Form.Control.Feedback type="invalid">{zodErrors?.fieldErrors?.organization?.length > 0 && zodErrors?.fieldErrors?.organization.map((e:string,i:number)=><span key={i}>{e}</span>)}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="publicKeyNameInput">
              <Form.Control type="input" placeholder="User public key name" value={publicKeyName} onChange={onPublicKeyNameChange} isInvalid={zodErrors?.fieldErrors?.public_key_name?.length > 0}/>
              <Form.Control.Feedback type="invalid">{zodErrors?.fieldErrors?.public_key_name?.length > 0 && zodErrors?.fieldErrors?.public_key_name.map((e:string,i:number)=><span key={i}>{e}</span>)}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="publicKeyInput">
              <Form.Control as="textarea" placeholder="User public key" value={publicKey} onChange={onPublicKeyChange} isInvalid={zodErrors?.fieldErrors?.public_key?.length > 0}/>
              <Form.Control.Feedback type="invalid">{zodErrors?.fieldErrors?.public_key?.length > 0 && zodErrors?.fieldErrors?.public_key.map((e:string,i:number)=><span key={i}>{e}</span>)}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="RoleInput">
              {(roles?.isAdmin) ? 
                <Form.Select value={role} onChange={onRoleChange} isInvalid={!!roleError}>
                  <option value={RoleEnum.None}>Choose a Role:</option>
                  <option value=''>-----</option>
                  <option value={RoleEnum.Consumer}>Consumer</option>
                  <option value={RoleEnum.RecDealer}>Renewable Energy Certificate (REC) Dealer</option>
                  <option value={RoleEnum.OffsetDealer}>Offset Dealer</option>
                  <option value={RoleEnum.EmissionsAuditor}>Emissions Auditor</option>
                  <option value={RoleEnum.IndustryDealer}>Registered Industry Dealer (CarbonTracker)</option>
                </Form.Select> 
                :
                <Form.Select value={role} onChange={onRoleChange} isInvalid={!!roleError}>
                  <option value={RoleEnum.None}>None</option>
                  <option value={RoleEnum.Consumer}>Consumer</option>
                  <option value={RoleEnum.Industry}>Industry Member</option>
                </Form.Select>
              }
              <Form.Control.Feedback type="invalid">{roleError}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="d-grid gap-2 mt-3">
              <Button variant="success" size="lg" onClick={handleRegister}>
                Register
              </Button>
            </Form.Group>
            {/* <Form.Group> */}
            {/*   <Button variant="success" size="lg" onClick={handlePostSignedMessage}> */}
            {/*     Update User Info */}
            {/*   </Button> */}
            {/* </Form.Group> */}
          </Form>
        </>
      }

    {(!roles.isAdmin && !roles.isIndustry) &&
     <>
          <h4 className="mt-4">Register my account as industry</h4>
          <Form.Group>
            {/*<Form.Label>Address</Form.Label>*/}
            <Form.Control type="input" disabled hidden value={signedInAddress}/>
          </Form.Group>
          <Form.Group>
            {/*<Form.Label>Role</Form.Label>*/}
            <Form.Select disabled hidden>
            </Form.Select>
          </Form.Group>
          <Form.Group className="d-grid gap-2 mt-3">
            <Button variant="success" size="lg" onClick={() => { if(provider) fetchRegisterIndustry(provider, signedInAddress)}}>
              Register
            </Button>
          </Form.Group>
        </>
    }

    </>
  );
}

export default AccessControlForm;

