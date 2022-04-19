// SPDX-License-Identifier: Apache-2.0
import { FC, useState, PropsWithChildren } from "react";
import { Button, Col, FloatingLabel, Form, Row } from "react-bootstrap";
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";

type RequestAuditProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo,
  limitedMode: boolean
}

type GenericForm = {
  [P in string]: string
}

type EmissionsFactorForm = {
  activity_type: 'flight' | 'shipment' | ''
  ups_tracking: string
  shipment_mode: 'air' | 'ground' | 'sea' | ''
  weight: string
  weight_uom: 'kg' | 'lbs'
  flight_carrier: string
  flight_service_level: 'Economy Class' | 'Premium Economy Class' | 'Business Class' | 'First Class' | ''
  num_passengers: string
  from_country: string
  from_state_province: string
  from_city: string
  from_address: string
  destination_country: string
  destination_state_province: string
  destination_city: string
  destination_address: string
  level_1: string
  level_2: string
  level_3: string
  level_4: string
}

const defaultEmissionsFactorForm: EmissionsFactorForm = {
  activity_type: '',
  ups_tracking: '',
  shipment_mode: '',
  weight: '',
  weight_uom: 'kg',
  flight_carrier: '',
  flight_service_level: '',
  num_passengers: '1',
  from_country: '',
  from_state_province: '',
  from_city: '',
  from_address: '',
  destination_country: '',
  destination_state_province: '',
  destination_city: '',
  destination_address: '',
  level_1: '',
  level_2: '',
  level_3: '',
  level_4: '',
} as const;


type FormInpuRowProps<T extends GenericForm> = {
  form: T,
  setForm: React.Dispatch<React.SetStateAction<T>>,
  field: keyof T & string,
  label: string
  type?: 'input' | 'number'
  min?: number,
  max?: number,
  placeholder?: string
};

type FormSelectRowProps<T extends GenericForm> = FormInpuRowProps<T> & {
  values: {
    value: string
    label: string
  }[]
}

const FormInputRow = <T extends GenericForm,>({ form, setForm, field, label, placeholder, type, min, max }:PropsWithChildren<FormInpuRowProps<T>>) => {
  return <FloatingLabel className="mb-3" controlId={field} label={label}>
    <Form.Control
      type={type||"input"}
      min={min}
      max={max}
      placeholder={placeholder||label}
      value={form[field] as string}
      onChange={e=>{ setForm({...form, [field]: e.currentTarget.value })}}
      />
  </FloatingLabel>
}

const FormSelectRow = <T extends GenericForm,>({ form, setForm, field, label, placeholder, values }:PropsWithChildren<FormSelectRowProps<T>>) => {
  return <FloatingLabel className="mb-3" controlId={field} label={label}>
    <Form.Select aria-label={label}
      value={form[field] as string}
      onChange={e=>{ setForm({...form, [field]: e.currentTarget.value })}}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {values.map((o,i)=>
        <option key={i} value={o.value}>{o.label}</option>
      )}
    </Form.Select> 
  </FloatingLabel>
}

