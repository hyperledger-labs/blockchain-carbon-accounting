// SPDX-License-Identifier: Apache-2.0
import { addresses } from "@project/contracts";
import React, { createRef, useCallback, useEffect, useRef, useState } from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { propose } from "../services/contract-functions";




export default function CreateProposalModal(props) {

  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalAttributes, setProposalAttributes] = useState([]);
  const proposalAttributeRefs = useRef([]);

  async function submit() {
    setIsSubmitting(true);
    let newResult;
    try {

      let args = {
        targets: [ addresses.tokenNetwork.address ],
        values: [ 0 ],
        signatures: [ "issueOnBehalf(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)" ],
        calldata: [ props.calldata ],
        description: description
      }
      if (proposalAttributes.length) {
        // except for the description, it doesn't really matter what we put here since child proposals are never executed
        // this must be an array for multi but not for single propose call
        args.description = [args.description];
        proposalAttributes.forEach((e) => {
          args.targets.push("0x0000000000000000000000000000000000000000"); // contract to call
          args.values.push(0); // number of wei sent with call, i.e. msg.value
          args.signatures.push(""); // function in contract to call
          args.calldata.push("0x");
          args.description.push(e.description); // description of child proposal
        });
      }
      let proposeCall = await propose(
        props.provider,
        args.targets,
        args.values,
        args.signatures,
        args.calldata,
        args.description
      );
      newResult = proposeCall.toString()
    } catch (e) {
      console.error(e);
      newResult = e.message;
    }
    setIsSubmitting(false);
    setResult(newResult);
  }

  const onDescriptionChange = useCallback((event) => { setDescription(event.target.value); }, []);

  const createProposalAttributes = useCallback((desc) => {
    console.log('useCallback createProposalAttributes...');
    const newAttrs = [...proposalAttributes];
    desc.forEach(e => {
      newAttrs.push({description: e});
    })
    setProposalAttributes(newAttrs);
    proposalAttributeRefs.current = newAttrs.map((_, i) => proposalAttributeRefs.current[i] ? proposalAttributeRefs.current[i] : createRef());
  }, [setProposalAttributes]);

  const addProposalAttribute = useCallback(() => {
    console.log('useCallback addProposalAttribute...');
    createProposalAttributes(['']);
    setTimeout(() => {
      proposalAttributeRefs.current[proposalAttributeRefs.current.length-1].current.focus();
    }, 0);
  }, [createProposalAttributes]);

  const updateProposalAtIndex = useCallback((e, i) => {
    console.log('useCallback updateProposalAtIndex...');
    const newAttrs = [...proposalAttributes];
    newAttrs[i].description = e.target.value;
    setProposalAttributes(newAttrs);
  }, [setProposalAttributes]);

  const removeProposalAttribute = useCallback((i) => {
    console.log('useCallback removeProposalAttribute...');
    if (i > proposalAttributes.length) return;
    setProposalAttributes(attrs => attrs.slice(0, i).concat(attrs.slice(i + 1, attrs.length)));
    proposalAttributeRefs.current = proposalAttributes.map((_, x) => proposalAttributeRefs.current[x] ? proposalAttributeRefs.current[x] : createRef());
  }, [setProposalAttributes]);

  useEffect(() => {
    console.log('useEffect props.description...');
    setDescription(props.description);
  }, [props.description]);

  useEffect(() => {
    console.log('useEffect props.token ?...', props.token);
    // preset some attributes
    if (props.token === 2 || props.token === "2") {
      createProposalAttributes([
        "Real",
        "Additional",
        "Realistic Baselines",
        "Permanent",
        "Adequate Leakage Accounting",
      ]);
    } else {
      setProposalAttributes([]);
      proposalAttributeRefs.current = [];
    }
  }, [props.token]);

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

        <p>Create a proposal to <b>issue tokens</b> from the DAO. If it passes through a vote of the DAO token holders, it can be queued and executed to issue new tokens to any registered consumer. 400,000 tokens or 4% of the DAO token supply is required to submit a proposal. Only one active proposal is allowed per user. Proposals, votes, DAO token balance, and delgates can be viewed on the Governance page.</p>
        <p><small>Be sure to double-check all form inputs before submitting! You can cancel proposals but it costs gas.</small></p>

        <Form>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={2} placeholder="Describe the purpose of this proposal..." value={description} onChange={onDescriptionChange} />
          </Form.Group>

          {(proposalAttributes !== []) &&
            proposalAttributes.map((proposalAttribute, i) => (
              <Form.Group key={i}>
                <Button className="mb-3 float-right" variant="danger" size="sm" onClick={() => removeProposalAttribute(i)}>Remove</Button>
                <Form.Label>Attribute</Form.Label>
                <Form.Control ref={proposalAttributeRefs.current[i]} as="textarea" placeholder="The proposal attribute description" value={proposalAttribute.description} onChange={e=>updateProposalAtIndex(e,i)} />
              </Form.Group>
            ))
          }

          <Button className="mb-3 float-right" variant="success" size="sm" onClick={() => addProposalAttribute()}>Add Attribute</Button>
          <Form.Group>
            <Form.Label>Calldata</Form.Label>
            <Form.Control as="textarea" disabled rows={3} value={props.calldata} />
            <Form.Text className="text-muted">This is the encoded data of the issue contract call. Don't worry about this unless you're calling the Governor contract manually.</Form.Text>
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
        <Button variant="success" onClick={submit}>Submit proposal</Button>
      </Modal.Footer>
    </Modal>
  );
}
