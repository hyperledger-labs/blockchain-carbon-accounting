// SPDX-License-Identifier: Apache-2.0
import { ChangeEventHandler, FC, useState } from "react";

import { delegate, getErrorMessage } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";

type DelegateDaoTokensModalProps = {
  show: boolean
  provider?: Web3Provider | JsonRpcProvider
  title: string
  balance: string
  onHide: ()=>void
}

const DelegateDaoTokensModal: FC<DelegateDaoTokensModalProps> = (props) => {

  const [delegatee, setDelegatee] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

   async function submitDelegate() {
    if (!props.provider) return;
    setIsSubmitting(true);
    let newResult;
    try {
      let delegateCall = await delegate(
        props.provider,
        delegatee
      );
      newResult = delegateCall.toString()
    } catch (e) {
      newResult = getErrorMessage(e);
    }
    setIsSubmitting(false);
    setResult(newResult);
  }

  const onDelegateeChange: ChangeEventHandler<HTMLInputElement> = (event) => { setDelegatee(event.target.value) }

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

        <p>Delegate your vote to an address using your DAO token balance of <span className="text-success">{props.balance}</span> as your voting power. Must be a registered consumer, and you can delegate to yourself.</p>

        <Form>
          <Form.Group>
            <Form.Label>Delegatee</Form.Label>
            <Form.Control type="text" placeholder="0x000..." onChange={onDelegateeChange} />
            <Form.Text className="text-muted">
              Please check to make sure the delegatee address is a registered consumer.
            </Form.Text>
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
        <Button
          onClick={submitDelegate}
          variant="success"
        >
          Delegate
        </Button>

      </Modal.Footer>
    </Modal>
  );
}


export default DelegateDaoTokensModal;
