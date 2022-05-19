import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import {
  FC,
  ReactNode,
  useContext,
  ChangeEventHandler,
  useRef,
  useState,
  ElementRef,
  useCallback,
  useMemo,
} from "react";
import {
  Accordion,
  AccordionContext,
  Alert,
  Button,
  Form,
  InputGroup,
  OverlayTrigger,
  Spinner,
  Tooltip,
  useAccordionButton,
} from "react-bootstrap";
import WalletLookupInput from "./wallet-lookup-input";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaRegClipboard } from "react-icons/fa";
import {
  Role,
  RoleEnum,
  RolesInfo,
  rolesInfoToArray,
  Wallet,
} from "./static-data";
import { trpcClient } from "../services/trpc";
import { getRoles } from "../services/contract-functions";
import SubmissionModal from "./submission-modal";
import {
  registerConsumer,
  unregisterConsumer,
  registerIndustry,
  registerDealer,
  unregisterDealer,
  unregisterIndustry,
} from "../services/contract-functions";
import RolesList from "./roles-list";
import AddUserForm from "./add-user-form";

function RolesCodesToLi({
  currentRoles,
  roles,
  unregister,
}: {
  currentRoles: RolesInfo;
  roles: string | Role[] | undefined;
  unregister?: (r: Role) => void;
}) {
  if (!roles) return null;
  const arr: Role[] = Array.isArray(roles)
    ? roles
    : (roles.split(",") as Role[]);
  return (
    <>
      {arr.sort().map((r) => (
        <li key={r}>
          {r}
          {unregister &&
            (currentRoles.isAdmin ||
              ((currentRoles.hasDealerRole || currentRoles.hasIndustryRole) &&
                r === "Consumer")) && (
              <Button
                variant="outline-danger"
                className="ms-2 my-1"
                size="sm"
                onClick={() => {
                  unregister(r);
                }}
              >
                Unregister
              </Button>
            )}
        </li>
      ))}
    </>
  );
}

function CustomToggle({
  children,
  eventKey,
}: {
  children: ReactNode;
  eventKey: string;
}) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);
  console.log("CustomToggle", eventKey, activeEventKey);
  const isCurrentEventKey = activeEventKey === eventKey;

  return (
    <div>
      <span className="me-3">{children}</span>
      {isCurrentEventKey ? (
        <Button
          onClick={decoratedOnClick}
          size="sm"
          variant="outline-secondary"
        >
          Hide
        </Button>
      ) : (
        <Button onClick={decoratedOnClick} size="sm" variant="outline-primary">
          Show
        </Button>
      )}
    </div>
  );
}

type Props = {
  provider?: Web3Provider | JsonRpcProvider;
  signedInAddress: string;
  roles: RolesInfo;
  limitedMode: boolean;
};

const FindOrSetupWallet: FC<Props> = ({
  provider,
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

  async function handleSingleUnregister(wallet: Wallet, role: Role) {
    if (!provider) return;
    const error = await unregisterRoleInContract(
      provider,
      wallet.address!,
      role
    );
    if (error) {
      setLookupError(error);
      return;
    }
    try {
      const unregister = await trpcClient.mutation("wallet.unregisterRoles", {
        address: wallet.address!,
        roles: [role],
      });
      setLookupWallet(unregister?.wallet || null);
      setLookupError("");
    } catch (error) {
      console.error("trpc error;", error);
      setLookupError("An error occurred while unregistering the wallet role.");
    }
    setModalShow(true);
  }

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
      if (!roleArr.includes(RoleEnum.IndustryDealer))
        rolesThatCanBeAssigned.push({
          value: RoleEnum.IndustryDealer,
          label: "Registered Industry Dealer (CarbonTracker)",
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
        case RoleEnum.IndustryDealer:
          result = await unregisterDealer(provider, address, 4);
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
      try {
        const register = await trpcClient.mutation("wallet.registerRoles", {
          address,
          roles: [role],
        });
        setLookupWallet(register?.wallet || null);
        setLookupError("");
      } catch (error) {
        console.error("trpc error;", error);
        setLookupError("An error occurred while registering the wallet role.");
      }
      setModalShow(true);
    }
  }

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
        case RoleEnum.IndustryDealer:
          result = await registerDealer(provider, address, 4);
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
      {lookupWallet && lookupWallet.address && (
        <ul>
          <li>Name: {lookupWallet.name}</li>
          <li>Address: {lookupWallet.address}</li>
          {lookupWallet.organization && (
            <li>Organization: {lookupWallet.organization}</li>
          )}
          {lookupWallet.public_key_name && (
            <li>Public Key Name: {lookupWallet.public_key_name}</li>
          )}
          {lookupWallet.public_key && (
            <li>
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
                        overlay={
                          <Tooltip id="copied-pubkey-tooltip">
                            Copied to clipboard!
                          </Tooltip>
                        }
                      >
                        <sup style={{ cursor: "pointer" }}>
                          &nbsp;
                          <FaRegClipboard />
                        </sup>
                      </OverlayTrigger>
                    </span>
                  </CopyToClipboard>
                </CustomToggle>

                <Accordion.Collapse eventKey="0">
                  <pre>{lookupWallet.public_key}</pre>
                </Accordion.Collapse>
              </Accordion>
            </li>
          )}
          {lookupWallet.roles ? (
            <li>
              Roles:{" "}
              <ul>
                <RolesCodesToLi
                  currentRoles={roles}
                  roles={lookupWallet.roles}
                  unregister={(r) => {
                    handleSingleUnregister(lookupWallet, r);
                  }}
                />
              </ul>
            </li>
          ) : (
            <li>No roles found.</li>
          )}
        </ul>
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
                <Form.Select onChange={onRoleChange} isInvalid={!!roleError}>
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
            <Form.Group className="d-grid gap-2 mt-3">
              <Button
                variant="success"
                size="lg"
                onClick={handleSingleRegister}
              >
                Add Role
              </Button>
            </Form.Group>
          </Form>
        </>
      )}

      {/* Only display registration if owner has permissions for the roles, also hide this when the wallet was found already. */}
      {!lookupWallet && hasAssignRolePermissions && showAddUserForm && (
        <AddUserForm
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
