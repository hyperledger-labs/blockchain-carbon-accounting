// SPDX-License-Identifier: Apache-2.0
import { FC, useCallback, useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { getAuditorEmissionsRequest, declineEmissionsRequest, issueEmissionsRequest } from '../services/api.service';
import { issue } from "../services/contract-functions";
import { RolesInfo, Wallet } from "../components/static-data";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import DisplayJSON from "../components/display-json";
import DisplayDate, { parseDate } from "../components/display-date";
import DisplayTokenAmount from "../components/display-token-amount";
import type { EmissionsRequest } from "@blockchain-carbon-accounting/data-postgres/src/models/emissionsRequest";
import { trpc } from "../services/trpc";
import { useMutation } from "react-query";
import { useLocation } from "wouter";
import AsyncButton from "../components/AsyncButton";

type PendingEmissionsProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string,
  roles: RolesInfo,
  uuid: string,
  signedInWallet?: Wallet
}

const PendingEmissions: FC<PendingEmissionsProps> = ({ provider, signedInAddress, uuid, signedInWallet }) => {
  const [selectedPendingEmissions, setSelectedPendingEmissions] = useState<EmissionsRequest>();
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const issueFromQuery = trpc.useQuery(['wallet.get', {address: selectedPendingEmissions?.issued_from || ''}], {
    enabled: !!selectedPendingEmissions?.issued_from,
  });
  const issueToQuery = trpc.useQuery(['wallet.get', {address: selectedPendingEmissions?.issued_to || ''}], {
    enabled: !!selectedPendingEmissions?.issued_to,
  });

  const declineQuery = useMutation(async () => {
    if (selectedPendingEmissions && selectedPendingEmissions.uuid) {
      try {
        let result = await declineEmissionsRequest(selectedPendingEmissions.uuid);
        if (result && result.status === 'success') {
          setError("");
          setLocation('/emissionsrequests');
        } else {
          setError("Cannot decline emissions request.");
        }
      } catch (error) {
        console.log(error);
        setError("Cannot decline emissions request.");
      }
    } else {
      setError("Empty current pending emission request.");
    }
  });

  const issueQuery = useMutation(async () => {
    if (provider && selectedPendingEmissions && selectedPendingEmissions.uuid) {
      try {
        const tokenTypeId = 3;
        // handle the dates properly
        const from_date = parseDate(selectedPendingEmissions.token_from_date);
        const thru_date = parseDate(selectedPendingEmissions.token_thru_date);
        if (!from_date) {
          setError("Empty token from date.");
          return;
        }
        if (!thru_date) {
          setError("Empty token thru date.");
          return;
        }
        if (!selectedPendingEmissions.token_metadata) {
          setError("Empty token metadata.");
          return;
        }
        if (!selectedPendingEmissions.token_manifest) {
          setError("Empty token manifest.");
          return;
        }
        if (!selectedPendingEmissions.token_description) {
          setError("Empty token description.");
          return;
        }

        let result = await issue(provider,
          selectedPendingEmissions.issued_from,
          selectedPendingEmissions.issued_to,
          tokenTypeId,
          selectedPendingEmissions.token_total_emissions,
          from_date,
          thru_date,
          selectedPendingEmissions.token_metadata,
          selectedPendingEmissions.token_manifest,
          selectedPendingEmissions.token_description,
          signedInWallet?.private_key || ''
        );

        console.log("handleIssue", result.toString());
        if (result) {
          let res = result = result.toString();
          if (res.toLowerCase().includes("success")) {
            let result = await issueEmissionsRequest(selectedPendingEmissions.uuid);
            if (result && result.status === 'success') {
              setError("");
              setLocation('/issuedtokens');
            } else {
              setError("Cannot update emissions request status.");
            }
          } else {
            setError("Cannot issue emissions request. " + result.toString());
          }
        }

      } catch (error) {
        console.log(error);
        setError("Cannot issue emissions request.");
      }
    } else {
      setError("Empty current pending emission request.");
    }
  });

  const fetchEmissionsRequest = useCallback(async (uuid: string, signedInAddress: string) => {
    try {
      let newEmissionsRequest = await getAuditorEmissionsRequest(uuid);
      if (newEmissionsRequest && newEmissionsRequest.emission_auditor && signedInAddress
          && newEmissionsRequest.emission_auditor.toLowerCase() === signedInAddress.toLowerCase()) {

        if (newEmissionsRequest.token_manifest) {
          const manifest = JSON.parse(newEmissionsRequest.token_manifest);
          let changed = false;
          if (!manifest.request_uuid) {
            manifest.request_uuid = newEmissionsRequest.uuid;
            changed = true;
          }
          if (!manifest.node_id) {
            manifest.node_id = newEmissionsRequest.node_id;
            changed = true;
          }
          if (changed) {
            newEmissionsRequest.token_manifest = JSON.stringify(manifest);
          }
        }
        setSelectedPendingEmissions(newEmissionsRequest);
        setError("");
      } else {
        console.warn('Wrong emission_auditor ?', newEmissionsRequest, signedInAddress)
        setError("Wrong emission auditor address.");
      }
    } catch (error) {
      console.log(error);
      setError("Cannot get emissions request.");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (provider && uuid && signedInAddress) {
        await fetchEmissionsRequest(uuid, signedInAddress);
      }
    }
    init();
  }, [provider, uuid, signedInAddress, fetchEmissionsRequest]);

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
              <td className="text-monospace">
                {selectedPendingEmissions.issued_from}
                <div>
                  {issueFromQuery.data?.wallet?.name}
                </div>
              </td>
            </tr>
            <tr>
              <td>Issued To</td>
              <td className="text-monospace">
                {selectedPendingEmissions.issued_to}
                <div>
                  {issueToQuery.data?.wallet?.name}
                </div>
              </td>
            </tr>
            <tr>
              <td>From date</td>
              <td><DisplayDate date={selectedPendingEmissions.token_from_date}/></td>
            </tr>
            <tr>
              <td>Thru date</td>
              <td><DisplayDate date={selectedPendingEmissions.token_thru_date}/></td>
            </tr>
            <tr>
              <td>Emissions</td>
              <td><DisplayTokenAmount amount={selectedPendingEmissions.token_total_emissions}/></td>
            </tr>
            <tr>
              <td>Metadata</td>
              <td className="text-monospace" style={{ overflowWrap: "anywhere" }}>
                <DisplayJSON json={selectedPendingEmissions.token_metadata}/>
              </td>
            </tr>
            <tr>
              <td>Manifest</td>
              <td style={{ overflowWrap: "anywhere" }}>
                <DisplayJSON json={selectedPendingEmissions.token_manifest}/>
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
            <AsyncButton
              className="w-100"
              variant="danger"
              onClick={()=>{ declineQuery.mutate() }}
              loading={declineQuery.isLoading}
            >Decline</AsyncButton>
          </Col>
          <Col>
            <AsyncButton
              className="w-100"
              variant="primary"
              size="lg"
              onClick={()=>{ issueQuery.mutate() }}
              loading={issueQuery.isLoading}
            >Issue</AsyncButton>
          </Col>
        </Row>
        : null
    }
      </>
  );
}

export default PendingEmissions;

