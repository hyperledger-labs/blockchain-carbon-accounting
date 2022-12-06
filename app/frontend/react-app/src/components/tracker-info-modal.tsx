// SPDX-License-Identifier: Amountpache-2.0
import Button from 'react-bootstrap/Button';
import Modal from "react-bootstrap/Modal";
import { FaLink } from 'react-icons/fa';
import Form from 'react-bootstrap/Form';
import { FC, ChangeEvent, useCallback, useState } from "react";
import { trackUpdate } from "../services/contract-functions";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import DisplayDate from "./display-date";
import DisplayJSON from "./display-json";
import { GiOilDrum } from 'react-icons/gi';
import { IoIosFlame } from 'react-icons/io'

import { trpc } from "../services/trpc";
import { Wallet, ProductToken, Tracker, RolesInfo, TrackedProduct, TrackedToken} from "./static-data";

  export function getTotalEmissions(tracker:Tracker){
    return (tracker.totalEmissions-tracker.totalOffsets-tracker.totalREC)
  }

  export function getEmissionsFactor(product:ProductToken){
    return getTotalEmissions(product.tracker)/Number(product.tracker.totalProductAmounts)*Number(product.issued)/Number(product.unitAmount)
  }


type TrackerInfoModalProps = {
  provider?: Web3Provider | JsonRpcProvider,
  show:boolean,
  tracker:Tracker,
  onHide:()=>void,
  roles:RolesInfo,
  signedInAddress: string
}

