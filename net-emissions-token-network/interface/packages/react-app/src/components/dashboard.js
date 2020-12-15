import React, { useState, useEffect } from "react";

import { getRoles, getNumOfUniqueTokens } from "../services/contract-functions";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';

export default function Dashboard({ provider, signedInAddress }) {

  async function fetchGetRoles() {
    let result = await getRoles(provider, signedInAddress);
    setRoles(result);
    setFetchingRoles(false);
  }

  async function fetchGetNumOfUniqueTokens() {
    let result = await getNumOfUniqueTokens(provider);
    setNumOfUniqueTokens(parseInt(result._hex, 10));
    setFetchingNumOfUniqueTokens(false);
  }

  const [roles, setRoles] = useState("");
  const [numOfUniqueTokens, setNumOfUniqueTokens] = useState("");
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [fetchingNumOfUniqueTokens, setFetchingNumOfUniqueTokens] = useState(false);

  function xOrCheck(value) {
    if (value) {
      return <span className="text-success">✔</span>;
    } else {
      return <span className="text-danger">✖</span>;
    }
  }

  useEffect(() => {

    if (provider && signedInAddress) {
      if (!roles && !fetchingRoles) {
        setFetchingRoles(true);
        fetchGetRoles();
      }
      if (!numOfUniqueTokens && !fetchingNumOfUniqueTokens) {
        setFetchingNumOfUniqueTokens(true);
        fetchGetNumOfUniqueTokens();
      }
    }
    
  }, [signedInAddress])


  return (
    <>
      <h2>Dashboard</h2>
      <Row>
        <Col>
          <h4>Roles</h4>
          <p>{roles}</p>
          {roles ? 
            <table className="table-borderless">
              <tbody>
                <tr>
                  <td><small>Owner</small></td>
                  <td>{xOrCheck(roles[0])}</td>
                </tr>
                <tr>
                  <td><small>Renewable Energy Certificate Dealer</small></td>
                  <td>{xOrCheck(roles[1])}</td>
                </tr>
                <tr>
                  <td><small>Carbon Emissions Offset Dealer</small></td>
                  <td>{xOrCheck(roles[2])}</td>
                </tr>
                <tr>
                  <td><small>Audited Emissions</small></td>
                  <td>{xOrCheck(roles[3])}</td>
                </tr>
                <tr>
                  <td><small>Consumer</small></td>
                  <td>{xOrCheck(roles[4])}</td>
                </tr>
              </tbody>
            </table>
            : 
            <div className="text-center mt-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          }
        </Col>
        <Col>
          <h4>Your balances</h4>
          <p>Number of unique tokens:</p>
          <p>{numOfUniqueTokens}</p>
        </Col>
        <Col><h4>Issued tokens</h4></Col>
      </Row>
    </>
  );
}