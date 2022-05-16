import { FC, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Form, Button, Card } from "react-bootstrap"

import { signInUser } from '../services/api.service';
import { FormInputRow } from "../components/forms-util";
import ErrorAlert from "../components/error-alert";
import { TRPCClientError } from "@trpc/client";


type SignInForm = {
  email: string,
  password: string,
  error: string,
  success: string,
  loading: string
}
type SignInFormErrors = Partial<SignInForm>

const defaultSignInForm: SignInForm = {
  email: "",
  password: "",
  error: "",
  success: "",
  loading: ""
} as const;

type SignInProps = {
  loadWalletInfo: (publick_key: string, private_key: string) => void
}
const SignIn: FC<SignInProps> = ({ loadWalletInfo }) => {

  const [form, setForm] = useState<SignInForm>(defaultSignInForm)
  const [formErrors, setFormErrors] = useState<SignInFormErrors>({})
  const [, setLocation] = useLocation();

  useEffect(()=>{
    // get the email parameter from the url
    console.log('location', window.location)
    const email = new URL(window.location.href).searchParams.get("email");
    if (email) {
      setForm(prevState => ({...prevState, email }))
    }
  }, [])

  async function handleSignIn() {
    try {
      const rslt = await signInUser(form.email, form.password);
      if (rslt) {
        const wallet = rslt.wallet;
        if (wallet.address && wallet.private_key) {
          setForm({
            ...form,
            loading: '',
          });
          loadWalletInfo(wallet.address, wallet.private_key);
          setLocation('/dashboard');
          return
        }
      }
      setForm({
        ...form,
        loading: '',
        error: 'Unexpected error: No wallet info returned from API'
      });
    } catch (err) {
      console.error(err);
      if (err instanceof TRPCClientError) {
        console.warn(err.data)
        if (err?.data?.zodError?.fieldErrors) {
          const fieldErrors = err.data.zodError.fieldErrors;
          const errs: SignInFormErrors = {};
          for (const f in fieldErrors) {
            errs[f as keyof SignInFormErrors] = fieldErrors[f].join(', ');
          }
          setFormErrors({ ...errs })
        }
        setForm({ ...form, loading: '', error: err?.data?.domainError });
      } else {
        setForm({ ...form, loading: '', error: ("" + ((err instanceof Error) ? err.message : err)) });
      }
    }
  }

  return (
    <Card style={{ width: '32rem', margin: 'auto', padding: '1rem' }}>
      <Card.Body>
        <Card.Title as="h2">Sign In</Card.Title>
        <p className="mt-4">Please sign in with your credentials</p>
        <Form onSubmit={(e)=>{
          e.preventDefault()
          e.stopPropagation()
          if (e.currentTarget.checkValidity() === false) return
          handleSignIn()
        }}>
          <FormInputRow form={form} setForm={setForm} errors={formErrors} required type="email" field="email" label="Email" />
          <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="password" label="Password" />
          <p className="text-muted"><a href="">Forgot your password? </a></p>
          <Button type="submit" className="w-100 mb-3" variant="success" size="lg">Sign In</Button>
          {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, password: '', error:'' }) }}>
            <div>If you just signed up, make sure to valid your email address first.</div>
          </ErrorAlert>}
          <p className="text-muted">If you don't have an account, you can signup here <Link href="sign-up">SignUp</Link></p>
        </Form>

      </Card.Body>
    </Card>
  )

}

export default SignIn;
