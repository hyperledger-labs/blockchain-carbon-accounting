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
import { Wallet, ProductToken, Tracker, Token} from "./static-data";

type TrackerInfoModalProps = {
  provider?: Web3Provider | JsonRpcProvider,
  show:boolean,
  tracker:Tracker,
  onHide:()=>void,
  isDealer?:boolean,
}

const TrackerInfoModal:FC<TrackerInfoModalProps> = ({provider,show,tracker,onHide,isDealer}) => {

  const [trackerDescription, setTrackerDescription] = useState("");
  const onTrackerDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setTrackerDescription(event.target.value); }, []);
  const [trackeeWallet, setTrackeeWallet] = useState<(Wallet)>();
  const [auditorWallet, setAuditorWallet] = useState<(Wallet)>();

  function handleSubmit() {
    submit();
  }

  async function submit() {
    if (!provider) return;
    await trackUpdate(provider, tracker.trackerId, "","",0,0, trackerDescription,"");
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

  function tryParseJSONObject(jsonString:string){
      try {
          var o = JSON.parse(jsonString);
  
          // Handle non-exception-throwing cases:
          // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
          // but... JSON.parse(null) returns null, and typeof null === "object", 
          // so we must check for that, too. Thankfully, null is falsey, so this suffices:
          if (o && typeof o === "object") {
              return o;
          }
      }
      catch (e) { }
  
      return false;
  };

  return (
    <Modal {...{show,tracker,onHide}} centered size="lg">
      <Modal.Header closeButton>
         <Modal.Title>{`Emission certificate details: ID ${tracker.trackerId}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
         <h3 className="display-10">
           <FaLink />
             Reported emissions: {Math.round(Number(tracker.totalEmissions)/1e3).toLocaleString('en-US')} tons CO2e
         </h3>
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

              {(isDealer && tracker.issuedBy==="0x0000000000000000000000000000000000000000") ?
                <td style={{ overflowWrap: "anywhere" }}>
                  <Form.Group className="mb-3" controlId="trackerDescriptionInput">
                    <Form.Control as="textarea" placeholder={(tracker.metadata as any).description} value={trackerDescription} onChange={onTrackerDescriptionChange} />
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
                <td>{Math.round(product?.myBalance!).toLocaleString('en-US')}</td>
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
            {tracker.tokens?.map((e: Token,i: number) => (
                <tr key={e.tokenId+'Details'}>
                  <td>{"Token ID "+e.tokenId}
                    <p>{e.description}</p>
                    {e.manifest && <a href={tryParseJSONObject(e.manifest as string) || (e.manifest as any)?.source!} target="_blank" rel="noopener noreferrer">Source</a>} 
                  </td>
                  <td><>{e.totalIssued && (Number(e.totalIssued!)/1000).toLocaleString('en-US')+" tons CO2e"}
                    <DisplayJSON json={e.metadata}/></>
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
