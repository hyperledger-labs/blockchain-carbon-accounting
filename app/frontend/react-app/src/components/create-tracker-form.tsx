import { FC, useEffect, useState, useCallback, ChangeEvent } from "react";
import { Form } from "react-bootstrap";
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';

import { BsPlus } from 'react-icons/bs';

//import Datetime from "react-datetime";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

import { track } from "../services/contract-functions"
import { Operator, Wallet } from "./static-data";
import SubmissionModal from "../components/submission-modal";
import FormGroupJSON, { KeyValuePair } from "../components/form-group-json";
import WalletLookupInput from "../components/wallet-lookup-input";
import { InputGroup } from "react-bootstrap";


export type CreateTrackerFormSeeds = { 
  from_date?: Date,
  thru_date?: Date,
  metadata?: string,
  manifest?: string
}

type CreateTrackerProps = {
  provider?: Web3Provider | JsonRpcProvider
  signedInWallet?: Wallet
  operator?: Operator 
  signedInAddress?: string
  trackee?:string
  formSeeds?:CreateTrackerFormSeeds
  onSubmitHandle?:(result:string)=>void
}

const CreateTrackerForm: FC<CreateTrackerProps> = (
  {provider,operator,signedInWallet,signedInAddress,trackee,formSeeds,onSubmitHandle}
) => {
  //const [fromDate, setFromDate] = useState<Date|null>(formSeeds?.from_date!);
  //const [thruDate, setThruDate] = useState<Date|null>(formSeeds?.thru_date!);
  const _metadata =  formSeeds?.metadata ? JSON.parse(formSeeds?.metadata!) : {};
  //const [metajson, setMetajson] = useState("");
  const [metadata, setMetadata] = useState<KeyValuePair[]>(_metadata! ? Object.keys(_metadata).map((key)=>({key: key,value: _metadata[key]})) :[] );

  const _manifest =  formSeeds?.manifest ? JSON.parse(formSeeds?.manifest!) : {};
  //const [manifestjson, setManifestjson] = useState("");
  const [manifest, setManifest] = useState<KeyValuePair[]>(_metadata! ? Object.keys(_manifest).map((key)=>({key: key,value: _manifest[key]})) :[] );

  const [selectedTrackee,setSelectedTrackee] = useState<string>(trackee||'');
  const [initializedAddressInput, setInitializedAddressInput] = useState(false);

  const [description, setDescription] = useState(_metadata?.description!);
  const onDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setDescription(event.target.value); }, []);
  const [result, setResult] = useState("");
  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  const castMetadata = (pairlist: KeyValuePair[]) => {
    const metaObj: any = {};
    pairlist.forEach((elem) => {
      metaObj[elem.key] = elem.value;
    });
    if(description) metaObj["description"] = description;
    if(operator) metaObj["operator_uuid"] = operator?.uuid;

    return JSON.stringify(metaObj);
  }

  // handle metadata field list
  const removeField = (idx: number) => {
    let array = [...metadata];
    array.splice(idx, 1);
    setMetadata(array);
    //setMetajson(castMetadata(metadata));
    console.log(metadata)
  }

  const addField = () => {
    metadata.push({key: "", value: ""});
    setMetadata([...metadata]);
    //setMetajson(castMetadata(metadata));
  }

  const castManifest = (pairlist: KeyValuePair[]) => {
    const manifestObj: any = {};
    pairlist.forEach((elem) => {
      manifestObj[elem.key] = elem.value;
    });

    return JSON.stringify(manifestObj);
  }

  const addFieldManifest = () => {
    manifest.push({key: "", value: ""});
    setManifest([...manifest]);
    //setManifestjson(castManifest(manifest));
  }

  const removeFieldManifest = (idx: number) => {
    let array = [...manifest];
    array.splice(idx, 1);
    setManifest(array);
    //setManifestjson(castManifest(manifest));
  }


  useEffect(()=>{
  }, [])

  function handleSubmit() {
    submit();
    if(!onSubmitHandle){setSubmissionModalShow(true);}
  }
  async function submit() { 
    if (!provider) return;
    let result = await track(provider,selectedTrackee,'','',castMetadata(metadata),castManifest(manifest))
    setResult(result.toString());
    if(onSubmitHandle!){onSubmitHandle(result)}
  } 
  const inputError = {
    boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
    borderColor: '#dc3545'
  };
  return (provider! && 
    <>  

      <SubmissionModal
        show={submissionModalShow}
        title="Request certificate"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <h3>Create new certificate {operator && `for ${operator?.name}`}</h3>
      { true &&
        <Form.Group className="mb-3">
          <Form.Label>
            Trackee Address
          </Form.Label>
          <InputGroup>
            <WalletLookupInput
              onChange={(v: string) => { setSelectedTrackee(v) }}
              onWalletChange={(w)=>{
                setSelectedTrackee(w ? w.address! : '');
              }}
              onBlur={() => setInitializedAddressInput(true)}
              style={(selectedTrackee || !initializedAddressInput) ? {} : inputError}
              value={selectedTrackee ? selectedTrackee : ''}
              />
          </InputGroup>
        </Form.Group>
      }
      <Form.Group className="mb-3" controlId="metadataInput">
        <Form.Label>Metadata</Form.Label>
        <Row>
          <Col md={10}>
            <Row className="mb-3">
              <Form.Label column md={3}>Description</Form.Label>
              <Col md={9}>
                <Form.Control as="textarea" placeholder="" value={_metadata?.description} onChange={onDescriptionChange}/>
              </Col>
            </Row>
          </Col>
          <Col md={2}>
            <Row className="mb-3 g-0 gx-2">
              <Col className="col-md-auto col-6">
                <Button className="w-100" variant="outline-dark" onClick={addField}><BsPlus /></Button>
              </Col>
              <div className="col"></div>
            </Row>
          </Col>
        </Row>
        {FormGroupJSON({keyValuePair: metadata, handles: {setKeyValuePair: setMetadata, addField: addField, removeField: removeField}})}
      </Form.Group>
      <Form.Group>
        <Form.Group>
          <Form.Label>Manifest</Form.Label>
          <Button className="label-button" variant="outline-dark" onClick={addFieldManifest}><BsPlus /></Button>
        </Form.Group>
        {FormGroupJSON({keyValuePair: manifest!, handles: {setKeyValuePair:setManifest, addField: addFieldManifest, removeField: removeFieldManifest}})}
      </Form.Group>
      <Button
        variant="primary"
        size="lg"
        className="w-100"
        onClick={handleSubmit}
      >
        Request certificate
      </Button>
    </>
  )
}

export default CreateTrackerForm;