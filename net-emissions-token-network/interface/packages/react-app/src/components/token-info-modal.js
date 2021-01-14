import React from "react";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function TokenInfoModal(props) {

  return (
    <Modal
      {...props}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Token Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="text-center my-2">
          <Col>
            <h3 className="text-secondary">ID</h3>
            <h1>{props.token.tokenId}</h1>
          </Col>
          <Col>
            <h3 className="text-secondary">Type</h3>
            <h3>{props.token.tokenType}</h3>
          </Col>
          <Col>
            <h3 className="text-secondary">Available Balance</h3>
            <h1>{props.token.availableBalance}</h1>
          </Col>
          <Col>
            <h3 className="text-secondary">Retired</h3>
            <h1>{props.token.retiredBalance}</h1>
          </Col>
        </Row>
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Issuer</td>
              <td>{props.token.issuer}</td>
            </tr>
            <tr>
              <td>Issuee</td>
              <td>{props.token.issuee}</td>
            </tr>
            <tr>
              <td>From date</td>
              <td>{props.token.fromDate}</td>
            </tr>
            <tr>
              <td>Through date</td>
              <td>{props.token.thruDate}</td>
            </tr>
            <tr>
              <td>Automatic retire date</td>
              <td>{props.token.automaticRetireDate}</td>
            </tr>
            <tr>
              <td>Metadata</td>
              <td>{props.token.metadata}</td>
            </tr>
            <tr>
              <td>Manifest</td>
              <td>{props.token.manifest}</td>
            </tr>
            <tr>
              <td>Description</td>
              <td>{props.token.description}</td>
            </tr>
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
