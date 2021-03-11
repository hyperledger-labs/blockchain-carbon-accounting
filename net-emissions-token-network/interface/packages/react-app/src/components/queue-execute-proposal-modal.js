// SPDX-License-Identifier: Apache-2.0
import React, { useState } from "react";

import { addresses } from "@project/contracts";

import { queue, execute, cancel } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

// Renders appropriate button (queue, execute, or cancel)
function ActionButton(props) {
  switch (props.type) {
    case "queue":
      return <Button variant="warning" onClick={props.onClick}>Queue</Button>;
    case "execute":
      return <Button variant="success" onClick={props.onClick}>Execute</Button>;
    case "cancel":
      return <Button variant="danger" onClick={props.onClick}>Cancel proposal</Button>;
    default:
      console.error("Invalid action type");
      return <>Invalid action type</>;
  }
}

// Renders appropriate description
function ActionDescription(props) {
  switch (props.type) {
    case "queue":
      return <p>Queue a proposal. A proposal must have <b>succeeded</b> in order to be queued by a DAO token holder.</p>
    case "execute":
      return <p>Execute a proposal. A proposal must be <b>queued</b> before being executed by a DAO token holder.</p>
    case "cancel":
      return <p>Cancel an active proposal.</p>
    default:
      return <></>
  }
}

// Renders appropriate title
function ActionTitle(props) {
  switch (props.type) {
    case "queue":
      return "Queue a proposal for execution";
    case "execute":
      return "Execute a queued proposal";
    case "cancel":
      return "Cancel an active proposal";
    default:
      return <></>;
  }
}


export default function QueueExecuteProposalModal(props) {

  const [proposalId, setProposalId] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAction() {
    switch (props.type) {
      case "queue":
        submitQueue();
        break;
      case "execute":
        submitExecute();
        break;
      case "cancel":
        submitCancel();
        break;
      default:
        console.error("Invalid action type");
    }
    return;
  }

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

   async function submitCancel() {
    setIsSubmitting(true);
    let newResult;
    try {
      let executeCall = await cancel(
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
          <ActionTitle type={props.type}></ActionTitle>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <ActionDescription type={props.type}></ActionDescription>

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
        <ActionButton
          type={props.type}
          proposalId={proposalId}
          provider={props.provider}
          onClick={handleAction}
        />

      </Modal.Footer>
    </Modal>
  );
}
