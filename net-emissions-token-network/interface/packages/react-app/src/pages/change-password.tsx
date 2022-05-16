import { FC, useEffect, useState } from "react";
import { Form, Button, Card, Spinner } from "react-bootstrap";

import { changePassword  } from "../services/api.service";
import { TRPCClientError } from "@trpc/client";
import { FormInputRow } from "../components/forms-util";
import ErrorAlert from "../components/error-alert";
import { Link } from "wouter";


type ChangePasswordForm = {
  token: string,
  email: string,
  currentPassword: string,
  password: string,
  passwordConfirm: string
  error: string,
  success: string,
  loading: string
}
type ChangePasswordFormErrors = Partial<ChangePasswordForm>

const defaultChangePasswordForm: ChangePasswordForm = {
  token: "",
  email: "",
  currentPassword: "",
  password: "",
  passwordConfirm: "",
  error: "",
  success: "",
  loading: ""
} as const;

const ChangePassword: FC<{}> = () => {

  const [form, setForm] = useState<ChangePasswordForm>(defaultChangePasswordForm)
  const [formErrors, setFormErrors] = useState<ChangePasswordFormErrors>({})

  useEffect(()=>{
    // get the email parameter from the url
    console.log('location', window.location)
    const url = new URL(window.location.href);
    const email = url.searchParams.get("email") || '';
    const token = url.searchParams.get("token") || '';
    if (email || token) {
      setForm(prevState => ({...prevState, email, token  }))
    }
  }, [])

  async function handleChangePassword() {
    try {
      setFormErrors({})
      setForm({ ...form, error: "", success: "", loading: "true" })
      const result = await changePassword(form.email, form.token, form.currentPassword, form.password, form.passwordConfirm);
      if (result) {
        setForm({
          ...defaultChangePasswordForm,
          loading: '',
          success: "Password changed successfully."
        });
      }
    } catch (err) {
      console.error(err);
      if (err instanceof TRPCClientError) {
        console.warn(err.data)
        if (err?.data?.zodError?.fieldErrors) {
          const fieldErrors = err.data.zodError.fieldErrors;
          const errs: ChangePasswordFormErrors = {};
          for (const f in fieldErrors) {
            errs[f as keyof ChangePasswordFormErrors] = fieldErrors[f].join(', ');
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
          <Card.Title as="h2">Success</Card.Title>
          <p className="mt-4">{form.success}</p>
          <p>You can now go to <Link href={`sign-in?email=${form.email}`}>Sign In</Link>.</p>
          </> : <>
            {form.token ? <>
              <Card.Title as="h2">Reset your Password</Card.Title>
              <p className="mt-4">Enter your new password.</p>
            </> : <>
              <Card.Title as="h2">Change your Password</Card.Title>
              <p className="mt-4">Enter your current and new passwords.</p>
            </>}

            <Form
              onSubmit={(e)=>{
                e.preventDefault()
                e.stopPropagation()
                if (e.currentTarget.checkValidity() === false) return
                handleChangePassword()
              }}>
              <FormInputRow form={form} setForm={setForm} errors={formErrors} required type="email" field="email" label="Email" />
              {!form.token &&
                <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="currentPassword" label="Current Password" />
              }
              <hr/>
              <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="password" label="New Password" />
              <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="passwordConfirm" label="New Confirm Password" />

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
                Set New Password
              </Button>
              {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, error:'' }) }} />}
            </Form>
            </>
      }
      </Card.Body>
    </Card>
  </>)
}

export default ChangePassword;

