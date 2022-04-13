// SPDX-License-Identifier: Apache-2.0
import { FC, useState, useEffect } from "react";

import { decodeParameters, formatDate } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { TOKEN_TYPES } from "./static-data";


type ProposalCallDetailsModalProps = {
  title: string
  actions: any
  show: boolean
  onHide: ()=>void
}

type Decoded = {
  address: string
  proposer: string
  tokenType: string
  quantity: string
  fromDate: string
  thruDate: string
  metadata: string
  manifest: string
  description: string
}

const ProposalCallDetailsModal: FC<ProposalCallDetailsModalProps> = (props) => {

  const [decoded,setDecoded] = useState<Decoded|null>(null);

  useEffect(() => {
    async function fetchDecodedParameters(actionNumber: number) {
      let regExp = /\(([^)]+)\)/;
      console.log('*** fetchDecodedParameters', actionNumber, props.actions.signatures);
      let sigs = props.actions.signatures[actionNumber];
      if (sigs.length) {
        const rx = regExp.exec(sigs);
        if (!rx) return;
        let types = rx[1].split(",");
        let decodedCall = decodeParameters(types, props.actions.calldatas[actionNumber]);
        let qty = decodedCall[3].toNumber();
        qty = (qty / 1000).toFixed(3);
        setDecoded({
          address: decodedCall[0],
          proposer: decodedCall[1],
          tokenType: TOKEN_TYPES[decodedCall[2]-1],
          quantity: qty,
          fromDate: formatDate(decodedCall[4].toNumber()),
          thruDate: formatDate(decodedCall[5].toNumber()),
          metadata: decodedCall[7],
          manifest: decodedCall[8],
          description: decodedCall[9],
        });
      }
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
            {decoded && <>
            <Form.Text>Address to issue to: {decoded.address}</Form.Text>
            <Form.Text>Issuer/proposer: {decoded.proposer}</Form.Text>
            <Form.Text>Token type: {decoded.tokenType}</Form.Text>
            <Form.Text>Quantity of tokens: {decoded.quantity}</Form.Text>
            <Form.Text>From date: {decoded.fromDate}</Form.Text>
            <Form.Text>Through date: {decoded.thruDate}</Form.Text>
            <Form.Text>Metadata: {decoded.metadata}</Form.Text>
            <Form.Text>Manifest: {decoded.manifest}</Form.Text>
            <Form.Text>Description: {decoded.description}</Form.Text>
            </>}
          </Form.Group>
        </Form>

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}


export default ProposalCallDetailsModal;
