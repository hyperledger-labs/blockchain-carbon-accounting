import { FC, ChangeEventHandler, useState, useRef, useCallback } from "react";
import { Button, Form } from "react-bootstrap";
import { Role, RoleEnum, RolesInfo, rolesInfoToArray, Wallet } from "./static-data";
import { TRPCClientError } from "@trpc/client";
import { getRoles } from "../services/contract-functions";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { trpcClient } from "../services/trpc";

type Props = {
  provider?: Web3Provider | JsonRpcProvider
  roles: RolesInfo
  address: string
  registerRoleInContract: (provider: Web3Provider | JsonRpcProvider, address: string, role: Role) => Promise<string | null>
  setWallet: (wallet: Wallet | null) => void
  setError: (error: string) => void
  onSuccess?: () => void
};

const AddWalletForm: FC<Props> = ({
  provider,
  roles,
  address,
  registerRoleInContract,
  setWallet,
  setError,
  onSuccess
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [publicKeyName, setPublicKeyName] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [role, setRole] = useState<Role>("None");

  const [roleError, setRoleError] = useState("");
  const [registerFormValidated, setRegisterFormValidated] = useState(false);
  const [zodErrors, setZodErrors] = useState<any>(null);

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (e) => { setName(e.target.value) }
  const onOrganizationChange: ChangeEventHandler<HTMLInputElement> = (e) => { setOrganization(e.target.value) }
  const onPublicKeyChange: ChangeEventHandler<HTMLInputElement> = (e) => { setPublicKey(e.target.value) }
  const onPublicKeyNameChange: ChangeEventHandler<HTMLInputElement> = (e) => { setPublicKeyName(e.target.value) }
  const onRoleChange: ChangeEventHandler<HTMLSelectElement> = (e) => { setRole(e.target.value as Role) }


  const clearFormFields = useCallback(() => {
    setName("");
    setOrganization("");
    setPublicKey("");
    setPublicKeyName("");
    setZodErrors(null);
  }, []);

  const clearAllFormMessages = useCallback(() => {
    setRoleError("");
  }, []);

  async function handleRegister() {
    if (!provider) return;
    clearAllFormMessages();
    // validate
    if (formRef.current && formRef.current.checkValidity() === false) {
      setRegisterFormValidated(true);
      return;
    }

    setRegisterFormValidated(false);
    // save wallet info
    const currentRoles = rolesInfoToArray(await getRoles(provider, address));
    if (currentRoles.indexOf(role) > -1) {
      console.error("Wallet " + address + " already has role " + role);
      setRoleError("That address already has this role.");
      return;
    } else {
      console.log("Current roles not include role", currentRoles, role);

      const error = await registerRoleInContract(provider, address, role);
      if (error) {
        setRoleError(error);
        return;
      }

      if (role !== RoleEnum.None) currentRoles.push(role);
      try {
        const register = await trpcClient.mutation("wallet.register", {
          address,
          name,
          organization,
          public_key: publicKey,
          public_key_name: publicKeyName,
          roles: currentRoles,
        });
        setWallet(register?.wallet || null);
        // reset the form values
        clearFormFields();
      } catch (error) {
        console.error("trpc error;", error);
        let errorSet = false;
        if (error instanceof TRPCClientError && error?.data?.zodError) {
          const zodError = error.data.zodError;
          setZodErrors(zodError);
          // handle address errors into lookupError
          if (zodError.fieldErrors?.address?.length > 0) {
            const addressError = zodError.fieldErrors?.address?.join("\n");
            setError(addressError);
            errorSet = true;
          }
        }
        if (!errorSet) setError("An error occurred while registering the wallet.");
      }
      if (role !== RoleEnum.None && onSuccess) onSuccess();
    }
  }


  return <Form ref={formRef} noValidate validated={registerFormValidated}>
    <Form.Group className="mb-3" controlId="nameInput">
      <Form.Control
        type="input"
        placeholder="User name"
        value={name}
        onChange={onNameChange}
        isInvalid={zodErrors?.fieldErrors?.name?.length > 0}
        />
      <Form.Control.Feedback type="invalid">
        {zodErrors?.fieldErrors?.name?.length > 0 &&
          zodErrors?.fieldErrors?.name.map((e: string, i: number) => (
            <span key={i}>{e}</span>
          ))}
      </Form.Control.Feedback>
    </Form.Group>
    <Form.Group className="mb-3" controlId="organizationInput">
      <Form.Control
        type="input"
        placeholder="User organization"
        value={organization}
        onChange={onOrganizationChange}
        isInvalid={zodErrors?.fieldErrors?.organization?.length > 0}
        />
      <Form.Control.Feedback type="invalid">
        {zodErrors?.fieldErrors?.organization?.length > 0 &&
          zodErrors?.fieldErrors?.organization.map(
            (e: string, i: number) => <span key={i}>{e}</span>
          )}
      </Form.Control.Feedback>
    </Form.Group>
    <Form.Group className="mb-3" controlId="publicKeyNameInput">
      <Form.Control
        type="input"
        placeholder="User public key name"
        value={publicKeyName}
        onChange={onPublicKeyNameChange}
        isInvalid={zodErrors?.fieldErrors?.public_key_name?.length > 0}
        />
      <Form.Control.Feedback type="invalid">
        {zodErrors?.fieldErrors?.public_key_name?.length > 0 &&
          zodErrors?.fieldErrors?.public_key_name.map(
            (e: string, i: number) => <span key={i}>{e}</span>
          )}
      </Form.Control.Feedback>
    </Form.Group>
    <Form.Group className="mb-3" controlId="publicKeyInput">
      <Form.Control
        as="textarea"
        placeholder="User public key"
        value={publicKey}
        onChange={onPublicKeyChange}
        isInvalid={zodErrors?.fieldErrors?.public_key?.length > 0}
        />
      <Form.Control.Feedback type="invalid">
        {zodErrors?.fieldErrors?.public_key?.length > 0 &&
          zodErrors?.fieldErrors?.public_key.map(
            (e: string, i: number) => <span key={i}>{e}</span>
          )}
      </Form.Control.Feedback>
    </Form.Group>
    <Form.Group className="mb-3" controlId="RoleInput">
      {roles?.isAdmin ? (
        <Form.Select
          value={role}
          onChange={onRoleChange}
          isInvalid={!!roleError}
        >
          <option value={RoleEnum.None}>Choose a Role:</option>
          <option value="">-----</option>
          <option value={RoleEnum.Consumer}>Consumer</option>
          <option value={RoleEnum.RecDealer}>
            Renewable Energy Certificate (REC) Dealer
          </option>
          <option value={RoleEnum.OffsetDealer}>Offset Dealer</option>
          <option value={RoleEnum.EmissionsAuditor}>
            Emissions Auditor
          </option>
        </Form.Select>
      ) : (
          <Form.Select
            value={role}
            onChange={onRoleChange}
            isInvalid={!!roleError}
          >
            <option value={RoleEnum.None}>None</option>
            <option value={RoleEnum.Consumer}>Consumer</option>
            <option value={RoleEnum.Industry}>Industry Member</option>
          </Form.Select>
        )}
      <Form.Control.Feedback type="invalid">
        {roleError}
      </Form.Control.Feedback>
    </Form.Group>
    <Form.Group className="d-grid gap-2 mt-3">
      <Button variant="success" size="lg" onClick={handleRegister}>
        Register
      </Button>
    </Form.Group>
  </Form>

}

export default AddWalletForm;
