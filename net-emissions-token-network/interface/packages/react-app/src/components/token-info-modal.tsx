// SPDX-License-Identifier: Apache-2.0
import { FC } from "react";
import Button from 'react-bootstrap/Button';
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import { FaCoins } from 'react-icons/fa';
import DisplayDate from "./display-date";
import DisplayJSON from "./display-json";
import DisplayTokenAmount from "./display-token-amount";


export type TokenInfo = {
  isMyIssuedToken?: boolean,
  tokenId?: number,
  tokenType?: string,
  issuedBy?: string,
  issuedFrom?: string,
  issuedTo?: string,
  description?: string,
  fromDate?: number,
  thruDate?: number,
  dateCreated?: number,
  totalIssued?: bigint,
  totalRetired?: bigint,
  availableBalance?: bigint,
  retiredBalance?: bigint,
  metadata?: any,
  manifest?: any,
}

type TokenInfoModalProps = {
  show:boolean
  token:TokenInfo
  onHide:()=>void 
}

const TokenInfoModal:FC<TokenInfoModalProps> = (props) => {

  return (
    <Modal {...props} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Token Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mt-2 mb-4 me-3">
          {/* Available and retired balances */}
          {props.token.isMyIssuedToken ?
            <Col className="col-5 offset-1 text-right">
              <h5 className="text-secondary">Total Issued</h5>
              <h1><DisplayTokenAmount amount={props.token.totalIssued}/></h1>
              <h5 className="text-secondary">Total Retired</h5>
              <h2><DisplayTokenAmount amount={props.token.totalRetired}/></h2>
            </Col>
            :
            <Col className="col-4 offset-1 text-right">
              <h5 className="text-secondary">Available Balance</h5>
              <h1><DisplayTokenAmount amount={props.token.availableBalance}/></h1>
              <h5 className="text-secondary">Retired Balance</h5>
              <h2><DisplayTokenAmount amount={props.token.retiredBalance}/></h2>
            </Col>
          }

          {/* token ID, icon, and type */}
          <Col className="col-3">
            <Row className="text-center">
              <Col>
                <h3 className="mb-1 mt-2">ID: {props.token.tokenId}</h3>
              </Col>
            </Row>
            <Row className="text-center">
              <Col>
                <h1 className="display-4">
                  <FaCoins />
                </h1>
              </Col>
            </Row>
            <Row className="text-center mt-1">
              <Col>
                <small className="text-secondary text-uppercase">
                  {props.token.tokenType}
                </small>
              </Col>
            </Row>
          </Col>

          {/* transfer and retire buttons (enabled if available balance) */}
          {!props.token.isMyIssuedToken &&
          <Col className="col-3">
            <br />
            <Row className="text-left mb-2">
              <Col>
                <Button
                  variant="success"
                  href={`/transfer?tokenId=${props.token.tokenId}`}
                  disabled={!props.token.availableBalance || Number(props.token.availableBalance) <= 0}
                >
                  Transfer
                </Button>
              </Col>
            </Row>
            <Row className="text-left mb-2">
              <Col>
                <Button
                  variant="danger"
                  href={`/retire?tokenId=${props.token.tokenId}`}
                  disabled={!props.token.availableBalance || Number(props.token.availableBalance) <= 0}
                >
                  Retire
                </Button>
              </Col>
            </Row>
          </Col>}
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
              <td>Issued By</td>
              <td className="text-monospace">{props.token.issuedBy}</td>
            </tr>
            <tr>
              <td>Issued From</td>
              <td className="text-monospace">{props.token.issuedFrom}</td>
            </tr>
            <tr>
              <td>Issued To</td>
              <td className="text-monospace">{props.token.issuedTo}</td>
            </tr>
            <tr>
              <td>From date</td>
              <td><DisplayDate date={props.token.fromDate}/></td>
            </tr>
            <tr>
              <td>Thru date</td>
              <td><DisplayDate date={props.token.thruDate}/></td>
            </tr>
            <tr>
              <td>Created date</td>
              <td><DisplayDate date={props.token.dateCreated}/></td>
            </tr>
            <tr>
              <td>Metadata</td>
              <td className="text-monospace" style={{ overflowWrap: "anywhere" }}>
                <DisplayJSON json={props.token.metadata}/>
              </td>
            </tr>
            <tr>
              <td>Manifest</td>
              <td style={{ overflowWrap: "anywhere" }}>
                <DisplayJSON json={props.token.manifest}/>
              </td>
            </tr>
            <tr>
              <td>Description</td>
              <td style={{ overflowWrap: "anywhere" }}>{props.token.description}</td>
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


export default TokenInfoModal;
