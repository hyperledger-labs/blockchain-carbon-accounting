// SPDX-License-Identifier: Apache-2.0
import Button from 'react-bootstrap/Button';
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import { FaLink } from 'react-icons/fa';
import Form from 'react-bootstrap/Form';
import { FC, ChangeEvent, useCallback, useEffect, useState } from "react";
import { trackUpdate } from "../services/contract-functions";
import { Web3Provider } from "@ethersproject/providers";
import DisplayDate from "./display-date";
import DisplayJSON from "./display-json";
import { Tracker } from "../components/static-data";

type TrackerInfoModalProps = {
  provider?: Web3Provider,
  show:boolean,
  tracker:any,
  onHide:()=>void, 
  isDealer?:boolean,
}

type KeyValuePair = {
  key: string
  value: string
}

const TrackerInfoModal:FC<TrackerInfoModalProps> = ({provider,show,tracker,onHide,isDealer}) => {

  const [trackerDescription, setTrackerDescription] = useState("");
  const onTrackerDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setTrackerDescription(event.target.value); }, []);
  const [result, setResult] = useState("");

  function handleSubmit() {
    submit();
    //setSubmissionModalShow(true);
  }

  async function submit() {
    if (!provider) return;
    let result = await trackUpdate(provider, tracker.trackerId, "","",0,0, trackerDescription);
    setResult(result.toString());
  }
  return (
    <Modal {...{show,tracker,onHide}} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Tracker Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mt-2 mb-4 me-3">
          {/* tracker ID, icon, and type */}
          <Col className="col-3">
            <Row className="text-center">
              <Col>
                <h3 className="mb-1 mt-2">ID: {tracker.trackerId}</h3>
              </Col>
              <Col>
                <h3 className="display-10">
                  <FaLink />
                </h3>
              </Col>
            </Row>
          </Col>
          <Col className="col-9">
            <h5>
                Reported emissions: {tracker.totalEmissions} kgCO2e
            </h5>
  
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
              <td className="text-monospace">{tracker.trackee}</td>
            </tr>
            <tr>
              <td>From date</td>
              <td><DisplayDate date={tracker.fromDate}/></td>
            </tr>
            <tr>
              <td>Thru date</td>
              <td><DisplayDate date={tracker.thruDate}/></td>
            </tr>
            <tr>
              <td>Description</td>
              
              {(isDealer && tracker.auditor=="0x0000000000000000000000000000000000000000") ?
                <td style={{ overflowWrap: "anywhere" }}>
                  <Form.Group className="mb-3" controlId="trackerDescriptionInput">
                    <Form.Control as="textarea" placeholder={tracker.description} value={trackerDescription} onChange={onTrackerDescriptionChange} />
                  </Form.Group>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100"
                    onClick={handleSubmit}
                    //disabled={disableIssueButton(calldata, quantity, address)}
                  >
                    Submit
                  </Button> 
                </td>
                : <td style={{ overflowWrap: "anywhere" }}>{tracker.description}</td>
            }
            </tr>
          </tbody>
        </table>
        <table className="table">
          <thead>
            <tr>
              <th>Products</th>
              <th>Amount (Available)</th>
            </tr>
          </thead>
          <tbody>
            {tracker.products?.names.map((name: any,i: number) => ( 
              <tr key={name+i}>
                <td>
                  {name}{":"+" "}  
                  <div key={'intensityLabel'+i}>GHG Intensity</div>                    
                </td>
                <td>
                  <div key={name+"Amount"+i}>
                    {tracker.products?.amounts[i]+" "+tracker.products?.units[i]}
                    {" ("+tracker.products?.available[i]+") "}
                  </div>
                  <div key={name+"Intensity"+i}>{tracker.products?.emissionFactors[i]}{" kgCO2e/"+tracker.products?.units[i]}</div>
                </td>
              </tr>
            ))
            }
          </tbody>
        </table>
        <table className="table">
          <thead>
            <tr>
              <th>Emissions</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {tracker.tokens?.details.map((e: any,i: number) => ( 
                <tr key={e.tokenId+'Details'}>
                  <td>{"tokenId "+e.tokenId}
                    <div>{(e.description)}</div>
                  </td>
                  <td>{tracker.tokens?.amounts[i]+" kgCO2e"}
                    <DisplayJSON json={e.metadata}/>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TrackerInfoModal;
