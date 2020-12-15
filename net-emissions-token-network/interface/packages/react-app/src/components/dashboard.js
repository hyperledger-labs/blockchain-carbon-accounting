import React, { useState, useEffect } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function Dashboard({ provider }) {

  const [isOwner, setIsOwner] = useState("");

  useEffect(() => {

    // async function fetchIsOwner() {
    //   console.log("fetchIsOwner() called")
    //   let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, provider);
    //   let isOwner_result;
    //   try {
    //     let isOwner_result_raw = await contract.isOwner();
    //     isOwner_result = isOwner_result_raw.message;
    //   } catch (error) {
    //     console.error("Error calling isOwner()")
    //     isOwner_result = error.message;
    //   }
    //   console.log(isOwner_result)
    //   setIsOwner(isOwner_result.toString());
    // }

    // if (provider) {
    //   fetchIsOwner();
    // }
    
  }, [])


  return (
    <>
      <h2>Dashboard</h2>
      <Row>
        <Col><h4>Role</h4><p>Contract owner</p></Col>
        <Col><h4>Your balances</h4></Col>
        <Col><h4>Issued tokens</h4></Col>
      </Row>
    </>
  );
}