import { FC, useState } from "react";
import { Link, useLocation } from "wouter";
import { Form, Button, Card, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap"
import { FaRegClipboard } from 'react-icons/fa'

import { CopyToClipboard } from 'react-copy-to-clipboard';
import { markPkExported } from '../services/api.service';
import { FormInputRow } from "../components/forms-util";
import ErrorAlert from "../components/error-alert";
import { TRPCClientError } from "@trpc/client";
import { Wallet } from "../components/static-data";


type ExportPkForm = {
  password: string,
  confirmed: string,
  error: string,
  success: string,
  loading: string,
  currentpk: string
}
type ExportPkFormErrors = Partial<ExportPkForm>

const defaultExportPkForm: ExportPkForm = {
  password: "",
  confirmed: "",
  error: "",
  success: "",
  loading: "",
  currentpk: ""
} as const;

type ExportPkProps = {
  signedInWallet?: Wallet,
  logoutOfWalletInfo: () => void
}
const ExportPk: FC<ExportPkProps> = ({ signedInWallet, logoutOfWalletInfo }) => {

  const [form, setForm] = useState<ExportPkForm>(defaultExportPkForm)
  const [formErrors, setFormErrors] = useState<ExportPkFormErrors>({})
  const [, setLocation] = useLocation();

  async function handleExportPk() {
    try {
      const currentpk = signedInWallet?.private_key;
      setForm({...form, loading: 'true'})
      await markPkExported(signedInWallet?.email || '', form.password);
      setForm({
        ...form,
        loading: '',
        success: 'true',
        currentpk: currentpk || '',
      });
      if (signedInWallet) {
        signedInWallet.private_key = '';
      }

      // logs out
      logoutOfWalletInfo();

    } catch (err) {
      console.error(err);
      if (err instanceof TRPCClientError) {
        console.warn(err.data)
        if (err?.data?.zodError?.fieldErrors) {
          const fieldErrors = err.data.zodError.fieldErrors;
          const errs: ExportPkFormErrors = {};
          for (const f in fieldErrors) {
            errs[f as keyof ExportPkFormErrors] = fieldErrors[f].join(', ');
          }
          setFormErrors({ ...errs })
        }
        setForm({ ...form, loading: '', success: '', error: err?.data?.domainError });
      } else {
        setForm({ ...form, loading: '', success: '', error: ("" + ((err instanceof Error) ? err.message : err)) });
      }
    }
  }

  return (
    <>
      <Card style={{  margin: 'auto', padding: '1rem' }}>

        <Card.Body>
          <Card.Title as="h2">Export Primary Key</Card.Title>
          {(signedInWallet || form.success) ? <>
            {signedInWallet?.private_key? <>
              <p className="mt-4">Once you get this private key, you must always use the private key to access your account. This means you won't be able to login with your email and password but will have to use Metamask instead.</p>

              <Form onSubmit={(e)=>{
                e.preventDefault()
                e.stopPropagation()
                if (e.currentTarget.checkValidity() === false) return
                handleExportPk()
              }}>
                <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="password" label="Password" />

                <Button type="submit" className="w-100 mb-3" variant="success" size="lg" disabled={!!form.loading}>
                  {!!form.loading ?
                    <Spinner
                      animation="border"
                      className="me-2"
                      size="sm"
                      as="span"
                      role="status"
                      aria-hidden="true"
                      /> : <></>
                }
                  Confirm Export
                </Button>

                {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, password: '', error:'' }) }}>
                  <div>If you just signed up, make sure to valid your email address first.</div>
                </ErrorAlert>}
              </Form>
              </> : <>
                <p>You must import this private key into your wallet and sign in with it from now on. You can no longer use your email to sign in.</p>
                <p>Your key:
                {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
                <CopyToClipboard text={form.currentpk??''}>
                  <span className="text-secondary">
                    <OverlayTrigger
                      trigger="click"
                      placement="bottom"
                      rootClose={true}
                      delay={{ show: 250, hide: 400 }}
                      overlay={<Tooltip id='copied-address-tooltip'>Copied to clipboard!</Tooltip>}
                    >
                      <Button variant="outline-secondary" size="sm" className="ms-3">Copy Key to Clipboard&nbsp;<sup><FaRegClipboard/></sup></Button>
                    </OverlayTrigger>
                  </span>
                </CopyToClipboard>
              </p>
              <pre>{form.currentpk}</pre>
              </>
              }
            </> : <p className="mt-4">You must <Link href="/sign-in">sign in</Link> to export your private key.</p>}
        </Card.Body>

      </Card>
      </>)

}

export default ExportPk;
