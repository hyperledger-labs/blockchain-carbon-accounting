import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export function RegisterConsumerForm({ provider }) {

  const [address, setAddress] = useState("");
  const [result, setResult] = useState("");

  function onAddressChange(event) { setAddress(event.target.value); };

  async function submit(w3provider) {
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

  return (
    <>
      <h2>Register consumer</h2>
      <Form.Group>
        <Form.Label>Address</Form.Label>
        <Form.Control type="input" placeholder="0x000..." value={address} onChange={onAddressChange} />
      </Form.Group>
      <Button variant="primary" size="lg" block onClick={() => submit(provider)}>
        Submit
      </Button>
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
