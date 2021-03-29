// SPDX-License-Identifier: Apache-2.0
import React, { useState, useEffect } from "react";

import { decodeParameters, TOKEN_TYPES, formatDate } from "../services/contract-functions";

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
      setDecoded({
        address: decodedCall[0],
        proposer: decodedCall[1],
        tokenType: TOKEN_TYPES[decodedCall[2]-1],
        quantity: decodedCall[3].toNumber(),
        fromDate: formatDate(decodedCall[4].toNumber()),
        thruDate: formatDate(decodedCall[5].toNumber()),
        automaticRetireDate: formatDate(decodedCall[6].toNumber()),
        metadata: decodedCall[7],
        manifest: decodedCall[8],
        description: decodedCall[9],
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
            <Form.Text>Issuer/proposer: {decoded.proposer}</Form.Text>
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
