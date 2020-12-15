import React, { useState, useEffect } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export default function Dashboard({ provider, signedInAddress }) {

  const [roles, setRoles] = useState("");
  const [numOfUniqueTokens, setNumOfUniqueTokens] = useState("");
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [fetchingNumOfUniqueTokens, setFetchingNumOfUniqueTokens] = useState(false);

  async function getRoles(w3provider) {
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let roles;
    try {
      roles = await contract.getRoles(
        signedInAddress,
      );
    } catch (error) {
      roles = error.message;
    }
    setRoles(roles);
    setFetchingRoles(false);
  }

  async function getNumOfUniqueTokens(w3provider) {
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let uniqueTokens;
    try {
      uniqueTokens = await contract.getNumOfUniqueTokens();
    } catch (error) {
      uniqueTokens = error.message;
    }
    setNumOfUniqueTokens(parseInt(uniqueTokens._hex, 10));
    setFetchingNumOfUniqueTokens(false);
  }

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
        getRoles(provider);
      }
      if (!numOfUniqueTokens && !fetchingNumOfUniqueTokens) {
        setFetchingNumOfUniqueTokens(true);
        getNumOfUniqueTokens(provider);
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