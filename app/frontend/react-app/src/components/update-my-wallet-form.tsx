import { FC,  useEffect,  useState } from "react";
import { Form } from "react-bootstrap";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { trpcClient } from "../services/trpc";
import { Wallet } from "./static-data";
import AsyncButton from "./AsyncButton";
import { FormInputRow } from "./forms-util";
import { handleFormErrors } from "../services/api.service";
import ErrorAlert from "./error-alert";
// import ProvideMetamaskEncryptionKeyButton from "./provide-metamask-encryption-key-button";

type WalletForm = {
  public_key: string,
  public_key_name: string,
  error: string,
  success: string,
  loading: string
}
type WalletFormErrors = Partial<WalletForm>

const defaultWalletForm: WalletForm = {
  public_key: "",
  public_key_name: "",
  error: "",
  success: "",
  loading: ""
} as const;


type Props = {
  provider: Web3Provider | JsonRpcProvider
  signedInAddress: string
  wallet: Wallet | null
  onSuccess?: () => void
};

const UpdateMyWalletForm: FC<Props> = ({
  provider,
  signedInAddress,
  wallet,
  onSuccess
}) => {

  const [form, setForm] = useState<WalletForm>(defaultWalletForm)
  const [formErrors, setFormErrors] = useState<WalletFormErrors>({})

  useEffect(()=>{
    setForm({
      ...defaultWalletForm,
      public_key: wallet?.public_key || '',
      public_key_name: wallet?.public_key_name || ''
    })
  }, [wallet])

  return <Form onSubmit={async(e)=>{
    setForm(f=>{return {...f, error:'', loading:'true'} })
    setFormErrors({})
    e.preventDefault()
    e.stopPropagation()
    try {
      const payload = {
        address: signedInAddress,
        public_key: form.public_key,
        public_key_name: form.public_key_name
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
    } catch (error) {
      console.error('trpc error;', error)
      handleFormErrors(error, setFormErrors, setForm)
    }

    setForm(f=>{return {...f, loading:''} })
  }}>
    <FormInputRow form={form} setForm={setForm} errors={formErrors} field="public_key_name" label="Key Name" />
    <FormInputRow form={form} setForm={setForm} errors={formErrors} field="public_key" label="Public Key" as="textarea" style={{height: '20em'}} />
    {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, error:'' }) }}/>}
{/*

Commented out for now because Metamask decrypt is slow.

    {  provider instanceof Web3Provider && !!wallet?.metamask_encrypted_public_key ?
      <p>Your Metamask encryption key was provided.</p> :
      <ProvideMetamaskEncryptionKeyButton provider={provider} signedInAddress={signedInAddress} onSuccess={onSuccess} />
   }
*/}

    <AsyncButton
      className="w-100 mb-3"
      variant="primary"
      loading={!!form.loading}
      type="submit"
    >Update</AsyncButton>

  </Form>

}

export default UpdateMyWalletForm;
