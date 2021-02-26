import React, { useState } from "react";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

export default function CreateProposalModal(props) {

  const [calldata, setCalldata] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    
  }

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
        
        <p>Create a proposal to <b>issue tokens</b> from the DAO. 400,000 tokens or 4% of the DAO token supply is required to submit a proposal.</p>

        <Form>
          <Form.Group>
            <Form.Label>Calldata</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="" />
            <Form.Text className="text-muted">
              Go to the issue page and fill out the form. Click the "copy calldata" button and paste it here.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={2} />
          </Form.Group>
        </Form>



      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
        <Button variant="success" onClick={submit}>Submit proposal</Button>
      </Modal.Footer>
    </Modal>
  );
}
