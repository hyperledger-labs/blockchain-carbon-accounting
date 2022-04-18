// SPDX-License-Identifier: Apache-2.0
import { FC } from "react";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

type SubmissionModalProps = {
  title: string
  show: boolean
  body: string
  onHide: ()=>void
}
const SubmissionModal:FC<SubmissionModalProps> = (props) => {

  return (
    <Modal
      {...props}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {props.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
          {props.body === ""
          ? <>
              <div className="text-center mt-3">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            </>
          : <p>{props.body}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}


export default SubmissionModal;