const TrackerInfoModal:FC<TrackerInfoModalProps> = ({provider,show,tracker,onHide,roles,signedInAddress}) => {
  const [trackerDescription, setTrackerDescription ] = useState((tracker.metadata as any)?.description! || "");
  const [trackerManifest, /*setTrackerManifest*/ ] = useState(JSON.stringify(tracker.manifest) || "");
  const onTrackerDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setTrackerDescription(event.target.value); }, []);
  const [trackeeWallet, setTrackeeWallet] = useState<(Wallet)>();
  const [auditorWallet, setAuditorWallet] = useState<(Wallet)>();

  function handleSubmit() {
    submit();
  }

  async function submit() {
    if (!provider) return;
    let trackerMetadata = tracker.metadata as any;
    trackerMetadata.description = trackerDescription
    await trackUpdate(provider, tracker.trackerId, "","", JSON.stringify(trackerMetadata),trackerManifest);
  }

  trpc.useQuery(['wallet.lookup', {query: tracker.trackee}], {
    onSettled: (output) => {
      console.log('lookup query settled with', output?.wallets)
      if (output?.wallets) {
        setTrackeeWallet([...output?.wallets][0])
      }
    }
  })
  trpc.useQuery(['wallet.lookup', {query: tracker.issuedBy}], {
    onSettled: (output) => {
      console.log('lookup query settled with', output?.wallets)
      if (output?.wallets) {
        setAuditorWallet([...output?.wallets][0])
      }
    }
  })

  return (
    <Modal {...{show,tracker,onHide}} centered size="lg">
      <Modal.Header closeButton>
         <Modal.Title>{`Emission certificate details: ID ${tracker.trackerId}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h3 className="display-10">
          <FaLink /> Reported NET
        </h3>
         <ul style={{listStyle:'none'}}>
           <li>{tracker.totalEmissions>0 && `Emissions: ${(Number(tracker.totalEmissions)/1e3).toLocaleString('en-US')} tons CO2e`}</li>
           <li>{tracker.totalOffsets>0 && `Offsets: ${(Number(tracker.totalOffsets)/1e3).toLocaleString('en-US')} tons CO2e`}</li>
           <li>{tracker.totalREC>0 && `REC: ${(Number(tracker.totalREC)/1e3).toLocaleString('en-US')} tons CO2e`}</li>
           
         </ul>
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Issued for{"\n"}</td>
              <td className="text-monospace">
                  {trackeeWallet?.name+"\n"}
                  <small>({trackeeWallet?.address?.substring(0,7)+"..."})</small>
              </td>
            </tr>
            {(tracker.issuedBy !=="0x0000000000000000000000000000000000000000" ?
              <tr>
                <td>Auditor</td>
                <td className="text-monospace">
                  {auditorWallet?.name+"\n"}
                  <small>({auditorWallet?.address?.substring(0,7)+"..."})</small></td>
              </tr>
            : null)}
            <tr>
              <td>From date</td>
              {/*TO-DO infer fromDate/thruDate from Net Emission tokens*/}
              <td><DisplayDate date={tracker.fromDate}/></td>
            </tr>
            <tr>
              <td>Thru date</td>
              <td><DisplayDate date={tracker.thruDate}/></td>
            </tr>
            <tr>
              <td>Description</td>

              {(roles.isAeDealer || tracker.trackee===signedInAddress) && !tracker.dateIssued ?
                <td style={{ overflowWrap: "anywhere" }}>
                  <Form.Group className="mb-3" controlId="trackerDescriptionInput">
                    <Form.Control as="textarea" placeholder={trackerDescription} value={trackerDescription} onChange={onTrackerDescriptionChange} />
                  </Form.Group>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100"
                    onClick={handleSubmit}
                  >
                    Submit
                  </Button>
                </td>
                : <td style={{ overflowWrap: "anywhere" }}>{(tracker.metadata as any).description}</td>
            }
            </tr>
          </tbody>
        </table>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Amount</th>
              <th>Available</th>
              <th>My Balance</th>
              <th>Emissions Factor</th>
            </tr>
          </thead>
          <tbody>
            {tracker.products?.map((product: ProductToken,i: number) => (
              <tr key={`productID-${product.productId}`}>
                <td>
                  {product?.name?.toLowerCase().includes('oil') && <GiOilDrum/>}{product?.name?.toLowerCase().includes('gas') && <IoIosFlame/>}{product?.name}
                </td>
                <td>
                  <div key={product?.name+"Amount"+i}>
                    {Math.round(product?.unitAmount!).toLocaleString('en-US') + " " + product.unit}
                  </div>
                </td>
                <td>{Math.round(Number(product.available)*product?.unitAmount!/Number(product?.issued)).toLocaleString('en-US')}</td>
                <td>{(Math.round(Number(product?.balances![0]?.available)) || 0).toLocaleString('en-US')}</td>
                <td>
                  <div key={product?.name+"Intensity"+i}>{product?.emissionsFactor?.toLocaleString('en-US')}{" kgCO2e/"+product?.unit}</div>
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
            {tracker.tokens?.map((e: TrackedToken,i: number) => (
              <tr key={e.tokenId+'NetDetails'}>
                <td>{"Token ID "+e.tokenId}
                  <p>{e.token.description}</p>
                  {(e.token.manifest as any)?.source && <a href={(e.token.manifest as any)?.source!} target="_blank" rel="noopener noreferrer">Source</a>} 
                </td>
                <td><>{(Number(e.amount!)/1000).toLocaleString('en-US')+" tons CO2e"}
                  <DisplayJSON json={e.token.metadata}/></>
                </td>
              </tr>
            ))}
            {tracker.trackedProducts?.map((e: TrackedProduct,i: number) => (
              <tr key={e.productId+'ProductDetails'}>
                <td>{"Prodyct ID "+e.productId}
                  <p>{e.product.name}</p>
                  {(e.product.manifest as any)?.source && <a href={(e.product.manifest as any)?.source!} target="_blank" rel="noopener noreferrer">Source</a>} 
                </td>
                <td><ul style={{listStyle: 'none'}}>
                  <li>{[(Number(e.amount!)/Number(e.product.tracker.totalProductAmounts!)*getTotalEmissions(e.product.tracker)/1000).toLocaleString('en-US'),'tons CO2e'].join(' ')}</li>
                  <li>{[(Number(e.amount!)).toLocaleString('en-US'),e.product.unit].join(' ')}</li>
                  <li>{[getEmissionsFactor(e.product).toLocaleString('en-US'),`kg CO2e/${e.product.unit}`].join(' ')}</li>
                  {/*<DisplayJSON json={e.product.metadata}/>*/}
                </ul></td>
              </tr>
            ))}
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
