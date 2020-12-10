import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export function RegisterConsumerForm({ provider }) {

  const [address, setAddress] = useState("");
  const [result, setResult] = useState("");

  function onAddressChange(event) { setAddress(event.target.value); };

  async function register(w3provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = await contract.connect(signer);
    let registerConsumer_result;
    try {
      let registerConsumer_result_raw = await signed.registerConsumer(
        address
      );
      registerConsumer_result = registerConsumer_result_raw.message;
    } catch (error) {
      console.error("Error calling registerConsumer()")
      registerConsumer_result = error.message;
    }
    console.log(registerConsumer_result)
    setResult(registerConsumer_result.toString());
  }

  async function unregister(w3provider) {
    let signer = w3provider.getSigner();
    let contract = new Contract(addresses.tokenNetwork, abis.netEmissionsTokenNetwork.abi, w3provider);
    let signed = await contract.connect(signer);
    let unregisterConsumer_result;
    try {
      let registerConsumer_result_raw = await signed.unregisterConsumer(
        address
      );
      unregisterConsumer_result = registerConsumer_result_raw.message;
    } catch (error) {
      console.error("Error calling registerConsumer()")
      unregisterConsumer_result = error.message;
    }
    console.log(unregisterConsumer_result)
    setResult(unregisterConsumer_result.toString());
  }

  return (
    <>
      <h2>Register/unregister consumer</h2>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
      </Form.Group>
      <Row>
        <Col>
          <Button variant="success" size="lg" block onClick={() => register(provider)}>
            Register
          </Button>
        </Col>
        <Col>
          <Button variant="danger" size="lg" block onClick={() => unregister(provider)}>
            Unregister
          </Button>
        </Col>
      </Row>
      {result &&
        <>
          <hr/>
          <h5>Result:</h5>
          <pre className="pre-scrollable" style={{"whiteSpace": "pre-wrap"}}>
            <code>
              {result}
            </code>
          </pre>
        </>
      }
    </>
  );
}
