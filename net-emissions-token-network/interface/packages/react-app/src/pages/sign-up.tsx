import { useState, ChangeEventHandler } from "react";
import { Link } from "wouter"
import { Form, Button } from "react-bootstrap";

import SubmissionModal from "../components/submission-modal";
import { signUpUser } from "../services/api.service";

function SignUp() {

  const [modalShow, setModalShow] = useState(false);

  const [mailAddress, setMailAddress] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [result, setResult] = useState<string>("");

  // After initial onFocus for sing-up inputs, display red outline if invalid
  const [initializedMailInput, setInitializedMailInput] = useState(false);
  const [initializedPasswordInput, setInitializedPasswordInput] = useState(false);

  const onEmailChange: ChangeEventHandler<HTMLInputElement> = (event) => { setMailAddress(event.target.value); };
  const onPasswordChange: ChangeEventHandler<HTMLInputElement> = (event) => { setPassword(event.target.value); };

  function handleSignUp() {
    fetchSignUp();
    setModalShow(true);
  }

  async function fetchSignUp() {
    const rslt = await signUpUser(mailAddress, password);
    if (rslt) {
      //wallet connect
      console.log('rslt for api call-signup', rslt);
      setResult("Successfully, Registered your wallet");
    } else {
      setResult("Oops, Failed to Sign Up");
    }
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return (<>
    <SubmissionModal
      show={modalShow}
      title="Sign Up"
      body={result}
      onHide={() => { setModalShow(false); setResult("") }}
    />
    <div className="d-flex justify-content-start flex-column align-items-left">
      <h2>Sign Up</h2>
      <p>Enter your email and password, then your wallet is generated</p>
      <Form.Group className="mb-3" controlId="quantityInput">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="input"
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

      <Button className="w-100 mb-3" variant="success" size="lg" onClick={handleSignUp}>Sign Up</Button>
      <p>If you already have an account, you can sign in here <Link href="/sign-in">SignIn</Link></p>

    </div>
  </>)
}

export default SignUp;
