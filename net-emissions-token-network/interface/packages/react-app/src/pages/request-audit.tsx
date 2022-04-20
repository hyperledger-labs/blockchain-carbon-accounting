// SPDX-License-Identifier: Apache-2.0
import { FC, useState } from "react";
import { Breadcrumb, Button, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";
import { trpc } from "../services/trpc";
import { EmissionsFactorInterface } from "../../../../../../data/postgres/node_modules/emissions_data_chaincode/src/lib/emissionsFactor";
import { FormInputRow, FormSelectRow } from "../components/forms-util";

type RequestAuditProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo,
  limitedMode: boolean
}

type EmissionsFactorForm = {
  activity_type: 'flight' | 'shipment' | 'emissions_factor' | ''
  ups_tracking: string
  shipment_mode: 'air' | 'ground' | 'sea' | ''
  weight: string
  weight_uom: 'kg' | 'lbs'
  distance: string
  distance_uom: 'km' | 'miles'
  activity_amount: string
  activity_uom: string
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
  emissions_factor_uuid: string
}

const defaultEmissionsFactorForm: EmissionsFactorForm = {
  activity_type: '',
  ups_tracking: '',
  shipment_mode: '',
  weight: '',
  weight_uom: 'kg',
  distance: '',
  distance_uom: 'km',
  activity_amount: '',
  activity_uom: '',
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
  emissions_factor_uuid: '',
} as const;


const EmissionsFactor: FC<{emissionsFactor: EmissionsFactorInterface}> = ({emissionsFactor}) => {
  return <Breadcrumb as="div" listProps={{className: 'mb-0'}}>
    <Breadcrumb.Item active>{emissionsFactor.level_1}</Breadcrumb.Item>
    <Breadcrumb.Item active>{emissionsFactor.level_2}</Breadcrumb.Item>
    <Breadcrumb.Item active>{emissionsFactor.level_3}</Breadcrumb.Item>
    <Breadcrumb.Item active>{emissionsFactor.level_4}</Breadcrumb.Item>
    <Breadcrumb.Item active>{emissionsFactor.text} <b>{Number(emissionsFactor.co2_equivalent_emissions).toFixed(5)} {emissionsFactor.co2_equivalent_emissions_uom}</b> per <b>{emissionsFactor.activity_uom}</b></Breadcrumb.Item>
  </Breadcrumb>
}

const EmissionsFactorListItem: FC<{
  emissionsFactor: EmissionsFactorInterface,
  href: string, 
  setForm: React.Dispatch<React.SetStateAction<EmissionsFactorForm>>,
  form: EmissionsFactorForm
}> = ({emissionsFactor, href, setForm, form}) => {
  return <Breadcrumb as="div" listProps={{className: 'mb-0'}}>
    {/* <Breadcrumb.Item>{o.scope}</Breadcrumb.Item> */}
    <Breadcrumb.Item href={href} onClick={(e)=>{ e.stopPropagation(); setForm({
      ...form,
      level_1: emissionsFactor.level_1,
      level_2:'',
      level_3:'',
      level_4:''
    })}}>{emissionsFactor.level_1}</Breadcrumb.Item>
    <Breadcrumb.Item href={href} onClick={(e)=>{ e.stopPropagation(); setForm({
      ...form,
      level_1: emissionsFactor.level_1,
      level_2: emissionsFactor.level_2,
      level_3:'',
      level_4:''
    })}}>{emissionsFactor.level_2}</Breadcrumb.Item>
    <Breadcrumb.Item href={href} onClick={(e)=>{ e.stopPropagation(); setForm({
      ...form,
      level_1: emissionsFactor.level_1,
      level_2: emissionsFactor.level_2,
      level_3: emissionsFactor.level_3, 
      level_4:''
    })}}>{emissionsFactor.level_3}</Breadcrumb.Item>
    <Breadcrumb.Item href={href} onClick={(e)=>{ e.stopPropagation(); setForm({
      ...form,
      level_1: emissionsFactor.level_1,
      level_2: emissionsFactor.level_2,
      level_3: emissionsFactor.level_3, 
      level_4: emissionsFactor.level_4||''
    })}}>{emissionsFactor.level_4}</Breadcrumb.Item>
    <Breadcrumb.Item active>{emissionsFactor.text} <b>{Number(emissionsFactor.co2_equivalent_emissions).toFixed(5)} {emissionsFactor.co2_equivalent_emissions_uom}</b> per <b>{emissionsFactor.activity_uom}</b></Breadcrumb.Item>
  </Breadcrumb>
}


const EmissionsFactorUomInputs: FC<{
  emissionsFactor: EmissionsFactorInterface,
  setForm: React.Dispatch<React.SetStateAction<EmissionsFactorForm>>,
  form: EmissionsFactorForm
}> = ({emissionsFactor, form, setForm}) => {
  if (!emissionsFactor || !emissionsFactor.activity_uom) return null;

  return <>{emissionsFactor.activity_uom.split('.').map((uom,i)=>{
    const luom = uom.toLowerCase()
    if (luom === 'passenger') return <FormInputRow key={i} form={form} setForm={setForm} field="num_passengers" type="number" min={0} label="Number of Passengers"/>
    else if (luom === 'tonne' || luom === 'kg' || luom === 'lbs') return <Row key={i}>
      <Col>
        <FormInputRow form={form} setForm={setForm} field="weight" type="number" min={0} label={`Weight in ${form.weight_uom}`}/>
      </Col>
      <Col>
        <FormSelectRow form={form} setForm={setForm} field="weight_uom" label="Weight UOM" values={[
          {value:'kg', label:'kg'},
          {value:'lbs', label:'lbs'}
        ]}/>
      </Col>
    </Row>
    else if (luom === 'km' || luom === 'miles') return <Row key={i}>
      <Col>
        <FormInputRow form={form} setForm={setForm} field="distance" type="number" min={0} label={`Distance in ${form.distance_uom}`}/>
      </Col>
      <Col>
        <FormSelectRow form={form} setForm={setForm} field="distance_uom" label="Distance UOM" values={[
          {value:'km', label:'km'},
          {value:'mi', label:'miles'}
        ]}/>
      </Col>
    </Row>
    else return <FormInputRow key={i} form={form} setForm={setForm} field="activity_amount" type="number" min={0} label={uom}/>
 
  })}</>

}

