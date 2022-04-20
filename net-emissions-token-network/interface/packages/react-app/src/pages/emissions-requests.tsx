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
import { countAuditorEmissionsRequests, getAuditorEmissionsRequests } from '../services/api.service';
import { EmissionsRequest } from '../components/static-data';
import { RolesInfo } from "../components/static-data";
import { Web3Provider } from "@ethersproject/providers";

type EmissionsRequestsProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo
}

type EmissionsRequestsHandle = {
  refresh: ()=>void
}

const EmissionsRequests: ForwardRefRenderFunction<EmissionsRequestsHandle, EmissionsRequestsProps> = ({ provider, signedInAddress, roles }, ref) => {
  const [ emissionsRequestsCount, setEmissionsRequestsCount ] = useState(0);
  const [ pendingEmissions, setPendingEmissions ] = useState<EmissionsRequest[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress) {
        let _emissionsRequestsCount = await countAuditorEmissionsRequests(signedInAddress);
        setEmissionsRequestsCount(_emissionsRequestsCount);
        await fetchEmissionsRequests(signedInAddress);
      }
    }
    init();
  }, [provider, signedInAddress]);
  
  function pointerHover(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.cursor = "pointer";
  };
  
  function handleOpenPendingEmissions(emissions: EmissionsRequest) {
    window.location.replace('/pendingemissions/' + emissions.uuid);
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
              <td>{emissions.token_from_date}</td>
              <td>{emissions.token_thru_date}</td>
              <td>{emissions.token_total_emissions}</td>
              <td>{emissions.token_description}</td>
            </tr>
          ))}
      </tbody>
    </Table>
    </>
  );
}

export default forwardRef(EmissionsRequests);
