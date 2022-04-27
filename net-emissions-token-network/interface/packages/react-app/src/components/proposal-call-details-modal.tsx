// SPDX-License-Identifier: Apache-2.0
import { FC, useState, useEffect } from "react";

import { decodeParameters } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { TOKEN_TYPES } from "./static-data";
import DisplayDate from "./display-date";
import DisplayTokenAmount from "./display-token-amount";
import DisplayJSON from "./display-json";


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
  quantity: number
  fromDate?: Date
  thruDate?: Date
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
        setDecoded({
          address: decodedCall[0],
          proposer: decodedCall[1],
          tokenType: TOKEN_TYPES[decodedCall[2]-1],
          quantity: qty,
          fromDate: decodedCall[4].toNumber(),
          thruDate: decodedCall[5].toNumber(),
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
            <p className="text-muted">{props.actions.signatures}</p>
          </Form.Group>
          <Form.Group>
            <p>Function parameters</p>
            <div className="text-muted">
              {decoded && <>
                <p>Address to issue to: {decoded.address}</p>
                <p>Issuer/proposer: {decoded.proposer}</p>
                <p>Token type: {decoded.tokenType}</p>
                <p>Quantity of tokens: <DisplayTokenAmount amount={decoded.quantity}/></p>
                <p>From date: <DisplayDate date={decoded.fromDate}/></p>
                <p>Through date: <DisplayDate date={decoded.thruDate}/></p>
                <p>Metadata: <DisplayJSON json={decoded.metadata}/></p>
                <p>Manifest: <DisplayJSON json={decoded.manifest}/></p>
                <p>Description: {decoded.description}</p>
                </>}
            </div>
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
