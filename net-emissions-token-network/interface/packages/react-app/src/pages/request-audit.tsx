// SPDX-License-Identifier: Apache-2.0
import { ChangeEvent, FC, useMemo, useState } from "react";
import { Breadcrumb, Button, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";
import { trpc } from "../services/trpc";
import { EmissionsFactorInterface } from "../../../../../../data/postgres/node_modules/emissions_data_chaincode/src/lib/emissionsFactor";
import { FormAddressRow, FormInputRow, FormSelectRow, FormWalletRow } from "../components/forms-util";
import { createEmissionsRequest } from "../services/api.service";
import ErrorAlert from "../components/error-alert";
import SuccessAlert from "../components/success-alert";

type RequestAuditProps = {
  provider?: Web3Provider, 
  signedInAddress: string, 
  roles: RolesInfo,
  limitedMode: boolean
}

export type EmissionsFactorForm = {
  issued_from: string,
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
  from_address: string
  destination_address: string
  level_1: string
  level_2: string
  level_3: string
  level_4: string
  emissions_factor_uuid: string
}

const defaultEmissionsFactorForm: EmissionsFactorForm = {
  issued_from: '',
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
  from_address: '',
  destination_address: '',
  level_1: '',
  level_2: '',
  level_3: '',
  level_4: '',
  emissions_factor_uuid: '',
} as const;

type EmissionsFactorFormErrors = Partial<EmissionsFactorForm>&{supportingDoc?:string, hasErrors?: boolean}

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

function uomIsWeight(uom: string) {
  if (!uom) return false
  const luom = uom.toLowerCase()
  return (luom === 'kg' || luom === 'tonne' || luom === 'lbs')
}

function uomIsDistance(uom: string) {
  if (!uom) return false
  const luom = uom.toLowerCase()
  return (luom === 'km' || luom === 'miles' || luom === 'mi')
}

const EmissionsFactorUomInputs: FC<{
  emissionsFactor: EmissionsFactorInterface,
  setForm: React.Dispatch<React.SetStateAction<EmissionsFactorForm>>,
  form: EmissionsFactorForm,
  errors?: EmissionsFactorFormErrors
}> = ({emissionsFactor, form, setForm, errors}) => {
  if (!emissionsFactor || !emissionsFactor.activity_uom) return null;

  return <>{emissionsFactor.activity_uom.split('.').map((uom,i)=>{
    const luom = uom.toLowerCase()
    if (luom === 'passenger') return <FormInputRow key={i} form={form} setForm={setForm} field="num_passengers" type="number" min={0} label="Number of Passengers" required errors={errors}/>
    else if (uomIsWeight(uom)) return <Row key={i}>
      <Col>
        <FormInputRow form={form} setForm={setForm} field="weight" type="number" min={0} step="any" label={`Weight in ${form.weight_uom}`} required errors={errors}/>
      </Col>
      <Col>
        <FormSelectRow form={form} setForm={setForm} field="weight_uom" label="Weight UOM" required errors={errors} values={[
          {value:'kg', label:'kg'},
          {value:'lbs', label:'lbs'}
        ]}/>
      </Col>
    </Row>
    else if (uomIsDistance(uom)) return <Row key={i}>
      <Col>
        <FormInputRow form={form} setForm={setForm} field="distance" type="number" min={0} step="any" label={`Distance in ${form.distance_uom}`} required errors={errors}/>
      </Col>
      <Col>
        <FormSelectRow form={form} setForm={setForm} field="distance_uom" label="Distance UOM" required errors={errors} values={[
          {value:'km', label:'km'},
          {value:'mi', label:'miles'}
        ]}/>
      </Col>
    </Row>
    else return <FormInputRow key={i} form={form} setForm={setForm} field="activity_amount" type="number" min={0} step="any" label={uom} required errors={errors}/>
 
  })}</>
}

type SuccessResultType = {
  distance: {
    unit: string,
    value: number
  }
  emissions: {
    unit: string,
    value: number
  }
}

const RequestAudit: FC<RequestAuditProps> = ({ roles, signedInAddress }) => {

  const [emForm, setEmForm] = useState<EmissionsFactorForm>(defaultEmissionsFactorForm)
  function resetForm() {
    setValidated(false)
    setEmForm(defaultEmissionsFactorForm)
    setSupportingDoc(null)
    setTopError('')
    setTopSuccess(null)
  }
  const [emissionsFactor, setEmissionsFactor] = useState<EmissionsFactorInterface|null>(null)
  const [supportingDoc, setSupportingDoc] = useState<File|null>(null)
  const [validated, setValidated] = useState(false)
  const [formErrors, setFormErrors] = useState<EmissionsFactorFormErrors>({})
  const [topError, setTopError] = useState('')
  const [topSuccess, setTopSuccess] = useState<SuccessResultType|null>(null)
  const [loading, setLoading] = useState(false);

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

  // Form validation logic
  const formNotReady = useMemo(()=>{
    console.log('Check if form is ready?', emForm, supportingDoc)
    const errors:EmissionsFactorFormErrors = {}
    if (!supportingDoc || !supportingDoc.name) {
      // must give a file
      errors.supportingDoc = 'A supporting document is required';
      errors.hasErrors = true
    }
    if (!emForm.activity_type) {
      errors.hasErrors = true
    } else if (emForm.activity_type === 'shipment') {
      if (!emForm.shipment_mode) {
        if (!emForm.ups_tracking) {
          errors.ups_tracking = 'A UPS tracking code is required'
          errors.hasErrors = true
        }
      } else {
        // need to have a valid weight set
        if (!emForm.weight || Number(emForm.weight) <= 0) {
          errors.weight = 'A valid weight is required'
          errors.hasErrors = true
        }
        // need proper origin
        if (!emForm.from_address) {
          errors.from_address = 'A valid from address is required'
          errors.hasErrors = true
        }
        // need proper destination
        if (!emForm.destination_address) {
          errors.destination_address = 'A valid destination address is required'
          errors.hasErrors = true
        }
      }
    } else if (emForm.activity_type === 'flight') {

        // need to have a valid number of passengers
        if (!emForm.num_passengers || Number(emForm.num_passengers) <= 0 || !Number.isInteger(Number(emForm.num_passengers)) ) {
          errors.num_passengers = 'A valid number of passenger is required'
          errors.hasErrors = true
        }
        // need proper origin
        if (!emForm.from_address) {
          errors.from_address = 'A valid from airport is required'
          errors.hasErrors = true
        }
        // need proper destination
        if (!emForm.destination_address) {
          errors.destination_address = 'A valid destination airport is required'
          errors.hasErrors = true
        }
    } else if (emForm.activity_type === 'emissions_factor') {
      // a selected emissions factor is required
      if (!emForm.emissions_factor_uuid) {
        errors.emissions_factor_uuid = 'A valid emissions factor is required'
        errors.hasErrors = true
      }
      // all uom fields are required
      const uoms = emForm.activity_uom?.split('.') || []
      for (const uom of uoms) {
        const luom = uom.toLowerCase()
        if (luom === 'passenger') {
          if (!emForm.num_passengers || Number(emForm.num_passengers) <= 0 || !Number.isInteger(Number(emForm.num_passengers)) ) {
            errors.num_passengers = 'A valid number of passenger is required'
            errors.hasErrors = true
          }
        } else if (uomIsWeight(uom)) {
          if (!emForm.weight || Number(emForm.weight) <= 0) {
            errors.weight = 'A valid weight is required'
            errors.hasErrors = true
          }
        } else if (uomIsDistance(uom)) {
          if (!emForm.distance || Number(emForm.distance) <= 0) {
            errors.distance = 'A valid distance is required'
            errors.hasErrors = true
          }
        } else {
          if (!emForm.activity_amount || Number(emForm.activity_amount) <= 0) {
            errors.activity_amount = 'A valid amount is required'
            errors.hasErrors = true
          }
        }
      }


    }
    setFormErrors(errors)
    return !!errors.hasErrors
  }, [emForm, supportingDoc])

  return roles.hasAnyRole ? (
    <>
      <h2>Request audit</h2>
      <Form
        onSubmit={async(e)=>{
          // always stop the event as we handle all in this function
          e.preventDefault()
          e.stopPropagation()
          const form = e.currentTarget
          let valid = true
          if (form.checkValidity() === false || formNotReady) {
            valid = false
          }
          // mark the form to render validation errors
          setValidated(true)
          setTopError('')
          setTopSuccess(null)
          if (valid) {
            setLoading(true)
            console.log('Form valid, submit with', emForm, supportingDoc)
            try {
              const res = await createEmissionsRequest(emForm, supportingDoc!, signedInAddress)
              console.log('Form results ', res, res.result.distance, res.result.emissions?.amount)
              setTopSuccess({distance: res?.result?.distance, emissions: res?.result?.emissions?.amount})
            } catch (err) {
              console.warn('Form error ', err)
              setTopError(err instanceof Error ? err.message : String(err))
            } finally {
              setLoading(false)
            }
            // resetForm()
          } else {
            console.log('Form invalid, check errors:', formErrors)
          }
        }}
        noValidate validated={validated}>
        
        <FormWalletRow form={emForm} setForm={setEmForm} errors={formErrors} field="issued_from" label="Issue From Address" showValidation={validated} />

        <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="activity_type" label="Activity Type" values={[
          {value:'flight', label:'Flight'},
          {value:'shipment', label:'Shipment'},
          {value:'emissions_factor', label:'Emissions Factor'}
        ]} onChange={_=>{ setValidated(false) }}/>

        {!!emForm.activity_type && <>
          {emForm.activity_type === 'shipment' && <>
            <h3>Shipment Details</h3>
            <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="shipment_mode" label="Shipping Mode" placeholder="Use UPS Tracking Number" values={[
              {value:'air', label:'Air'},
              {value:'ground', label:'Ground'},
              {value:'sea', label:'Sea'}
            ]}/>
            {!emForm.shipment_mode && <>
              <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="ups_tracking" label="UPS Tracking Number" required/>
              </>}
            {!!emForm.shipment_mode && <>
              <Row>
                <Col>
                  <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="weight" type="number" min={0} step="any" required label={`Weight in ${emForm.weight_uom}`}/>
                </Col>
                <Col>
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="weight_uom" label="Weight UOM" required values={[
                    {value:'kg', label:'kg'},
                    {value:'lbs', label:'lbs'}
                  ]}/>
                </Col>
              </Row>
              <h4>From</h4>
              <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors}  field="from_address" label="From Address" required showValidation={validated}/>
              <h4>Destination</h4>
              <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors} field="destination_address" label="Destination Address" required showValidation={validated}/>
              </>}
            </>}


          {emForm.activity_type === 'flight' && <>
            <h3>Flight Details</h3>
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="flight_carrier" label="Carrier"/>
            <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="flight_service_level" label="Flight Class" required values={[
              {value:'economy', label:'Economy'},
              {value:'premium economy', label:'Premium Economy'},
              {value:'business', label:'Business'},
              {value:'first', label:'First'}
            ]}/>
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="num_passengers" type="number" min={1} label="Number of Passengers" required/>
            <h4>From</h4>
            <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors} types={['airport']} field="from_address" label="From Airport" required showValidation={validated}/>
            <h4>Destination</h4>
            <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors} types={['airport']} field="destination_address" label="Destination Airport" required showValidation={validated}/>
            </>}


          {emForm.activity_type === 'emissions_factor' && <>
            {emForm.emissions_factor_uuid && emissionsFactor ? <>
              <h3>Emissions Factor</h3>
              <EmissionsFactor emissionsFactor={emissionsFactor}/>
              <Button className="mb-3 mt-1" onClick={_=>{ selectEmissionsFactor(null) }}>Select another Emssions Factor</Button>
              <EmissionsFactorUomInputs emissionsFactor={emissionsFactor} form={emForm} setForm={setEmForm} errors={formErrors}/>

              </> : <>
                <h3 id="lookupForm">Choose an emissions factor</h3>
                {level1sQuery.data && 
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_1" label="Level 1" values={level1sQuery.data.emissionsFactors}/>
              }
                {emForm.level_1 && level2sQuery.data && 
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_2" label="Level 2" values={level2sQuery.data.emissionsFactors}/>
              }
                {emForm.level_1 && emForm.level_2 && level3sQuery.data && 
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_3" label="Level 3" values={level3sQuery.data.emissionsFactors}/>
              }
                {emForm.level_1 && emForm.level_2 && emForm.level_3 && level4sQuery.data && 
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_4" label="Level 4" values={level4sQuery.data.emissionsFactors}/>
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

          <Form.Group controlId="supportingDoc" className="mb-3">
            <Form.Label>Supporting Document</Form.Label>
            {supportingDoc && supportingDoc.name ? 
              <p><i>File:</i> <b>{supportingDoc.name}</b> ({supportingDoc.size} bytes) <Button className="ms-2" variant="outline-secondary" size="sm" onClick={_=>{setSupportingDoc(null)}}>Clear</Button></p> :
              <Form.Control required type="file" onChange={(e:ChangeEvent<HTMLInputElement>)=>{ setSupportingDoc(e.currentTarget.files?e.currentTarget.files[0]:null) }} />}
            <Form.Control.Feedback type="invalid">
              {(formErrors && formErrors.supportingDoc) || "This value is required"}
            </Form.Control.Feedback>
          </Form.Group>

          {topError && <ErrorAlert error={topError} />}

          {topSuccess ?
            <SuccessAlert title="Request Submitted Successfully" onDismiss={()=>{resetForm()}}>
              <div>Calculated distance: {topSuccess.distance?.value?.toFixed(3)} {topSuccess.distance?.unit}</div>
              <div>Calculated emissions: {topSuccess.emissions?.value?.toFixed(3)} {topSuccess.emissions?.unit}CO2e</div>
            </SuccessAlert>
            : 

            <Button 
              className="w-100"
              variant="success"
              size="lg"
              disabled={loading}
              onClick={e=>{ e.currentTarget?.form?.checkValidity(); setValidated(true); }}
              type="submit"
            >
              {loading ? 
                <Spinner 
                  animation="border" 
                  className="me-2"
                  size="sm"   
                  as="span"
                  role="status"
                  aria-hidden="true"
                  /> : <></>
            }
              Submit Request
            </Button>
        }
          </>}
      </Form>
      </>
  ) : (
    <p>You must be a registered user to request audits.</p>
  );
}

export default RequestAudit;

