import { FC, ReactNode, useContext } from "react";
import { Accordion, AccordionContext, Button, OverlayTrigger, Tooltip, useAccordionButton } from "react-bootstrap";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { trpcClient } from "../services/trpc";
import { Role, RolesInfo, Wallet } from "./static-data";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaRegClipboard } from "react-icons/fa";

function CustomToggle({
  children,
  eventKey,
}: {
  children: ReactNode;
  eventKey: string;
}) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);
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

type Props = {
  provider?: Web3Provider | JsonRpcProvider
  signedInAddress: string
  roles: RolesInfo
  wallet: Wallet | null
  unregisterRoleInContract: (provider: Web3Provider | JsonRpcProvider, address: string, role: Role) => Promise<string | null>
  setWallet: (wallet: Wallet | null) => void
  setError: (error: string) => void
  onSuccess?: () => void
};

const DisplayWalletDetails: FC<Props> = ({
  provider,
  signedInAddress,
  roles,
  wallet,
  unregisterRoleInContract,
  setWallet,
  setError,
  onSuccess
}) => {

  async function handleSingleUnregister(wallet: Wallet, role: Role) {
    if (!provider) return;
    const error = await unregisterRoleInContract(
      provider,
      wallet.address!,
      role
    );
    if (error) {
      setError(error);
      return;
    }
    try {
      const unregister = await trpcClient.mutation("wallet.unregisterRoles", {
        address: wallet.address!,
        roles: [role],
      });
      setWallet(unregister?.wallet || null);
      setError("");
    } catch (error) {
      console.error("trpc error;", error);
      setError("An error occurred while unregistering the wallet role.");
    }
    if (onSuccess) onSuccess();
  }

  return !wallet ? <></> : (
    <ul>
      <li>Name: {wallet.name}</li>
      <li>Address: {wallet.address}</li>
      {wallet.organization && (
        <li>Organization: {wallet.organization}</li>
      )}
      {wallet.public_key_name && (
        <li>Public Key Name: {wallet.public_key_name}</li>
      )}
      {wallet.public_key && (
        <li>
          <Accordion>
            <CustomToggle eventKey="0">
              Public Key:
              {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
              <CopyToClipboard text={wallet.public_key_name}>
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
              <pre>{wallet.public_key}</pre>
            </Accordion.Collapse>
          </Accordion>
        </li>
      )}
      {wallet.roles ? (
        <li>
          Roles:{" "}
          <ul>
            <RolesCodesToLi
              currentRoles={roles}
              roles={wallet.roles}
              unregister={(r) => {
                handleSingleUnregister(wallet, r);
              }}
              />
          </ul>
        </li>
      ) : (
          <li>No roles found.</li>
        )}
    </ul>
  )
}

export default DisplayWalletDetails;

