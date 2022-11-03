import { FC, useEffect, useState, useCallback } from "react";
import { Form, Card } from "react-bootstrap";
import { handleFormErrors } from "@blockchain-carbon-accounting/react-app/src/services/api.service";
import ErrorAlert from "@blockchain-carbon-accounting/react-app/src/components/error-alert";
import { FormInputRow } from "@blockchain-carbon-accounting/react-app/src/components/forms-util";

import AsyncButton from "@blockchain-carbon-accounting/react-app/src/components/AsyncButton";
import ReCAPTCHA from 'react-google-recaptcha';

type RegisterOperatorForm = {
  name: string,
  error: string,
  success: string,
  loading: string
}
type RegisterOperatorFormErrors = Partial<RegisterOperatorForm>

const defaultRegisterOperatorForm: RegisterOperatorForm = {
  name: "",
  error: "",
  success: "",
  loading: ""
} as const;

const SignUp: FC<{signedInAddress:string}> = (signedInAddress) => {

  const [form, setForm] = useState<RegisterOperatorForm>(defaultRegisterOperatorForm)
  const [formErrors, setFormErrors] = useState<RegisterOperatorFormErrors>({})
  const [captchaToken, setCaptchaToken] = useState<string>("")

  // Create an event handler so you can call the verification on button click event or form submit
  const onRecaptchaChange = useCallback((token: any) => {
    if (!process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
      return;
    }

    console.log('** recaptcha token **', token);
    setCaptchaToken(token);
    // Do whatever you want with the token
  }, []);

  async function handleSignUp() {
    try {
      if (process.env.REACT_APP_RECAPTCHA_SITE_KEY && !captchaToken) {
        console.log('** recaptcha token not available **');
        setForm({ ...form, error: "Captcha Token is required", success: "", loading: "" })
        return;
      }
      setFormErrors({})
      setForm({ ...form, error: "", success: "", loading: "true" })
      const result = '';//await registerOpertor(captchaToken, form.email, form.password, form.passwordConfirm, form.name, signedInAddress);
      if (result) {
        setForm({
          ...defaultRegisterOperatorForm,
          loading: '',
          success: "Sign up successful, please check your email to verify your account."
        });
      }
    } catch (err) {
      handleFormErrors(err, setFormErrors, setForm);
    }
  }

  return (<>
    <Card style={{ width: '32rem', margin: 'auto', padding: '1rem' }}>
      <Card.Body>

        {form.success ? <>
          <Card.Title as="h2">Register Success</Card.Title>
          <p className="mt-4">{form.success}</p>
          </> : <>
            <Card.Title as="h2">Register Operator</Card.Title>

            <Form
              onSubmit={(e)=>{
                e.preventDefault()
                e.stopPropagation()
                if (e.currentTarget.checkValidity() === false) return
                handleSignUp()
              }}>
              <FormInputRow form={form} setForm={setForm} errors={formErrors} type="input" field="name" label="Name" />

              {process.env.REACT_APP_RECAPTCHA_SITE_KEY &&
              <ReCAPTCHA
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || ""}
                onChange={onRecaptchaChange}
              />}
              <AsyncButton
                type="submit"
                className="w-100 mb-3 mt-2"
                variant="success"
                loading={!!form.loading}
              >Sign Up</AsyncButton>
              {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, error:'' }) }} />}
s            </Form>
            </>
      }
      </Card.Body>
    </Card>
  </>)
}

export default SignUp;
