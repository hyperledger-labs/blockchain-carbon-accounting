import React, { useState } from "react";

import { addresses } from "@project/contracts";

import { queue, execute } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

export default function QueueExecuteProposalModal(props) {

  const [proposalId, setProposalId] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitQueue() {
    setIsSubmitting(true);
    let newResult;
    try {
      let queueCall = await queue(
        props.provider,
        proposalId
      );
      newResult = queueCall.toString()
    } catch (e) {
      newResult = e.message;
    }
    setIsSubmitting(false);
    setResult(newResult);
  }

  async function submitExecute() {
    setIsSubmitting(true);
    let newResult;
    try {
      let executeCall = await execute(
        props.provider,
        proposalId
      );
      newResult = executeCall.toString()
    } catch (e) {
      newResult = e.message;
    }
    setIsSubmitting(false);
    setResult(newResult);
  }

  function onProposalIdChange(event) { setProposalId(event.target.value); };

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
        
        <p>Queue or execute a proposal. A proposal must have <b>succeeded</b> in order to be queued, and must be <b>queued</b> before being executed.</p>

        <Form>
          <Form.Group>
            <Form.Label>Proposal ID</Form.Label>
            <Form.Control type="text" placeholder="ID # of the proposal..." onChange={onProposalIdChange} />
          </Form.Group>
        </Form>

        { (isSubmitting) &&
          <div className="text-center mt-3">
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        }

        { (result) &&
          <p className="mt-3">{result}</p>
        }

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
        <Button variant="warning" onClick={submitQueue}>Queue</Button>
        <Button variant="danger" onClick={submitExecute}>Execute</Button>
      </Modal.Footer>
    </Modal>
  );
}