const RequestAudit: FC<RequestAuditProps> = ({ provider, roles, signedInAddress, limitedMode }) => {

  const [emForm, setEmForm] = useState<EmissionsFactorForm>(defaultEmissionsFactorForm)

  return roles.hasAnyRole ? (
    <>
      <h2>Request audit</h2>
      
      <FormSelectRow form={emForm} setForm={setEmForm} field="activity_type" label="Activity Type" values={[
        {value:'flight', label:'Flight'},
        {value:'shipment', label:'Shipment'}
      ]}/>

      {!!emForm.activity_type && <>
        {emForm.activity_type === 'shipment' && <>
          <h3>Shipment Details</h3>
          <FormSelectRow form={emForm} setForm={setEmForm} field="shipment_mode" label="Shipping Mode" placeholder="Use UPS Tracking Number" values={[
            {value:'air', label:'Air'},
            {value:'ground', label:'Ground'},
            {value:'sea', label:'Sea'}
          ]}/>
          {!emForm.shipment_mode && <>
            <FormInputRow form={emForm} setForm={setEmForm} field="ups_tracking" label="UPS Tracking Number"/>
            </>}
          {!!emForm.shipment_mode && <>
            <Row>
              <Col>
                <FormInputRow form={emForm} setForm={setEmForm} field="weight" type="number" min={0} label={`Weight in ${emForm.weight_uom}`}/>
              </Col>
              <Col>
                <FormSelectRow form={emForm} setForm={setEmForm} field="weight_uom" label="Weight UOM" values={[
                  {value:'kg', label:'kg'},
                  {value:'lbs', label:'lbs'}
                ]}/>
              </Col>
            </Row>
            <h4>From</h4>
            <FormInputRow form={emForm} setForm={setEmForm} field="from_country" label="Country"/>
            <FormInputRow form={emForm} setForm={setEmForm} field="from_state_province" label="State / Province"/>
            <FormInputRow form={emForm} setForm={setEmForm} field="from_city" label="City"/>
            <FormInputRow form={emForm} setForm={setEmForm} field="from_address" label="Address"/>
            <h4>Destination</h4>
            <FormInputRow form={emForm} setForm={setEmForm} field="destination_country" label="Country"/>
            <FormInputRow form={emForm} setForm={setEmForm} field="destination_state_province" label="State / Province"/>
            <FormInputRow form={emForm} setForm={setEmForm} field="destination_city" label="City"/>
            <FormInputRow form={emForm} setForm={setEmForm} field="destination_address" label="Address"/>
            </>}
        </>}


        {emForm.activity_type === 'flight' && <>
          <h3>Flight Details</h3>
          <FormInputRow form={emForm} setForm={setEmForm} field="flight_carrier" label="Carrier"/>
          <FormSelectRow form={emForm} setForm={setEmForm} field="flight_service_level" label="Flight Class" values={[
            {value:'economy', label:'Economy'},
            {value:'premium economy', label:'Premium Economy'},
            {value:'business', label:'Business'},
            {value:'first', label:'First'}
          ]}/>
          <FormInputRow form={emForm} setForm={setEmForm} field="num_passengers" type="number" min={1} label="Number of Passengers"/>
          <h4>From</h4>
          <FormInputRow form={emForm} setForm={setEmForm} field="from_country" label="Country"/>
          <FormInputRow form={emForm} setForm={setEmForm} field="from_state_province" label="State / Province"/>
          <FormInputRow form={emForm} setForm={setEmForm} field="from_city" label="City"/>
          <FormInputRow form={emForm} setForm={setEmForm} field="from_address" label="Address"/>
          <h4>Destination</h4>
          <FormInputRow form={emForm} setForm={setEmForm} field="destination_country" label="Country"/>
          <FormInputRow form={emForm} setForm={setEmForm} field="destination_state_province" label="State / Province"/>
          <FormInputRow form={emForm} setForm={setEmForm} field="destination_city" label="City"/>
          <FormInputRow form={emForm} setForm={setEmForm} field="destination_address" label="Address"/>
        </>}


        {/* <h3>Choose an emissions factor</h3> */}
        {/* <FormInputRow form={emForm} setForm={setEmForm} field="level_1" label="Level 1"/> */}
        {/* <FormInputRow form={emForm} setForm={setEmForm} field="level_2" label="Level 2"/> */}
        {/* <FormInputRow form={emForm} setForm={setEmForm} field="level_3" label="Level 3"/> */}
        {/* <FormInputRow form={emForm} setForm={setEmForm} field="level_4" label="Level 4"/> */}

        <Button className="w-100" variant="success" size="lg" onClick={_=>{ console.log('Lookup emissions factors for ', emForm) }}>Submit Request</Button>
        </>}

    </>
  ) : (
    <p>You must be a registered user to request audits.</p>
  );
}

export default RequestAudit;

