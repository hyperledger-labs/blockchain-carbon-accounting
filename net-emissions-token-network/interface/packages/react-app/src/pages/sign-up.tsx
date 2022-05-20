import { FC, useState } from "react";
import { Link } from "wouter"
import { Form, Button, Card, Spinner } from "react-bootstrap";

import { signUpUser } from "../services/api.service";
import { TRPCClientError } from "@trpc/client";
import { FormInputRow } from "../components/forms-util";
import ErrorAlert from "../components/error-alert";


type SignUpForm = {
  name: string,
  organization: string,
  email: string,
  password: string,
  passwordConfirm: string
  error: string,
  success: string,
  loading: string
}
type SignUpFormErrors = Partial<SignUpForm>

const defaultSignUpForm: SignUpForm = {
  name: "",
  organization: "",
  email: "",
  password: "",
  passwordConfirm: "",
  error: "",
  success: "",
  loading: ""
} as const;

const SignUp: FC<{}> = () => {

  const [form, setForm] = useState<SignUpForm>(defaultSignUpForm)
  const [formErrors, setFormErrors] = useState<SignUpFormErrors>({})

  async function handleSignUp() {
    try {
      setFormErrors({})
      setForm({ ...form, error: "", success: "", loading: "true" })
      const result = await signUpUser(form.email, form.password, form.passwordConfirm, form.name, form.organization);
      if (result) {
        setForm({
          ...defaultSignUpForm,
          loading: '',
          success: "Sign up successful, please check your email to verify your account."
        });
      }
    } catch (err) {
      console.error(err);
      if (err instanceof TRPCClientError) {
        console.warn(err.data)
        if (err?.data?.zodError?.fieldErrors) {
          const fieldErrors = err.data.zodError.fieldErrors;
          const errs: SignUpFormErrors = {};
          for (const f in fieldErrors) {
            errs[f as keyof SignUpFormErrors] = fieldErrors[f].join(', ');
          }
          setFormErrors({ ...errs })
        }
        setForm({ ...form, loading: '', error: err?.data?.domainError });
      } else {
        setForm({ ...form, loading: '', error: ("" + ((err instanceof Error) ? err.message : err)) });
      }
    }
  }

  return (<>
    <Card style={{ width: '32rem', margin: 'auto', padding: '1rem' }}>
      <Card.Body>

        {form.success ? <>
          <Card.Title as="h2">Sign Up Success</Card.Title>
          <p className="mt-4">{form.success}</p>
          </> : <>
            <Card.Title as="h2">Sign Up</Card.Title>

            <p className="mt-4">Enter your email and a password. A verification email will be sent to you.</p>
            <Form
              onSubmit={(e)=>{
                e.preventDefault()
                e.stopPropagation()
                if (e.currentTarget.checkValidity() === false) return
                handleSignUp()
              }}>
              <FormInputRow form={form} setForm={setForm} errors={formErrors} type="input" field="name" label="Name" />
              <FormInputRow form={form} setForm={setForm} errors={formErrors} type="input" field="organization" label="Organization" />
              <FormInputRow form={form} setForm={setForm} errors={formErrors} required type="email" field="email" label="Email" />
              <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="password" label="Password" />
              <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="passwordConfirm" label="Confirm Password" />

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
                Sign Up
              </Button>
              {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, error:'' }) }} />}
              <p className="text-muted">If you already have an account, you can <Link href="/sign-in">sign in here</Link>.</p>
            </Form>
            </>
      }
      </Card.Body>
    </Card>
  </>)
}

export default SignUp;
