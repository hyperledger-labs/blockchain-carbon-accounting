// SPDX-License-Identifier: Apache-2.0
import { FC, useCallback, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { EmissionsRequest } from '../components/static-data';
import { getAuditorEmissionsRequest, declineEmissionsRequest } from '../services/api.service';
import { issueEmissionsRequest } from '../services/supply-chain-api';
import { RolesInfo } from "../components/static-data";
import { Web3Provider } from "@ethersproject/providers";

type PendingEmissionsProps = {
  provider?: Web3Provider,
  signedInAddress: string,
  roles: RolesInfo,
  uuid: string
}

const PendingEmissions: FC<PendingEmissionsProps> = ({ provider, roles, signedInAddress, uuid }) => {
  const [selectedPendingEmissions, setSelectedPendingEmissions] = useState<EmissionsRequest>();
  const [error, setError] = useState("");

  const castMetadata = (metadata: any) => {
    if(metadata === undefined || !metadata) return <></>;
    
    if(typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (err) {
        console.error('Could not parse JSON from ', metadata);
      }
    } 
    
    let keys: string[] = [];
    let values: string[] = [];
    for (const key in metadata) {
      keys.push(key);
      values.push(metadata[key]);
    }
    
    return <>{keys.filter((k,i)=>k&&values[i]).map((key, i) => <div key={`${key}-${i}`}><b>{key}</b> : {values[i]}</div>
    )}</>
  };

  async function handleDecline() {
    if (selectedPendingEmissions && selectedPendingEmissions.uuid) {
      try {
        let result = await declineEmissionsRequest(selectedPendingEmissions.uuid);
        if (result && result.status === 'success') {
          setError("");
          window.location.replace('/emissionsrequests');
        } else {
          setError("Could not decline emissions request.");
        }
      } catch (error) {
        console.log(error);
        setError("Could not decline emissions request.");
      }
    } else {
      setError("Empty current pending emission request.");
    }
  }

  async function handleIssue() {
    if (selectedPendingEmissions && selectedPendingEmissions.uuid) {
      try {
        let result = await issueEmissionsRequest(selectedPendingEmissions.uuid);
        if (result && result.status === 'success') {
          setError("");
          window.location.replace('/issuedtokens');
        } else {
          setError("Could not issue emissions request.");
        }
      } catch (error) {
        console.log(error);
        setError("Could not issue emissions request.");
      }
    } else {
      setError("Empty current pending emission request.");
    }
  }

  useEffect(() => {
    const init = async () => {
      if (provider && uuid && signedInAddress) {
        await fetchEmissionsRequest(uuid, signedInAddress);
      }
    }
    init();
  }, [provider, uuid, signedInAddress]);

  const fetchEmissionsRequest = useCallback(async (uuid: string, signedInAddress: string) => {
    try {
      let newEmissionsRequest = await getAuditorEmissionsRequest(uuid);
      if (newEmissionsRequest && newEmissionsRequest.emission_auditor && signedInAddress
          && newEmissionsRequest.emission_auditor.toLowerCase() == signedInAddress.toLowerCase()) {
        setSelectedPendingEmissions(newEmissionsRequest);
        setError("");
      } else {
        setError("Wrong emission auditor address.");
      }
    } catch (error) {
      console.log(error);
      setError("Could not get emissions request.");
    }
  }, [provider, signedInAddress]);

  return (
    <>
    <h2>Pending Emissions Request</h2>
    <p className="text-danger">{error}</p>
    {(selectedPendingEmissions && selectedPendingEmissions.uuid) && (
      <table className="table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Issued From</td>
            <td className="text-monospace">{selectedPendingEmissions.issued_from}</td>
          </tr>
          <tr>
            <td>Issued To</td>
            <td className="text-monospace">{selectedPendingEmissions.issued_to}</td>
          </tr>
          <tr>
            <td>From date</td>
            <td>{selectedPendingEmissions.token_from_date}</td>
          </tr>
          <tr>
            <td>Thru date</td>
            <td>{selectedPendingEmissions.token_thru_date}</td>
          </tr>
          <tr>
            <td>Emissions</td>
            <td>{selectedPendingEmissions.token_total_emissions}</td>
          </tr>
          <tr>
            <td>Metadata</td>
            <td className="text-monospace" style={{ overflowWrap: "anywhere" }}>
              {castMetadata(selectedPendingEmissions.token_metadata)}
            </td>
          </tr>
          <tr>
            <td>Manifest</td>
            <td style={{ overflowWrap: "anywhere" }}>
              {castMetadata(selectedPendingEmissions.token_manifest)}
            </td>
          </tr>
          <tr>
            <td>Description</td>
            <td style={{ overflowWrap: "anywhere" }}>{selectedPendingEmissions.token_description}</td>
          </tr>
        </tbody>
      </table>
    )}
    {(selectedPendingEmissions && selectedPendingEmissions.uuid) ?
      <Row className="mt-4">
        <Col>
          <Button className="w-100" variant="danger" size="lg" onClick={handleDecline}>Decline</Button>
        </Col>
        <Col>
          <Button className="w-100" variant="primary" size="lg" onClick={handleIssue}>Issue</Button>
        </Col> 
      </Row>
      : null
    }
    </>
  );
}

export default PendingEmissions;

