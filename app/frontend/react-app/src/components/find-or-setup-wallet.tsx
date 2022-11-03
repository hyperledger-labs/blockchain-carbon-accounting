import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import {
  FC,
  ChangeEventHandler,
  useRef,
  useState,
  ElementRef,
  useCallback,
  useMemo,
} from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import WalletLookupInput from "./wallet-lookup-input";
import {
  Role,
  RoleEnum,
  RolesInfo,
  rolesInfoToArray,
  Wallet,
} from "./static-data";
import { trpcClient } from "../services/trpc";
import { getRoles, unregisterConsumer, unregisterDealer, unregisterIndustry } from "../services/contract-functions";
import SubmissionModal from "./submission-modal";
import {
  registerConsumer,
  registerIndustry,
  registerDealer,
} from "../services/contract-functions";
import RolesList from "./roles-list";
import AddWalletForm from "./add-wallet-form";
import DisplayWalletDetails from "./display-wallet-details";
import AsyncButton from "./AsyncButton";
import { useMutation } from "react-query";


type Props = {
  provider?: Web3Provider | JsonRpcProvider;
  signedInAddress: string;
  roles: RolesInfo;
  limitedMode: boolean;
};

const FindOrSetupWallet: FC<Props> = ({
  provider,
  signedInAddress,
  roles,
  limitedMode,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const lookupRef = useRef<ElementRef<typeof WalletLookupInput>>(null);

  const [modalShow, setModalShow] = useState(false);
  const [modalResult, setModalResult] = useState("");

  const [lookupWallet, setLookupWallet] = useState<Wallet | null>(null);
  const [role, setRole] = useState<Role>("None");
  const [address, setAddress] = useState("");

  const [roleError, setRoleError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [registerFormValidated, setRegisterFormValidated] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const [theirRoles, setTheirRoles] = useState<RolesInfo>({});

  const [fetchingTheirRoles, setFetchingTheirRoles] = useState(false);

  const clearAllFormMessages = useCallback(() => {
    setLookupError("");
    setLookupMessage("");
    setRoleError("");
  }, []);


  const hasAssignRolePermissions = useMemo(
    () =>
      roles.isAdmin ||
      (!limitedMode &&
        !roles.isAdmin &&
        (roles.hasIndustryRole || roles.hasDealerRole)),
    [limitedMode, roles]
  );
  const rolesThatCanBeAssigned = [];

  if (hasAssignRolePermissions) {
    // only show roles not already assigned
    const roleArr =
      lookupWallet && lookupWallet.roles ? lookupWallet.roles.split(",") : [];
    if (!lookupWallet)
      rolesThatCanBeAssigned.push({ value: RoleEnum.None, label: "None" });
    if (!roleArr.includes(RoleEnum.Consumer))
      rolesThatCanBeAssigned.push({
        value: RoleEnum.Consumer,
        label: "Consumer",
      });
    if (!roleArr.includes(RoleEnum.Industry))
      rolesThatCanBeAssigned.push({
        value: RoleEnum.Industry,
        label: "Industry Member",
      });
    if (roles.isAdmin) {
      if (!roleArr.includes(RoleEnum.RecDealer))
        rolesThatCanBeAssigned.push({
          value: RoleEnum.RecDealer,
          label: "Renewable Energy Certificate (REC) Dealer",
        });
      if (!roleArr.includes(RoleEnum.OffsetDealer))
        rolesThatCanBeAssigned.push({
          value: RoleEnum.OffsetDealer,
          label: "Offset Dealer",
        });
      if (!roleArr.includes(RoleEnum.EmissionsAuditor))
        rolesThatCanBeAssigned.push({
          value: RoleEnum.EmissionsAuditor,
          label: "Emissions Auditor",
        });
    }
    if (!rolesThatCanBeAssigned.find((r) => r.value === role)) {
      if (rolesThatCanBeAssigned.length > 0) {
        setRole(rolesThatCanBeAssigned[0].value);
      }
    }
  }

  // when the looked up wallet is set by the lookup
  const onWalletChange = useCallback(
    (w: Wallet | null) => {
      console.log("onWalletChange:", w);
      clearAllFormMessages();
      setTheirRoles({});
      setLookupWallet(w);
      setAddress(w ? w.address! : "");
      if (!w || !w.address) setShowAddUserForm(false);
    },
    [clearAllFormMessages]
  );
  const onLookupInputChange = useCallback(
    (v: string) => {
      console.log("onLookupInputChange:", v);
      setAddress(v);
      if (!v) {
        setLookupWallet(null);
        clearAllFormMessages();
        setShowAddUserForm(false);
      }
    },
    [clearAllFormMessages]
  );

  // called on the Lookup button click
  const lookupWalletRoles = useCallback(async () => {
    if (lookupRef.current) lookupRef.current.close();
    const addressStr = address || lookupRef.current?.value();
    if ((lookupWallet && lookupWallet.address) || provider) {
      if (theirRoles.hasAnyRole) setTheirRoles({});
      setFetchingTheirRoles(true);
      setRole('None');
      setLookupError("");
      setLookupMessage("");
      setShowAddUserForm(false);
      if (lookupWallet && lookupWallet.address) {
        try {
          const lookup = await trpcClient.query("wallet.lookup", {
            query: lookupWallet.address,
          });
          if (lookup?.wallets && lookup?.wallets.length === 1) {
            setLookupWallet(lookup?.wallets[0]);
            setAddress(lookup?.wallets[0].address || "");
          } else {
            setLookupWallet(null);
            setLookupMessage(
              `Account ${lookupWallet.address} not found.${hasAssignRolePermissions ? " Use the form below to add it." : ""
              }`
            );
            if (hasAssignRolePermissions) setShowAddUserForm(true);
          }
        } catch (error) {
          console.error("trpc error: ", error);
        }
      } else if (addressStr) {
        if (provider) {
          let result = await getRoles(provider, addressStr);
          if (lookupWallet) setLookupWallet(null);
          if (!result.hasAnyRole)
            setLookupMessage(
              `Account ${addressStr} not found.${hasAssignRolePermissions ? " Use the form below to add it." : ""
              }`
            );
          if (hasAssignRolePermissions) setShowAddUserForm(true);
          setAddress(addressStr);
          setTheirRoles(result);
        }
      }
      setFetchingTheirRoles(false);
    }
  }, [lookupWallet, provider, address, theirRoles, hasAssignRolePermissions]);

  const addRoleQuery = useMutation(async () => {
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
      console.error("Wallet " + address + " already has role " + role);
      setRoleError("That address already has this role.");
      return;
    } else {
      setRoleError("");
      console.log("Current roles not include role", currentRoles, role);

      const error = await registerRoleInContract(provider, address, role);
      if (error) {
        setRoleError(error);
        return;
      }
      // update the lookup wallet so the UI reflects the change immediately
      if (lookupWallet) {
        // optimistic update of the roles, add it to the list
        setLookupWallet(w=>{ return w ? {...w, roles: (w.roles?.split(',') ?? []).concat(`${role} (pending)`).filter(r=>r).join(',') } : null });
        setLookupError("");
      }
      setModalShow(true);
    }
  });

  const unregisterRoleInContract = useCallback(
    async (provider: Web3Provider | JsonRpcProvider, address: string, role: Role) => {
      let result = null;

      switch (role) {
        case RoleEnum.Consumer:
          result = await unregisterConsumer(provider, address);
          break;
        case RoleEnum.RecDealer:
          result = await unregisterDealer(provider, address, 1);
          break;
        case RoleEnum.OffsetDealer:
          result = await unregisterDealer(provider, address, 2);
          break;
        case RoleEnum.EmissionsAuditor:
          result = await unregisterDealer(provider, address, 3);
          break;
        case RoleEnum.Industry:
          result = await unregisterIndustry(provider, address);
          break;
        default:
          const err = `Invalid role was given: ${role}`;
          console.error(err);
          return err;
      }
      setModalResult(result.toString());
      if (!result || result.toString().indexOf("Success") === -1) {
        console.error("Transaction did not succeed");
        return "The transaction could not be sent to the blockchain: " + result;
      } else {
        console.log("Transaction successful", result.toString());
        return null;
      }
    },
    []
  );

  const registerRoleInContract = useCallback(
    async (provider: Web3Provider | JsonRpcProvider, address: string, role: Role) => {
      let result = null;
      switch (role) {
        case RoleEnum.None:
          return null;
        case RoleEnum.Consumer:
          result = await registerConsumer(provider, address);
          break;
        case RoleEnum.RecDealer:
          result = await registerDealer(provider, address, 1);
          break;
        case RoleEnum.OffsetDealer:
          result = await registerDealer(provider, address, 2);
          break;
        case RoleEnum.EmissionsAuditor:
          result = await registerDealer(provider, address, 3);
          break;
        case RoleEnum.Industry:
          result = await registerIndustry(provider, address);
          break;
        default:
          const err = `Invalid role was given: ${role}`;
          console.error(err);
          return err;
      }
      setModalResult(result.toString());
      if (!result || result.toString().indexOf("Success") === -1) {
        console.error("Transaction did not succeed", result);
        return "The transaction could not be sent to the blockchain: " + result;
      } else {
        console.log("Transaction successful", result.toString());
        return null;
      }
    },
    []
  );

  const onRoleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    setRole(event.target.value as Role);
  };

  return (
    <>
      <SubmissionModal
        show={modalShow}
        title="Manage roles"
        body={modalResult}
        onHide={() => {
          setModalShow(false);
          setModalResult("");
        }}
      />

      <InputGroup className="mb-3">
        <WalletLookupInput
          ref={lookupRef}
          onChange={onLookupInputChange}
          onWalletChange={onWalletChange}
        />
        <Button variant="outline-secondary" onClick={lookupWalletRoles}>
          Look-up
        </Button>
      </InputGroup>
      {lookupError && (
        <Alert variant="danger" onClose={() => setLookupError("")} dismissible>
          {lookupError}
        </Alert>
      )}
      {lookupMessage && <p>{lookupMessage}</p>}

      {(lookupWallet || fetchingTheirRoles || theirRoles?.hasAnyRole ) && <Card body>
        {lookupWallet && lookupWallet.address && (
          <DisplayWalletDetails
            provider={provider}
            signedInAddress={signedInAddress}
            roles={roles}
            wallet={lookupWallet}
            unregisterRoleInContract={unregisterRoleInContract}
            setWallet={setLookupWallet}
            setError={setLookupError}
            onSuccess={()=>{setModalShow(true)}}
            />
        )}
        {fetchingTheirRoles && (
          <div className="text-center mt-3 mb-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
        {theirRoles && <RolesList roles={theirRoles} />}

        {/* For existing wallet, display roles to add if owner has permissions for the roles. */}
        {lookupWallet && hasAssignRolePermissions && (
          <>
            <h4>Add Role</h4>
            <Form ref={formRef} noValidate validated={registerFormValidated}>
              <Form.Group className="mb-3" controlId="rolesInput">
                {rolesThatCanBeAssigned && rolesThatCanBeAssigned.length > 0 ? (
                  <Form.Select onChange={onRoleChange} isInvalid={!!roleError} value={role}>
                    {rolesThatCanBeAssigned.map((r, i) => (
                      <option key={i} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                    <p>You cannot assign any more role to this user.</p>
                  )}
                <Form.Control.Feedback type="invalid">
                  {roleError}
                </Form.Control.Feedback>
              </Form.Group>
              {rolesThatCanBeAssigned && rolesThatCanBeAssigned.length > 0 && <AsyncButton
                type="submit"
                className="w-100 mb-3"
                variant="success"
                onClick={() =>{ addRoleQuery.mutate() }}
                loading={addRoleQuery.isLoading}
              >Add Role</AsyncButton>}
            </Form>
            </>
        )}
      </Card>}

      {/* Only display registration if owner has permissions for the roles, also hide this when the wallet was found already. */}
      {!lookupWallet && hasAssignRolePermissions && showAddUserForm && (
        <AddWalletForm
          provider={provider}
          roles={roles}
          address={address}
          registerRoleInContract={registerRoleInContract}
          setWallet={setLookupWallet}
          setError={setLookupError}
          onSuccess={()=>{setModalShow(true)}}
          />
      )}
    </>
  );
};

export default FindOrSetupWallet;
