// SPDX-License-Identifier: Apache-2.0
import { FC } from "react";
import Button from 'react-bootstrap/Button';
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import { FaLink } from 'react-icons/fa';


type TrackerInfoModalProps = {
  show:boolean
  tracker:any
  onHide:()=>void 
}

const TrackerInfoModal:FC<TrackerInfoModalProps> = (props) => {

  return (
    <Modal {...props} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Tracker Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mt-2 mb-4 mr-3">
          {/* tracker ID, icon, and type */}
          <Col className="col-3">
            <Row className="text-center">
              <Col>
                <h3 className="mb-1 mt-2">ID: {props.tracker.trackerId}</h3>
              </Col>
              <Col>
                <h1 className="display-4">
                  <FaLink />
                </h1>
              </Col>
            </Row>
            <Row className="text-center mt-1">
              <Col>
                <small className="text-secondary text-uppercase">
                  {props.tracker.tokenType}
                </small>
              </Col>
            </Row>
          </Col>
          <Col className="col-9">
            <h5>
                Reported emissions: {props.tracker.totalEmissions}
            </h5>
            <h5>Carbon Intensity: {props.tracker.ciVct}</h5>
            {/*<h5 className="text-secondary">CI AEC {props.tracker.ciAec}</h5>*/}

            { Number(props.tracker.totalAudited) > 0  &&
              <h5 className="text-secondary">Audited emissions (out): {props.tracker.totalAudited} </h5>}
            { Number(props.tracker.totalOffsets) > 0  &&
              <h5 className="text-secondary">Offset credits (out): {props.tracker.totalOffsets}</h5>}
            { Number(props.tracker.totalOut) > 0  &&
              <h5 className="text-secondary">Carbon tokens (out): {props.tracker.totalOut}</h5>}
          </Col>
          {/* Total emission inputs and audited/offset outputs */}
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
              <td>Trackee</td>
              <td className="text-monospace">{props.tracker.trackee}</td>
            </tr>
            <tr>
              <td>From date</td>
              <td>{props.tracker.fromDate}</td>
            </tr>
            <tr>
              <td>Thru date</td>
              <td>{props.tracker.thruDate}</td>
            </tr>
            <tr>
              <td>Metadata</td>
              <td className="text-monospace" style={{ overflowWrap: "anywhere" }}>
                {props.tracker.metadata}
              </td>
            </tr>
            <tr>
              <td>Manifest</td>
              <td style={{ overflowWrap: "anywhere" }}>{props.tracker.manifest}</td>
            </tr>
            <tr>
              <td>Description</td>
              <td style={{ overflowWrap: "anywhere" }}>{props.tracker.description}</td>
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

export default TrackerInfoModal;
