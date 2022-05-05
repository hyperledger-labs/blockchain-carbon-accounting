// SPDX-License-Identifier: Apache-2.0
import {
  MouseEvent,
  forwardRef,
  useCallback,
  useEffect,
  useState,
  ForwardRefRenderFunction
} from "react";
import Table from "react-bootstrap/Table";
import { getAuditorEmissionsRequests } from '../services/api.service';
import { RolesInfo } from "../components/static-data";
import { Web3Provider } from "@ethersproject/providers";
import { useLocation } from "wouter";
import type { EmissionsRequest } from "../../../../../../data/postgres/src/models/emissionsRequest";
import DisplayDate from "../components/display-date";
import DisplayTokenAmount from "../components/display-token-amount";

type EmissionsRequestsProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo
}

type EmissionsRequestsHandle = {
  refresh: ()=>void
}

const EmissionsRequests: ForwardRefRenderFunction<EmissionsRequestsHandle, EmissionsRequestsProps> = ({ provider, signedInAddress, roles }, ref) => {
  const [ pendingEmissions, setPendingEmissions ] = useState<EmissionsRequest[]>([]);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress) {
        await fetchEmissionsRequests(signedInAddress);
      }
    }
    init();
  }, [provider, signedInAddress]);

  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  };

  function handleOpenPendingEmissions(emissions: EmissionsRequest) {
    setLocation('/pendingemissions/' + emissions.uuid);
  };

  const fetchEmissionsRequests = useCallback(async (auditorAddress: string) => {
    try {
      let newEmissionsRequests = await getAuditorEmissionsRequests(auditorAddress);
      setPendingEmissions(newEmissionsRequests);
      setError("");
    } catch (error) {
      console.log(error);
      setError("Could not get emissions requests.");
    }
  }, [provider, signedInAddress]);


  return (
    <>
    <h2>Pending Emissions Requests</h2>
    <p className="text-danger">{error}</p>
    <Table hover size="sm">
      <thead>
        <tr>
        <th>From Date</th>
        <th>Thru Date</th>
        <th>Emissions</th>
        <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {(pendingEmissions !== []) &&
          pendingEmissions.map((emissions) => (
            <tr
              key={emissions.uuid}
              onClick={() => handleOpenPendingEmissions(emissions)}
              onMouseOver={pointerHover}
            >
              <td><DisplayDate date={emissions.token_from_date}/></td>
              <td><DisplayDate date={emissions.token_thru_date}/></td>
              <td><DisplayTokenAmount amount={emissions.token_total_emissions}/></td>
              <td>{emissions.token_description}</td>
            </tr>
          ))}
      </tbody>
    </Table>
    </>
  );
}

export default forwardRef(EmissionsRequests);
