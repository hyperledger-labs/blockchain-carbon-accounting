// SPDX-License-Identifier: Apache-2.0
import { FC, useEffect, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { transferTrackerTokens } from "../services/contract-functions";
import { getTracker } from '../services/api.service';

import SubmissionModal from "../components/submission-modal";
import { Web3Provider, JsonRpcProvider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";
import WalletLookupInput from "../components/wallet-lookup-input";
import { InputGroup } from "react-bootstrap";
import { Tracker, Wallet} from "../components/static-data";

type TrackerTransferFormProps = {
  provider?: Web3Provider | JsonRpcProvider,
  roles: RolesInfo,
  trackerId: number,
  signedInAddress: string,
  signedInWallet?: Wallet
}
const TrackerTransferForm: FC<TrackerTransferFormProps> = ({ provider, roles, signedInAddress, trackerId }) => {

  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  // Form inputs
  const [address, setAddress] = useState("");
  const [tracker, setTracker] = useState<Tracker>();

  const [result, setResult] = useState("");

  // After initial onFocus for retransferquired inputs, display red outline if invalid
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);
  const [fetchingTracker, setFetchingTracker] = useState(false);

  function handleSubmit() {
    submit();
    setSubmissionModalShow(true);
  }

  useEffect(() => {
    const init = async () => {
      if (provider && signedInAddress && trackerId) {
        setFetchingTracker(true);
        const {tracker} = await getTracker(trackerId);
        if(tracker) setTracker(tracker)
      }
    }
    init();
  }, [provider, signedInAddress, trackerId, fetchingTracker]);

  // populate form with URL params if found
  useEffect(() => {
    let queryParams = new URLSearchParams(window.location.search);
    let addressQueryParam = queryParams.get('address');
    if (addressQueryParam) {
      setAddress(addressQueryParam);
    }
  }, []);

  async function submit() {
    if (!provider) return;
    let result = await transferTrackerTokens(provider,address,[tracker?.tokenId!],[1],[]);
    setResult(result.toString());
  }

  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };

  return roles.hasAnyRole ? (
    <>
      <SubmissionModal
        show={submissionModalShow}
        title="Issue tokens"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <Form.Group className="mb-3" controlId="addressInput">
        <Form.Label>Address</Form.Label>
        <InputGroup>
          <WalletLookupInput
            onChange={(v: string) => { setAddress(v) }}
            onWalletChange={(w)=>{
              setAddress(w ? w.address! : '');
            }}
            onBlur={() => setInitializedAddressInput(true)}
            style={(address || !initializedAddressInput) ? {} : inputError}
            />
        </InputGroup>
      </Form.Group>

      <Row className="mt-4">

        <Col>
          {/* Only enable issue if any role is found */}
          { roles.hasAnyRole
            ?
              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleSubmit}
              >
                Transfer
              </Button>
            :
              <Button variant="primary" size="lg" disabled>Must be a registered dealer</Button>
          }
        </Col>

      </Row>

    </>
  ) : (
    <p>You must be a registered dealer to issue tokens.</p>
  );
}

export default TrackerTransferForm;
