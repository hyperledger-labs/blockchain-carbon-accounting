import { FC } from "react";
import { Button } from "react-bootstrap";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { trpcClient } from "../services/trpc";

type EthereumType = {
  request: (request: {method: string, params?: Array<any>}) => Promise<any>
};

type Props = {
  provider: Web3Provider | JsonRpcProvider
  signedInAddress: string
  onSuccess?: () => void
};

const ProvideMetamaskEncryptionKeyButton: FC<Props> = ({
  provider,
  signedInAddress,
  onSuccess
}) => {
  const ethereum: EthereumType = (window as any).ethereum;

  return <Button
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
      if (onSuccess) onSuccess()
    }}
  >
    Provide my encrypted key
  </Button>

}

export default ProvideMetamaskEncryptionKeyButton;
