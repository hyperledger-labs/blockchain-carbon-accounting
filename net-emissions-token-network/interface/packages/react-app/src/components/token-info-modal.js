import React, { useState, useEffect } from "react";

import { getTokenDetails } from "../services/contract-functions";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function TokenInfoModal(props) {

  const [tokenDetails, setTokenDetails] = useState({});
  const [fetchingTokenDetails, setFetchingTokenDetails] = useState(false);

  async function fetchTokenDetails() {
    // Fetch raw token details
    let details_raw = await getTokenDetails(props.provider, props.token.id);

    // Format unix times to Date objects
    let fromDateObj = new Date((details_raw.fromDate.toNumber()) * 1000);
    let thruDateObj = new Date((details_raw.thruDate.toNumber()) * 1000);
    let automaticRetireDateObj = new Date((details_raw.automaticRetireDate.toNumber()) * 1000);

    let details = {
      tokenId: details_raw.tokenId,
      issuer: details_raw.issuer,
      issuee: details_raw.issuee,
      fromDate: fromDateObj.toLocaleString(),
      thruDate: thruDateObj.toLocaleString(),
      automaticRetireDate: automaticRetireDateObj.toLocaleString(),
      metadata: details_raw.metadata,
      manifest: details_raw.manifest,
      description: details_raw.description,
    }
    details.tokenId = details.tokenId.toNumber();
    setTokenDetails(details);
    setFetchingTokenDetails(false);
  }

  useEffect(() => {
    if (props.token.id && tokenDetails !== "") {
      setFetchingTokenDetails(true);
      fetchTokenDetails();
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
          Token Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {fetchingTokenDetails
        ? <>
            <div className="text-center mt-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          </>
        : <>
            <Row className="text-center my-2">
              <Col>
                <h3 className="text-secondary">ID</h3>
                <h1>{tokenDetails.tokenId}</h1>
              </Col>
              <Col>
                <h3 className="text-secondary">Type</h3>
                <h3>{props.token.type}</h3>
              </Col>
              <Col>
                <h3 className="text-secondary">Available Balance</h3>
                <h1>{props.token.balance}</h1>
              </Col>
              <Col>
                <h3 className="text-secondary">Retired</h3>
                <h1>{props.token.retired}</h1>
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
                  <td>{tokenDetails.issuer}</td>
                </tr>
                <tr>
                  <td>Issuee</td>
                  <td>{tokenDetails.issuee}</td>
                </tr>
                <tr>
                  <td>From date</td>
                  <td>{tokenDetails.fromDate}</td>
                </tr>
                <tr>
                  <td>Through date</td>
                  <td>{tokenDetails.thruDate}</td>
                </tr>
                <tr>
                  <td>Automatic retire date</td>
                  <td>{tokenDetails.automaticRetireDate}</td>
                </tr>
                <tr>
                  <td>Metadata</td>
                  <td>{tokenDetails.metadata}</td>
                </tr>
                <tr>
                  <td>Manifest</td>
                  <td>{tokenDetails.manifest}</td>
                </tr>
                <tr>
                  <td>Description</td>
                  <td>{tokenDetails.description}</td>
                </tr>
              </tbody>
            </table>
          </>
        }
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
