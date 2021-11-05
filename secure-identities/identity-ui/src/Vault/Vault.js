import React, { useState } from "react";
import { Button } from 'react-bootstrap';
import history from './../history';
import axios from 'axios';
import "./Vault.css";
import { setUserSession } from '../Utils/Common';

export default function Vault(){
  const [loading,setLoading] = useState(false);
  const username = useFormInput('')
  const password = useFormInput('')
  const [error,setError] = useState(null)

  const handleLogin = () => {
    setError(null);
    setLoading(true);
    axios.post('http://localhost:9090/api/v1/token',{},{headers: { username: username.value, password: password.value }}).then(response => {
      setLoading(false)
      setUserSession(response.data.token,username)
      history.push('/');
    }).catch(error => {
      setLoading(false);
      if (error.response.status === 401 ) setError(error.response.data.message);
      else setError("Something went wrong. Please try again later.");
    });
  }

  return (
    <div className="Vault">
      <div className="lander">
        <h1>Vault Authorization</h1>
        <form>
        <div> Username <input type="text" {...username} autoComplete="new-username" /></div>
        <div> Password <input type="text" {...password} autoComplete="new-password" /></div>
        {error && <><small style={{ color: 'red' }}>{error}</small><br /></>}<br />
        <Button variant="btn btn-success" value={loading ? 'Loading...' : 'Login'} onClick={handleLogin} disabled={loading}>Authorize</Button>
        </form>
      </div>
    </div>
  );
}


const useFormInput = initialValue => {
  const [value, setValue] = useState(initialValue);

  const handleChange = e => {
    setValue(e.target.value);
  }
  return {
    value,
    onChange: handleChange
  }
}