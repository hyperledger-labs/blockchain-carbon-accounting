import { FC, useState, ChangeEventHandler } from "react";
import { Link, useLocation } from "wouter";
import { Form, Button } from "react-bootstrap"

import SubmissionModal from "../components/submission-modal";
import { signInUser } from '../services/api.service';

type SignInProps = {
  loadWalletInfo: (publick_key: string, private_key: string) => void
}
const SignIn: FC<SignInProps> = ({ loadWalletInfo }) => {

  const [modalShow, setModalShow] = useState(false);
  const [, setLocation] = useLocation();

  const [mailAddress, setMailAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [result, setResult] = useState<string>("");

  // After initial onFocus for sing-up inputs, display red outline if invalid
  const [initializedMailInput, setInitializedMailInput] = useState(false);
  const [initializedPasswordInput, setInitializedPasswordInput] = useState(false);

  const onEmailChange: ChangeEventHandler<HTMLInputElement> = (event) => { setMailAddress(event.target.value); };
  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPassword(event.target.value); };

  function handleSignIn() {
    fetchSignIn();
  }

  async function fetchSignIn() {
    const rslt = await signInUser(mailAddress, password);
    if (rslt) {
      //wallet connect
      console.log('rslt for api call-signin', rslt);
      if (rslt.address && rslt.private_key) {
        loadWalletInfo(rslt.address, rslt.private_key);
        setLocation('/dashboard');
      }
      setModalShow(true);
      setResult("Unexpected error: No wallet info returned from API");
    } else {
      setModalShow(true);
      setResult("Incorrect mail address or password");
    }
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return (
    <>
      <SubmissionModal
        show={modalShow}
        title="Sign In"
        body={result}
        onHide={() => { setModalShow(false); setResult("") }}
      />
      <div className="d-flex flex-column justify-content-start align-items-left">
        <h2>Sign In</h2>
        <p>Please sign in with your credentials</p>
        <Form onSubmit={(e)=>{
          e.preventDefault()
          e.stopPropagation()
          handleSignIn()
        }}>
          <Form.Group className="mb-3" controlId="quantityInput">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Joe@gmail.com"
              value={mailAddress}
              onChange={onEmailChange}
              onBlur={() => setInitializedMailInput(true)}
              style={(mailAddress || !initializedMailInput) ? {} : inputError}
              />
          </Form.Group>
          <Form.Group className="mb-3" controlId="quantityInput">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={onPasswordChange}
              onBlur={() => setInitializedPasswordInput(true)}
              style={(password || !initializedPasswordInput) ? {} : inputError}
              />
          </Form.Group>
          <Button type="submit" className="w-100 mb-3" variant="success" size="lg">Sign In</Button>
          <p>If you don't have an account, you can signup here <Link href="sign-up">SignUp</Link></p>
        </Form>

      </div>
    </>
  )

}

export default SignIn;