const RequestAudit: FC<RequestAuditProps> = ({ provider, roles, signedInAddress, limitedMode }) => {

  const [emForm, setEmForm] = useState<EmissionsFactorForm>(defaultEmissionsFactorForm)
  const [emissionsFactor, setEmissionsFactor] = useState<EmissionsFactorInterface|null>(null)

  const level1sQuery = trpc.useQuery(['emissionsFactors.getLevel1s', {
    scope: 'Scope 3',
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor',
  })
  const level2sQuery = trpc.useQuery(['emissionsFactors.getLevel2s', {
    scope: 'Scope 3',
    level_1: emForm.level_1
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1,
  })
  const level3sQuery = trpc.useQuery(['emissionsFactors.getLevel3s', {
    scope: 'Scope 3',
    level_1: emForm.level_1,
    level_2: emForm.level_2
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1 && !!emForm.level_2,
  })
  const level4sQuery = trpc.useQuery(['emissionsFactors.getLevel4s', {
    scope: 'Scope 3',
    level_1: emForm.level_1,
    level_2: emForm.level_2,
    level_3: emForm.level_3
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1 && !!emForm.level_2 && !!emForm.level_3,
  })

  const lookupQuery = trpc.useQuery(['emissionsFactors.lookup', {
    scope: 'Scope 3',
    level_1: emForm.level_1,
    level_2: emForm.level_2,
    level_3: emForm.level_3,
    level_4: emForm.level_4,
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1 && emForm.level_1.length > 0,
  })

  const selectEmissionsFactor = (factor: EmissionsFactorInterface|null) => {
    setEmissionsFactor(factor)
    setEmForm({
      ...emForm,
      emissions_factor_uuid: factor?.uuid??'',
      activity_uom: factor?.activity_uom??''
    })
  }

  return roles.hasAnyRole ? (
    <>
      <h2>Request audit</h2>
      
      <FormSelectRow form={emForm} setForm={setEmForm} field="activity_type" label="Activity Type" values={[
        {value:'flight', label:'Flight'},
        {value:'shipment', label:'Shipment'},
        {value:'emissions_factor', label:'Emissions Factor'}
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


        {emForm.activity_type === 'emissions_factor' && <>
          {emForm.emissions_factor_uuid && emissionsFactor ? <>
            <h3>Emissions Factor</h3>
            <EmissionsFactor emissionsFactor={emissionsFactor}/>
            <Button className="mb-3 mt-1" onClick={_=>{ selectEmissionsFactor(null) }}>Select another Emssions Factor</Button>
            <EmissionsFactorUomInputs emissionsFactor={emissionsFactor} form={emForm} setForm={setEmForm}/>

            </> : <>
              <h3 id="lookupForm">Choose an emissions factor</h3>
              {level1sQuery.data && 
                <FormSelectRow form={emForm} setForm={setEmForm} field="level_1" label="Level 1" values={level1sQuery.data.emissionsFactors}/>
              }
              {emForm.level_1 && level2sQuery.data && 
                <FormSelectRow form={emForm} setForm={setEmForm} field="level_2" label="Level 2" values={level2sQuery.data.emissionsFactors}/>
              }
              {emForm.level_1 && emForm.level_2 && level3sQuery.data && 
                <FormSelectRow form={emForm} setForm={setEmForm} field="level_3" label="Level 3" values={level3sQuery.data.emissionsFactors}/>
              }
              {emForm.level_1 && emForm.level_2 && emForm.level_3 && level4sQuery.data && 
                <FormSelectRow form={emForm} setForm={setEmForm} field="level_4" label="Level 4" values={level4sQuery.data.emissionsFactors}/>
              }
              {lookupQuery.data ?
                <ListGroup className="mb-3" variant="flush">
                  {lookupQuery.data.emissionsFactors.map((o)=>
                    <ListGroup.Item key={o.uuid}action onClick={()=>{
                      selectEmissionsFactor(o)
                      console.log('selected emissions factor:', o)
                    }}>
                      <EmissionsFactorListItem emissionsFactor={o} href="#lookupForm" setForm={setEmForm} form={emForm} />
                    </ListGroup.Item>)}
                </ListGroup>
                : lookupQuery.isLoading && <div>
                  <span className="me-3">Fetching emissions factors ...</span>
                  <Spinner 
                    className="me-2"
                    animation="border" 
                    role="status"
                    size="sm"
                    aria-hidden="true"
                    />
                </div>}
              </>}

          </>}

        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Supporting Document</Form.Label>
          <Form.Control type="file" />
        </Form.Group>

        <Button 
          className="w-100"
          variant="success"
          size="lg"
          onClick={_=>{ console.log('Submit request for audit with ', emForm) }}>Submit Request</Button>
        </>}

      </>
  ) : (
    <p>You must be a registered user to request audits.</p>
  );
}

export default RequestAudit;

