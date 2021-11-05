import React,{useState}  from "react";
import { Button } from 'react-bootstrap';
import history from './../history';
import axios from 'axios';
import "./Home.css";

import { getToken, getUser, removeUserSession, setUserSession } from '../Utils/Common';

export default function Home(){
  const [authLoading, setAuthLoading] = useState(true);


  const token = getToken()
  if (token){
     axios.get('http://localhost:9090/api/v1/token',{headers: {Authorization : `Bearer ${token}`}})
     .then(res=>{
       setAuthLoading(false);
       setUserSession(token,res.data)
     }).catch(error =>{
       removeUserSession();
       setAuthLoading(false);
     })
  }

  const logout = ()=>{
    axios.delete('http://localhost:9090/api/v1/token',{headers: {Authorization : `Bearer ${token}`}})
    .then(resp=>{
        removeUserSession()
        history.push('/')
    }).catch(error=>{
        removeUserSession()
        history.push('/')
    })
  }

  if (authLoading && getToken()) {
    return <div className="content">Checking Authentication...</div>
  }

  if (!authLoading && getToken()){
    const tokenDetails = getUser()
    return(
      <div className="Home">
      <div className="lander">
        <h1>Authorized</h1>
        <form>
          <div> Username <input type="text" value={tokenDetails.username}/></div><br/>
          <div> Issue Time <input type="text" value={tokenDetails.issue_time}/></div><br/>
          <div> Expiry Time <input type="text" value={tokenDetails.expire_time}/></div><br/>
          <Button variant="btn btn-success" onClick={logout}>Sign Out</Button>
        </form>
      </div>
      </div>

    )
  }

  return (
    <div className="Home">
      <div className="lander">
        <h1>Secure Identity</h1>
        <form>
          <Button variant="btn btn-success" onClick={() => history.push('/Vault')}>Vault Authorization</Button>
        </form>
      </div>
    </div>
  );
}