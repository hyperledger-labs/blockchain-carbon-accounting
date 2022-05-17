// SPDX-License-Identifier: Apache-2.0
import { useState, ForwardRefRenderFunction, useImperativeHandle, forwardRef } from "react";

import RegisterSelfIndustry from "../components/register-self-industry";
import {RolesInfo} from "../components/static-data";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { FloatingLabel } from "react-bootstrap";
import { trpc, trpcClient } from "../services/trpc";
import FindOrSetupWallet from "../components/find-or-setup-wallet";
import RolesList from "../components/roles-list";


type EthereumType = {
  request: (request: {method: string, params?: Array<any>}) => Promise<any>
}

type AccessControlFormProps = {
  provider?: Web3Provider | JsonRpcProvider
  signedInAddress: string
  roles: RolesInfo
  limitedMode: boolean
  providerRefresh?: ()=>void
}

type AccessControlHandle = {
  refresh: ()=>void
}

const AccessControlForm: ForwardRefRenderFunction<AccessControlHandle, AccessControlFormProps> = ({ provider, providerRefresh, signedInAddress, roles, limitedMode }, ref) => {

  const ethereum: EthereumType = (window as any).ethereum;

  const [myPublicKey, setMyPublicKey] = useState("");
  const [hasMetamaskPubKey, setHasMetamaskPubKey] = useState(false);
  const [myWalletLoading, setMyWalletLoading] = useState(false);

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
    onSettled: (result) => {
      console.log('query get wallet', result)
      setMyPublicKey(result?.wallet?.public_key || '');

      // check public key
      console.log(result);
      if(result?.wallet?.metamask_encrypted_public_key === '' || 
        result?.wallet?.metamask_encrypted_public_key === null) 
      {
        setHasMetamaskPubKey(false);
      } else {
        setHasMetamaskPubKey(true);
      }
    }
  })

  return (
    <>
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
          { provider && myWalletQuery.data && <>
            <h4>My Wallet</h4>
            <Form onSubmit={async(e)=>{
              setMyWalletLoading(true)
              e.preventDefault()
              e.stopPropagation()
              try {
                const payload = {
                  address: signedInAddress,
                  public_key: myPublicKey
                }
                const message = JSON.stringify(payload)
                const signature = await provider.getSigner().signMessage(message)
                console.log('posting message', message, signature)
                const data = await trpcClient.mutation('wallet.update', {
                  ...payload,
                  signature
                })
                console.log('updated',data)
                myWalletQuery.refetch()
              } catch (error) {
                console.error('trpc error;', error)
              }

              setMyWalletLoading(false)
            }}>
              <FloatingLabel className="mb-2" controlId="myPublicKeyInput" label="Public Key">
                <Form.Control as="textarea" style={{height: '6em'}} placeholder="RSA Public Key" value={myPublicKey} onChange={(e)=>{ setMyPublicKey(e.currentTarget.value) }}/>
              </FloatingLabel>
                {hasMetamaskPubKey && <p>Your Metamask encryption key was provided.</p>}
              <Button
                className="w-100 mb-3"
                variant="primary"
                size="lg"
                disabled={myWalletLoading}
                type="submit"
              >
                {myWalletLoading ? 
                  <Spinner 
                    animation="border" 
                    className="me-2"
                    size="sm"   
                    as="span"
                    role="status"
                    aria-hidden="true"
                    /> : <></>
              }
                Update
              </Button>
            </Form>
            </>}
        </>
      }

      {signedInAddress && provider && !hasMetamaskPubKey &&
      <>
        <Button
          className="w-100 mb-3"
          variant="primary"
          size="lg"
          onClick={async () => {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const encryptionPublicKey = await ethereum.request({
              method: 'eth_getEncryptionPublicKey',
              params: [accounts[0]],
            });
            const payload = {
              address: signedInAddress,
              metamask_encrypted_public_key: encryptionPublicKey,
            }
            const message = JSON.stringify(payload)
            const signature = await provider.getSigner().signMessage(message)
            console.log('posting message', message, signature)
            const data = await trpcClient.mutation('wallet.update', {
              ...payload,
              signature
            })
            console.log('updated',data)
            myWalletQuery.refetch()
          }}
        >
          Provide my encrypted key
        </Button>
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

