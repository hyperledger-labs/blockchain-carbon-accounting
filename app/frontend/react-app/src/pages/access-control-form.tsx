// SPDX-License-Identifier: Apache-2.0
import { ForwardRefRenderFunction, useImperativeHandle, forwardRef } from "react";
import {Link} from "wouter";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Tooltip } from "react-bootstrap";
import { FaRegClipboard } from 'react-icons/fa';
import {RolesInfo} from "../components/static-data";

import Spinner from "react-bootstrap/Spinner";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { trpc } from "../services/trpc";
import FindOrSetupWallet from "../components/find-or-setup-wallet";
import RolesList from "../components/roles-list";
import { Wallet } from "../components/static-data";
import UpdateMyWalletForm from "../components/update-my-wallet-form";


type AccessControlFormProps = {
  provider?: Web3Provider | JsonRpcProvider
  signedInAddress: string
  roles: RolesInfo
  limitedMode: boolean,
  signedInWallet?: Wallet,
  providerRefresh?: ()=>void
}

type AccessControlHandle = {
  refresh: ()=>void
}

const AccessControlForm: ForwardRefRenderFunction<AccessControlHandle, AccessControlFormProps> = ({ provider, providerRefresh, signedInAddress, roles, limitedMode, signedInWallet }, ref) => {

  // Allows the parent component to refresh
  useImperativeHandle(ref, () => ({
    refresh() {
      handleRefresh();
    }
  }));

  async function handleRefresh() {
    if (!!signedInAddress) {
      myWalletQuery.refetch();
      if (providerRefresh) {
        providerRefresh();
      }
    }
  }

  const myWalletQuery = trpc.useQuery(['wallet.get', {address: signedInAddress}], {
    enabled: !!signedInAddress,
    refetchOnWindowFocus: false,
  })

  return (
    <>

      {signedInAddress &&
        <>
          <h2>My Account</h2>
          <ul>
            <li><b>Address:</b>
              {" "}
              {signedInAddress}
              {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
              <CopyToClipboard text={signedInAddress}>
                <span className="text-secondary">
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    rootClose={true}
                    delay={{ show: 250, hide: 400 }}
                    overlay={<Tooltip id='copied-address-tooltip'>Copied to clipboard!</Tooltip>}
                  >
                    <sup style={{cursor: "pointer"}}>&nbsp;<FaRegClipboard/></sup>
                  </OverlayTrigger>
                </span>
              </CopyToClipboard>
              &nbsp;&nbsp;
              <a href={`/dashboard/address/${signedInAddress}`}>Dashboard</a>
              {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
              <CopyToClipboard text={`${window.location.protocol}//${window.location.host}/dashboard/address/${signedInAddress}`}>
                <span className="text-secondary">
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    rootClose={true}
                    delay={{ show: 250, hide: 400 }}
                    overlay={<Tooltip id='copied-address-tooltip'>Copied to clipboard!</Tooltip>}
                  >
                    <sup style={{cursor: "pointer"}}>&nbsp;<FaRegClipboard/></sup>
                  </OverlayTrigger>
                </span>
              </CopyToClipboard>
            </li>
            <li><b>Name:</b> {myWalletQuery?.data?.wallet?.name}</li>
            <li><b>Organization:</b> {myWalletQuery?.data?.wallet?.organization}</li>
            <li><b>Email:</b> {myWalletQuery?.data?.wallet?.email}</li>
            <li><b>Roles:</b> {roles
              ? (roles.hasAnyRole ? <RolesList roles={roles}/> : <p>Unregistered.</p>)
              : <div className="text-center mt-3 mb-3">
                <Spinner animation="border" role="status">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              </div>
            }</li>
          </ul>
          { signedInWallet?.private_key ? <>
            <p>Your account is set up to login with your email and password.  <Link href="export-pk">Click here</Link> to export your private key so you can sign in with Metamask.</p>
            </> : <>
              <p>Your account is set up to login with your Metamask wallet and private key.</p>
            </>
          }
          { provider && myWalletQuery.data && !signedInWallet?.private_key && <>
            <h4>My Wallet</h4>
            <UpdateMyWalletForm
              provider={provider}
              signedInAddress={signedInAddress}
              wallet={myWalletQuery.data.wallet}
              onSuccess={()=>{ myWalletQuery.refetch() }} />
            </>}
        </>
      }

      {(roles.hasDealerRole || roles.isAdmin) &&
        <>
          <h2>Manage roles</h2>
          <p>Register or unregister roles for different addresses on the network. Must be an owner to register dealers, and must be a dealer to register consumers.</p>
          <h4>Find or Set Up a User</h4>
          <FindOrSetupWallet provider={provider} signedInAddress={signedInAddress} roles={roles} limitedMode={limitedMode} />
        </>
      }


    </>
  );
}

export default forwardRef(AccessControlForm);

