import React, { useState, useEffect } from "react";

import { decodeParameters, TOKEN_TYPES } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export default function ProposalCallDetailsModal(props) {

  const [ decoded,setDecoded] = useState({});

  useEffect(() => {
    async function fetchDecodedParameters(actionNumber) {
      let regExp = /\(([^)]+)\)/;
      let types = (regExp.exec(props.actions.signatures[actionNumber]))[1].split(",");
      let decodedCall = await decodeParameters(types, props.actions.calldatas[actionNumber]);
      // Format unix times to Date objects
      let fromDateObj = new Date((decodedCall[3].toNumber()) * 1000);
      let thruDateObj = new Date((decodedCall[4].toNumber()) * 1000);
      let automaticRetireDateObj = new Date((decodedCall[5].toNumber()) * 1000);
      setDecoded({
        address: decodedCall[0],
        tokenType: TOKEN_TYPES[decodedCall[1]],
        quantity: decodedCall[2].toNumber(),
        fromDate: fromDateObj.toLocaleString(),
        thruDate: thruDateObj.toLocaleString(),
        automaticRetireDate: automaticRetireDateObj.toLocaleString(),
        metadata: decodedCall[6],
        manifest: decodedCall[7],
        description: decodedCall[8],
      });
    }
    fetchDecodedParameters(0);
  }, [props.actions.signatures, props.actions.calldatas]);

  return (
    <Modal
      {...props}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {props.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <p>If passed, this is the contract call that the DAO will make when the proposal is queued and executed.</p>

        <Form>
          {/* <Form.Group> */}
          {/*   <Form.Label>Target</Form.Label> */}
          {/*   <Form.Text>{props.actions.targets}</Form.Text> */}
          {/* </Form.Group> */}
          <Form.Group>
            <Form.Label>Function signature</Form.Label>
            <Form.Text>{props.actions.signatures}</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Function parameters</Form.Label>
            <Form.Text>Address to issue to: {decoded.address}</Form.Text>
            <Form.Text>Token type: {decoded.tokenType}</Form.Text>
            <Form.Text>Quantity of tokens: {decoded.quantity}</Form.Text>
            <Form.Text>From date: {decoded.fromDate}</Form.Text>
            <Form.Text>Through date: {decoded.thruDate}</Form.Text>
            <Form.Text>Automatic retire date: {decoded.automaticRetireDate}</Form.Text>
            <Form.Text>Metadata: {decoded.metadata}</Form.Text>
            <Form.Text>Manifest: {decoded.manifest}</Form.Text>
            <Form.Text>Description: {decoded.description}</Form.Text>
          </Form.Group>
        </Form>

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
