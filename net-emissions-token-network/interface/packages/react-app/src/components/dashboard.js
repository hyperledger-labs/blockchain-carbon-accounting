import React, { useState, useEffect } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

export default function Dashboard({ provider }) {

  const [roles, setRoles] = useState("");
  const [fetchingRoles, setFetchingRoles] = useState(false);

  async function getRoles(w3provider) {
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let roles_result;
    try {
      roles_result = await contract.getRoles(
        // w3provider.address,
        "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      );
    } catch (error) {
        roles_result = error.message;
    }
    console.log(roles_result)
    setRoles(roles_result);
    setFetchingRoles(false);
  }

  function xOrCheck(value) {
    if (value) {
      return <span className="text-success">✔</span>;
    } else {
      return <span className="text-danger">✖</span>;
    }
  }

  useEffect(() => {

    if (provider && !roles && !fetchingRoles) {
      setFetchingRoles(true);
      getRoles(provider);
    }
    
  }, [provider])


  return (
    <>
      <h2>Dashboard</h2>
      <Row>
        <Col>
          <h4>Roles</h4>
          {/*<Button variant="primary" onClick={() => getRoles(provider)}>
            get roles
          </Button>*/}
          <p>{roles}</p>
          {roles && 
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
          }
        </Col>
        <Col><h4>Your balances</h4></Col>
        <Col><h4>Issued tokens</h4></Col>
      </Row>
    </>
  );
}