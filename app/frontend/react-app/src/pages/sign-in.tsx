import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Form, Button, Card } from "react-bootstrap"
import { motion } from 'framer-motion';

import { signInUser, requestPasswordReset, handleFormErrors } from '../services/api.service';
import { FormInputRow } from "../components/forms-util";
import ErrorAlert from "../components/error-alert";
import { useTimer } from "../hooks/useTimer";
import { Wallet } from "../components/static-data";
import AsyncButton from "../components/AsyncButton";


type SignInForm = {
  state: 'signin' | 'reset',
  email: string,
  password: string,
  error: string,
  success: string,
  resetPasswordError: string,
  resetPasswordSuccess: string,
  loading: string
}
type SignInFormErrors = Partial<SignInForm>

const defaultSignInForm: SignInForm = {
  state: 'signin',
  email: "",
  password: "",
  error: "",
  success: "",
  resetPasswordError: "",
  resetPasswordSuccess: "",
  loading: ""
} as const;

type SignInProps = {
  loadWalletInfo: (wallet:Wallet) => void
}
const SignIn: FC<SignInProps> = ({ loadWalletInfo }) => {

  const [currentHeight, setCurrentHeight] = useState<number | string>('auto');
  const [didAnimate, setDidAnimate] = useState(false);
  const [form, setForm] = useState<SignInForm>(defaultSignInForm)
  const [formErrors, setFormErrors] = useState<SignInFormErrors>({})
  const [, setLocation] = useLocation();
  const [timer, timerStarted, startTimer] = useTimer(40);
  const refSignin = useRef<HTMLDivElement>(null);
  const refReset = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    // get the email parameter from the url
    console.log('location', window.location)
    const email = new URL(window.location.href).searchParams.get("email");
    if (email) {
      setForm(prevState => ({...prevState, email }))
    }
  }, [])

  useLayoutEffect(() => {
    const h = (form.state === 'signin' ? refSignin.current : refReset.current)?.scrollHeight || 'auto'
    if (h !== currentHeight) setCurrentHeight(h)
  }, [form, refSignin, refReset, currentHeight])

  async function handleSignIn() {
    try {
      setForm({...form, error:'', loading: 'true'})
      const rslt = await signInUser(form.email, form.password);
      if (rslt) {
        const wallet = rslt.wallet;
        if (wallet.address && wallet.has_private_key_on_server) {
          setForm({
            ...form,
            loading: '',
          });
          loadWalletInfo(wallet);
          // if we had saved emissionsRequest, then redirect to the Request audit page
          const ls = localStorage.getItem('emissionsRequest')
          const fromAudit = localStorage.getItem('fromAudit')
          const stored = ls ? JSON.parse(ls) : []
          if (fromAudit && stored.length > 0) {
            setLocation('/requestAudit')
          } else {
            setLocation('/dashboard')
          }
          return;
        } else if (!wallet.has_private_key_on_server) {
          setForm({
            ...form,
            loading: '',
            error: 'You have already exported your private key and must now login with Metamask'
          });
          return;
        }
      }
      setForm({
        ...form,
        loading: '',
        error: 'Unexpected error: No wallet info returned from API'
      });
    } catch (err) {
      handleFormErrors(err, setFormErrors, setForm);
    }
  }

  async function handleResetPassword() {
    try {
      setForm({...form, resetPasswordSuccess: '', resetPasswordError: '', loading: 'true'})
      await requestPasswordReset(form.email);
      setForm({
        ...form,
        loading: '',
        resetPasswordSuccess: 'true'
      });
      startTimer();
    } catch (err) {
      handleFormErrors(err, setFormErrors, setForm);
    }
  }

  return (
    <>
      <Card style={{ width: '32rem', margin: 'auto', padding: '1rem', overflow: 'hidden' }}>
        <motion.div
          style={{ position: 'relative' }}
          animate={{
            height: currentHeight
          }}
          transition={{ stiffness: 150 }} >

          <motion.div
            key='signin'
            ref={refSignin}
            transition={{ stiffness: 150 }}
            initial={didAnimate ? { x: '-110%' } : false}
            exit={{ x: '-110%' }}
            animate={{ x: form.state === 'signin' ? 0 : '-110%' }}
            onAnimationComplete={()=>{ console.log('signin animation complete') }}
          >
            <Card.Body>
              <Card.Title as="h2">Sign In</Card.Title>
              <p className="mt-4">Please sign in with your credentials.</p>
              <Form onSubmit={(e)=>{
                e.preventDefault()
                e.stopPropagation()
                if (e.currentTarget.checkValidity() === false) return
                handleSignIn()
              }}>
                <FormInputRow form={form} setForm={setForm} errors={formErrors} required type="email" field="email" label="Email" />
                <FormInputRow form={form} setForm={setForm} errors={formErrors} minlength={8} type="password" required field="password" label="Password" />
                <Button variant="link" className="p-0 mb-3" onClick={()=>setForm({...form, state: 'reset', error: ''})}>Forgot your password?</Button>
                <AsyncButton
                    type="submit"
                    className="w-100 mb-3"
                    variant="success"
                    loading={!!form.loading}
                  >Sign In</AsyncButton>
                {form.error && <ErrorAlert error={form.error} onDismiss={()=>{ setForm({ ...form, password: '', error:'' }) }}>
                  {form.error === 'Invalid credentials' && <div>If you just signed up, make sure to valid your email address first.</div>}
                </ErrorAlert>}
                <p className="text-muted">If you don't have an account, you can <Link href="sign-up">Sign Up</Link> here </p>
              </Form>
            </Card.Body>
          </motion.div>

          <motion.div
            style={{ position: 'absolute', top: 0, width: '100%' }}
            key='reset'
            ref={refReset}
            onAnimationComplete={()=>{ setDidAnimate(true) }}
            transition={{ stiffness: 150 }}
            initial={{ x: '110%' }}
            exit={{ x: '110%' }}
            animate={{ x: form.state === 'reset' ? 0 : '110%' }}
          >

            <Card.Body>
              <Card.Title as="h2">Reset Password</Card.Title>
              {form.resetPasswordSuccess ? <>
                <p className="mt-4">Please check your inbox and click on the received link to reset your password.</p>
                <Button variant="link" className="p-0 mb-3" onClick={()=>setForm({...form, state: 'signin'})}>Back to Sign In</Button>
                <p className="mt-4">Did not receive our email? Please wait for a while or try again.</p>
                <AsyncButton
                  className="w-100 mb-3"
                  variant="outline-primary"
                  loading={!!form.loading || (timerStarted && timer > 0)}
                  onClick={()=>setForm({...form, resetPasswordError:'', resetPasswordSuccess:'', email:''})}
                >
                  {!form.loading && timerStarted ? <>Please wait {timer} sec.</> : <>Try again</>}
                </AsyncButton>

                </>
                : <p className="mt-4">Enter the email you registered with to receive password reset instructions.</p>
            }
              {!form.resetPasswordSuccess &&
              <Form
                onSubmit={(e)=>{
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.currentTarget.checkValidity() === false) return
                  handleResetPassword()
                }}>
                <FormInputRow form={form} setForm={setForm} errors={formErrors} required type="email" field="email" label="Email" />
                <Button variant="link" className="p-0 mb-3" onClick={()=>setForm({...form, state: 'signin'})}>Remembered your password?</Button>
                { form.resetPasswordError && <div className="alert alert-danger">{form.resetPasswordError}.</div> }
                <AsyncButton
                    type="submit"
                    className="w-100 mb-3"
                    variant="success"
                    loading={!!form.loading}
                  >
                    Reset Password
                 </AsyncButton>
              </Form>}
            </Card.Body>
          </motion.div>
        </motion.div>
      </Card>
      </>)

}

export default SignIn;
