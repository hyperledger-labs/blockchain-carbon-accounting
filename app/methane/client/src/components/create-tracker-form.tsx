import { FC, useEffect, useState, useCallback, ChangeEvent } from "react";
import { Form } from "react-bootstrap";
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';

import Datetime from "react-datetime";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

import { Operator } from "./static-data";
import { createTracker } from "../services/contract-functions"
import { Wallet } from "@blockchain-carbon-accounting/react-app/src/components/static-data";
import SubmissionModal from "@blockchain-carbon-accounting/react-app/src/components/submission-modal";


export type CreateTrackerFormSeeds = { 
  from_date?: Date,
  thru_date?: Date,
  description?: string,
}

type CreateTrackerProps = {
  provider?: Web3Provider | JsonRpcProvider
  signedInWallet?: Wallet
  operator?: Operator 
  signedInAddress?: string
  trackee:string
  formSeeds?:CreateTrackerFormSeeds
  onSubmitHandle?:(result:string)=>void
}

const CreateTrackerForm: FC<CreateTrackerProps> = (
  {provider,operator,signedInWallet,signedInAddress,trackee,formSeeds,onSubmitHandle}
) => {
  const [fromDate, setFromDate] = useState<Date|null>(formSeeds?.from_date!);
  const [thruDate, setThruDate] = useState<Date|null>(formSeeds?.thru_date!);
  const [description, setDescription] = useState(formSeeds?.description!);
  const onDescriptionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => { setDescription(event.target.value); }, []);
  const [result, setResult] = useState("");
  const [submissionModalShow, setSubmissionModalShow] = useState(false);

  useEffect(()=>{
  }, [])

  function handleSubmit() {
    submit();
    if(!onSubmitHandle){setSubmissionModalShow(true);}
  }
  async function submit() { 
    if (!provider) return;
    if (!fromDate) {
      setResult("Invalid from date");
      return;
    }
    if (!thruDate) {
      setResult("Invalid thru date");
      return;
    }
    let result = await createTracker(provider,signedInAddress!,trackee,fromDate,thruDate,description,signedInWallet?.private_key || '',operator)
    setResult(result.toString());
    if(onSubmitHandle!){onSubmitHandle(result)}
  } 
  return (provider! && 
    <>  

      <SubmissionModal
        show={submissionModalShow}
        title="Request certificate"
        body={result}
        onHide={() => {setSubmissionModalShow(false); setResult("")} }
      />
      <h3>Create new certificate request for {operator?.name}</h3>
      <Row>
        <Form.Group as={Col} className="mb-3" controlId="fromDateInput">
          <Form.Label>From date</Form.Label>
          {/* @ts-ignore : some weird thing with the types ... */}
          <Datetime value={fromDate} onChange={(moment)=>{setFromDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
        </Form.Group>
        <Form.Group as={Col} className="mb-3" controlId="thruDateInput">
          <Form.Label>Through date</Form.Label>
          {/* @ts-ignore : some weird thing with the types ... */}
          <Datetime value={thruDate} onChange={(moment)=>{setThruDate((typeof moment !== 'string') ? moment.toDate() : null)}}/>
        </Form.Group>
      </Row>
      <Form.Group className="mb-3" controlId="descriptionInput">
        <Form.Label>Description</Form.Label>
        <Form.Control as="textarea" placeholder="" value={description} onChange={onDescriptionChange} />
      </Form.Group>
      <Button
        variant="primary"
        size="lg"
        className="w-100"
        onClick={handleSubmit}
      >
        Submit Request
      </Button>
    </>
  )
}

export default CreateTrackerForm;