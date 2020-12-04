import React, { useState } from "react";

import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";

import Button from 'react-bootstrap/Button';

export function GreeterTest({ provider }) {

  const [greeting, setGreeting] = useState("");

  async function getGreeting(w3provider) {
    let contract = new Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", abis.greeter.abi, w3provider);
    let greeting_result = await contract.greet();
    setGreeting(greeting_result.toString());
  }

  return (
    <>
      <Button onClick={() => getGreeting(provider)}>
        Return greeting
      </Button>
      <p className="mt-2">{greeting}</p>
    </>
  );
}