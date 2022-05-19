// SPDX-License-Identifier: Apache-2.0
import { ForwardRefRenderFunction, useImperativeHandle, forwardRef } from "react";
import {Link} from "wouter";

import RegisterSelfIndustry from "../components/register-self-industry";
import {RolesInfo} from "../components/static-data";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
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
      <h2>Manage roles</h2>
      <p>Register or unregister roles for different addresses on the network. Must be an owner to register dealers, and must be a dealer to register consumers.</p>

      {signedInAddress &&
        <>
          <h4>My Roles</h4>
          {roles
           ? (roles.hasAnyRole ? <RolesList roles={roles}/> : <p>Unregistered.</p>)
           : <div className="text-center mt-3 mb-3">
               <Spinner animation="border" role="status">
                 <span className="sr-only">Loading...</span>
               </Spinner>
             </div>
          }
          { signedInWallet?.private_key &&
            <Link href="export-pk">
              <Button
                className="w-100 mb-3"
                variant="primary"
                size="lg"
              >Export Primary Key
              </Button>
            </Link>
          }
          { provider && myWalletQuery.data && <>
            <h4>My Wallet</h4>
            <UpdateMyWalletForm
              provider={provider}
              signedInAddress={signedInAddress}
              wallet={myWalletQuery.data.wallet}
              onSuccess={()=>{ myWalletQuery.refetch() }} />
            </>}
        </>
      }

      <h4>Find or Set Up a User</h4>
      <FindOrSetupWallet provider={provider} signedInAddress={signedInAddress} roles={roles} limitedMode={limitedMode} />

      {(!roles.isAdmin && !roles.isIndustry) &&
        <RegisterSelfIndustry provider={provider} signedInAddress={signedInAddress} />
    }

    </>
  );
}

export default forwardRef(AccessControlForm);

