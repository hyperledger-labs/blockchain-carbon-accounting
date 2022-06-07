// SPDX-License-Identifier: Apache-2.0
import { addresses } from "@blockchain-carbon-accounting/contracts";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { getErrorMessage, propose } from "../services/contract-functions";

type CreateProposalModalProps = {
  provider?:Web3Provider | JsonRpcProvider
  show:boolean
  title:string
  token:number
  calldata:string
  description:string
  onHide:()=>void
}

const CreateProposalModal:FC<CreateProposalModalProps> = (props) => {

  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalAttributes, setProposalAttributes] = useState<{description:string}[]>([]);

  async function submit() {
    if (!props.provider) return;
    setIsSubmitting(true);
    let newResult: string;
    try {

      let args = {
        targets: [ addresses.tokenNetwork.address ],
        values: [ 0 ],
        signatures: [ "issueOnBehalf(address,uint160,uint8,uint256,uint256,uint256,string,string,string)" ],
        calldata: [ props.calldata ],
        description: [ description ]
      }
      if (proposalAttributes.length) {
        // except for the description, it doesn't really matter what we put here since child proposals are never executed
        // this must be an array for multi but not for single propose call
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
      newResult = getErrorMessage(e);
    }
    setIsSubmitting(false);
    setResult(newResult);
  }

  const onDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setDescription(event.target.value); }, []);

  const createProposalAttributes = useCallback((desc: string[]) => {
    const newAttrs = desc.map(e => {
      return {description: e};
    });
    setProposalAttributes(attrs=>[...attrs, ...newAttrs]);
  }, []);

  useEffect(() => {
    setDescription(props.description);
  }, [props.description]);

  useEffect(() => {
    // preset some attributes
    console.log("props.token", props.token);
    if (props.token === 2) {
      createProposalAttributes([
        "Real",
        "Additional",
        "Realistic Baselines",
        "Permanent",
        "Adequate Leakage Accounting",
      ]);
    } else {
      setProposalAttributes([]);
    }
  }, [props.token, createProposalAttributes]);

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

        <p>Create a proposal to <b>issue tokens</b> from the DAO. If it passes through a vote of the DAO token holders, it can be queued and executed to issue new tokens to any registered consumer. 400,000 tokens or 4% of the DAO token supply is required to submit a proposal. Only one active proposal is allowed per user. Proposals, votes, DAO token balance, and delegates can be viewed on the Governance page.</p>
        <p><small>Be sure to double-check all form inputs before submitting! You can cancel proposals but it costs gas.</small></p>

        <Form>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={2} placeholder="Describe the purpose of this proposal..." value={description} onChange={onDescriptionChange} />
          </Form.Group>

          <Form.Group>
            <Form.Label>Calldata</Form.Label>
            <Form.Control as="textarea" disabled rows={3} value={props.calldata} />
            <Form.Text className="text-muted">This is the encoded data of the issue contract call. Don't worry about this unless you're calling the Governor contract manually.</Form.Text>
          </Form.Group>
        </Form>

        { (isSubmitting) &&
          <div className="text-center mt-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
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

export default CreateProposalModal;
