import React from "react";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { FaCoins } from 'react-icons/fa';

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

        <Row className="mt-2 mb-4">

          {/* token ID, icon, and type */}
          <Col className="col-3 offset-3">
            <Row className="text-center">
              <Col><h3 className="mb-1 mt-2">ID: {props.token.tokenId}</h3></Col>
            </Row>
            <Row className="text-center">
              <Col><h1 className="display-4"><FaCoins/></h1></Col>
            </Row>
            <Row className="text-center mt-1">
              <Col><small className="text-secondary text-uppercase">{props.token.tokenType}</small></Col>
            </Row>
          </Col>

          {/* Available and retired balances */}
          <Col className="col-6">
            <h5 className="text-secondary">Available Balance</h5>
            <h1>{props.token.availableBalance}</h1>
            <h5 className="text-secondary">Retired Balance</h5>
            <h2>{props.token.retiredBalance}</h2>
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
              <td className="text-monospace">{props.token.issuer}</td>
            </tr>
            <tr>
              <td>Issuee</td>
              <td className="text-monospace">{props.token.issuee}</td>
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
              <td className="text-monospace" style={{"wordWrap": "anywhere"}}>{props.token.metadata}</td>
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
