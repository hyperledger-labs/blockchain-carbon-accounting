// SPDX-License-Identifier: Apache-2.0
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumb, Button, Col, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import { Web3Provider,JsonRpcProvider } from "@ethersproject/providers";
import { RolesInfo } from "../components/static-data";
import { trpc, trpcClient } from "../services/trpc";
import type { EmissionsFactorInterface } from '@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor';
import { FormAddressRow, FormInputRow, FormSelectRow, FormWalletRow } from "../components/forms-util";
import { calculateEmissionsRequest, createEmissionsRequest } from "../services/api.service";
import ErrorAlert from "../components/error-alert";
import SuccessAlert from "../components/success-alert";
import { Link } from "wouter";
import AsyncButton from "../components/AsyncButton";

type RequestAuditProps = {
  provider?: Web3Provider | JsonRpcProvider,
  signedInAddress: string,
  roles: RolesInfo,
  limitedMode: boolean
}


type ShipmentMode = 'air' | 'ground' | 'sea' | '';
type ActivityType = 'flight' | 'shipment' | 'emissions_factor' | 'natural_gas' | 'electricity' | 'other' |''

export type EmissionsFactorForm = {
  issued_from: string,
  activity_type: ActivityType
  ups_tracking: string
  shipment_mode: ShipmentMode
  weight: string
  weight_uom: 'kg' | 'lbs'
  distance: string
  distance_uom: 'km' | 'miles'
  activity_amount: string
  activity_uom: string
  country: string
  state: string
  utility: string
  carrier: string
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
  country: '',
  state: '',
  utility: '',
  carrier: '',
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
    <Breadcrumb.Item active>{emissionsFactor.text} / {emissionsFactor.year} /  <b>{Number(emissionsFactor.co2_equivalent_emissions).toFixed(5)} {emissionsFactor.co2_equivalent_emissions_uom}</b> per <b>{emissionsFactor.activity_uom}</b></Breadcrumb.Item>
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
    <Breadcrumb.Item active>{emissionsFactor.text} / {emissionsFactor.year} / <b>{Number(emissionsFactor.co2_equivalent_emissions).toFixed(5)} {emissionsFactor.co2_equivalent_emissions_uom}</b> per <b>{emissionsFactor.activity_uom}</b></Breadcrumb.Item>
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

function getActivitiesTypes(signedInAddress?: string) {
  const atypes = [
            {value:'flight', label:'Flight'},
            {value:'shipment', label:'Shipment' },
            {value:'electricity', label:'Electricity' },
            {value:'natural_gas', label:'Natural Gas' },
            {value:'emissions_factor', label:'Emissions Factor'}
          ]

  if (signedInAddress) {
    atypes.push({value:'other', label:'Other'});
  }
  return atypes;
}

const EmissionsFactorUomInputs: FC<{
  emissionsFactor: EmissionsFactorInterface,
  setForm: React.Dispatch<React.SetStateAction<EmissionsFactorForm>>,
  form: EmissionsFactorForm,
  disabled?: boolean,
  errors?: EmissionsFactorFormErrors
}> = ({emissionsFactor, form, setForm, errors, disabled}) => {
  if (!emissionsFactor || !emissionsFactor.activity_uom) return null;

  return <>{emissionsFactor.activity_uom.split('.').map((uom,i)=>{
    const luom = uom.toLowerCase()
    if (luom === 'passenger') return <FormInputRow key={i} form={form} setForm={setForm} field="num_passengers" type="number" min={0} label="Number of Passengers" required errors={errors} disabled={disabled}/>
    else if (uomIsWeight(uom)) return <Row key={i}>
      <Col>
        <FormInputRow form={form} setForm={setForm} field="weight" type="number" min={0} step="any" label={`Weight in ${form.weight_uom}`} required errors={errors} disabled={disabled}/>
      </Col>
      <Col>
        <FormSelectRow form={form} setForm={setForm} field="weight_uom" label="Weight UOM" required errors={errors} disabled={disabled} values={[
          {value:'kg', label:'kg'},
          {value:'lbs', label:'lbs'}
        ]}/>
      </Col>
    </Row>
    else if (uomIsDistance(uom)) return <Row key={i}>
      <Col>
        <FormInputRow form={form} setForm={setForm} field="distance" type="number" min={0} step="any" label={`Distance in ${form.distance_uom}`} required errors={errors} disabled={disabled}/>
      </Col>
      <Col>
        <FormSelectRow form={form} setForm={setForm} field="distance_uom" label="Distance UOM" required errors={errors} disabled={disabled} values={[
          {value:'km', label:'km'},
          {value:'mi', label:'miles'}
        ]}/>
      </Col>
    </Row>
    else return <FormInputRow key={i} form={form} setForm={setForm} field="activity_amount" type="number" min={0} step="any" label={uom} required errors={errors} disabled={disabled}/>

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
  title?: string
}

const RequestAudit: FC<RequestAuditProps> = ({ signedInAddress }) => {

  const [emForm, setEmForm] = useState<EmissionsFactorForm>(defaultEmissionsFactorForm)
  function resetForm() {
    setValidated(false)
    setEmForm(defaultEmissionsFactorForm)
    setSupportingDoc(null)
    setTopError('')
    setTopSuccess(null)
    setFromDate(null)
    setThruDate(null)
  }
  const [emissionsFactor, setEmissionsFactor] = useState<EmissionsFactorInterface|null>(null)
  const [supportingDoc, setSupportingDoc] = useState<File|null>(null)
  const [validated, setValidated] = useState(false)
  const [formErrors, setFormErrors] = useState<EmissionsFactorFormErrors>({})
  const [topError, setTopError] = useState('')
  const [topSuccess, setTopSuccess] = useState<SuccessResultType|null>(null)
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date|null>(null);
  const [thruDate, setThruDate] = useState<Date|null>(null);


  const selectEmissionsFactor = useCallback((factor: EmissionsFactorInterface|null) => {
    setEmissionsFactor(factor)
    setEmForm(e=>{return {
      ...e,
      emissions_factor_uuid: factor?.uuid??'',
      activity_uom: factor?.activity_uom??''
    }})
  }, []);

  useEffect(()=>{
    // if we had saved emissionsRequest and we got redirected
    // we can auto restore the latest saved request
    const ls = localStorage.getItem('emissionsRequest')
    const stored = ls ? JSON.parse(ls) : []
    const fromAudit = localStorage.getItem('fromAudit')
    if (fromAudit && stored.length > 0 && signedInAddress) {
      localStorage.removeItem('fromAudit')
      // restore the last one (should only store one anyway)
      const i = ''+(stored.length-1);
      const f = {...stored[i].request }
      console.log('Switch to previous request ', f)
      if (f.emissions_factor_uuid) {
        trpcClient.query('emissionsFactors.get', { uuid: f.emissions_factor_uuid }).then((factor)=>{
          if (factor?.emissionsFactor) {
            selectEmissionsFactor(factor.emissionsFactor)
          }
        });
      }
      setEmForm(f)
    }
  }, [selectEmissionsFactor, signedInAddress])

  const level1sQuery = trpc.useQuery(['emissionsFactors.getLevel1s', {}], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor',
  })
  const level2sQuery = trpc.useQuery(['emissionsFactors.getLevel2s', {
    level_1: emForm.level_1
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1,
  })
  const level3sQuery = trpc.useQuery(['emissionsFactors.getLevel3s', {
    level_1: emForm.level_1,
    level_2: emForm.level_2
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1 && !!emForm.level_2,
  })
  const level4sQuery = trpc.useQuery(['emissionsFactors.getLevel4s', {
    level_1: emForm.level_1,
    level_2: emForm.level_2,
    level_3: emForm.level_3
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1 && !!emForm.level_2 && !!emForm.level_3,
  })

  const lookupQuery = trpc.useQuery(['emissionsFactors.lookup', {
    level_1: emForm.level_1,
    level_2: emForm.level_2,
    level_3: emForm.level_3,
    level_4: emForm.level_4,
    from_year: fromDate ? fromDate.getFullYear().toString() : undefined,
    thru_year: thruDate ? thruDate.getFullYear().toString() : undefined
  }], {
    enabled: !emForm.emissions_factor_uuid && emForm.activity_type === 'emissions_factor' && !!emForm.level_1 && emForm.level_1.length > 0,
  })

  const electricityCountriesQuery = trpc.useQuery(['emissionsFactors.getElectricityCountries', {
  }], {
    enabled: emForm.activity_type === 'electricity',
  })
  const electricityUSAStatesQuery = trpc.useQuery(['emissionsFactors.getElectricityUSAStates'], {
    enabled: emForm.activity_type === 'electricity' && emForm.country.toUpperCase() === 'UNITED STATES',
  })
  const electricityUSAUtilitiesQuery = trpc.useQuery(['emissionsFactors.getElectricityUSAUtilities', {
    state_province: emForm.state,
    from_year: fromDate ? fromDate.getFullYear().toString() : undefined,
    thru_year: thruDate ? thruDate.getFullYear().toString() : undefined
  }], {
    enabled: emForm.activity_type === 'electricity' && emForm.country.toUpperCase() === 'UNITED STATES' && !!emForm.state,
  })

  const electricityFactorQuery = trpc.useQuery(['emissionsFactors.lookup', emForm.country.toUpperCase() === 'UNITED STATES' ? {
    level_1: 'eGRID EMISSIONS FACTORS',
    level_2: 'USA',
    level_3: 'STATE: ' + emForm.state,
    activity_uom: 'mwh',
    from_year: fromDate ? fromDate.getFullYear().toString() : undefined,
    thru_year: thruDate ? thruDate.getFullYear().toString() : undefined,
    // this needs a fallback query when no state factors are found
    fallback: {
      level_1: 'eGRID EMISSIONS FACTORS',
      level_2: 'USA',
      level_3: 'COUNTRY: USA',
      activity_uom: 'mwh',
      from_year: fromDate ? fromDate.getFullYear().toString() : undefined,
      thru_year: thruDate ? thruDate.getFullYear().toString() : undefined,
    }
  } : {
    level_1: 'EEA EMISSIONS FACTORS',
    level_2: emForm.country,
    level_3:'COUNTRY: ' + emForm.country,
    from_year: fromDate ? fromDate.getFullYear().toString() : undefined,
    thru_year: thruDate ? thruDate.getFullYear().toString() : undefined,
  }], {
    enabled: emForm.activity_type === 'electricity' && !!emForm.country && (
      emForm.country.toUpperCase() !== 'UNITED STATES'
      || (!!emForm.state && !!emForm.utility)
    ),
  })

  const gasFactorQuery = trpc.useQuery(['emissionsFactors.lookup', {
    level_1: 'FUELS',
    level_2: 'GASEOUS FUELS',
    level_3: 'NATURAL GAS',
    activity_uom: 'cubic metres',
    from_year: fromDate ? fromDate.getFullYear().toString() : undefined,
    thru_year: thruDate ? thruDate.getFullYear().toString() : undefined,
  }], {
    enabled: emForm.activity_type === 'natural_gas',
  })

  // Form validation logic
  const formNotReady = useMemo(()=>{
    console.log('Check if form is ready?', emForm, supportingDoc)
    const errors:EmissionsFactorFormErrors = {}
    if (signedInAddress && (!supportingDoc || !supportingDoc.name)) {
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
    } else if (emForm.activity_type === 'natural_gas') {
      // need to have a valid quantity
      if (!emForm.activity_amount || Number(emForm.activity_amount) <= 0) {
        errors.activity_amount = 'A valid amount is required'
        errors.hasErrors = true
      }
    } else if (emForm.activity_type === 'electricity') {
      // need to have a valid quantity
      if (!emForm.activity_amount || Number(emForm.activity_amount) <= 0) {
        errors.activity_amount = 'A valid amount is required'
        errors.hasErrors = true
      }
      // must have a country
      if (!emForm.country) {
        errors.country = 'A valid country is required'
        errors.hasErrors = true
      }
      // USAS must have a state and utility as well
      if (emForm.country === 'UNITED STATES') {
        if (!emForm.state) {
          errors.state = 'A valid state is required'
          errors.hasErrors = true
        }
        if (!emForm.utility) {
          errors.utility = 'A valid utility is required'
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
  }, [emForm, supportingDoc, signedInAddress])

  // Form submit
  const handleSubmit = async(e:any)=>{
    // autoselect emissionsFactor when drilled down to only one choice if this mode was selected
    if (emForm.activity_type === 'emissions_factor' && !emForm.emissions_factor_uuid && lookupQuery.data?.emissionsFactors.length === 1) {
      selectEmissionsFactor(lookupQuery.data.emissionsFactors[0])
    }
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
        // registered users will create an emissions request, non-registered users will just
        // get the calculated emissions
        const res = signedInAddress ?
          await createEmissionsRequest(emForm, supportingDoc!, signedInAddress, fromDate, thruDate)
          : await calculateEmissionsRequest(emForm, fromDate, thruDate)
        console.log('Form results ', res, res.result.distance, res.result.emissions?.amount)
        const distance = res?.result?.distance
        const emissions = res?.result?.emissions?.amount
        if (signedInAddress) {
          setTopSuccess({ distance, emissions })
          // remove the saved emissions request
          localStorage.removeItem('emissionsRequest')
        } else {
          // save the request in local storage so we can restore it after the user signs in
          const stored = [{request: {...emForm}, result: { emissions, distance }}];
          localStorage.setItem('emissionsRequest', JSON.stringify(stored))
          setTopSuccess({ distance, emissions, title: 'Emissions calculated' })
        }
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
  }

  return (
    <>
      {!signedInAddress && <div>
        <h2>Welcome to Blockchain Carbon Accounting</h2>

        <p>If you already have a wallet on the Avalanche Fuji Testnet, you can connect to it with Metamask now to login.  If you don't have a wallet yet, you can <a rel="noreferrer" target="_blank" href="https://umbria.network/connect/avalanche-fuji-testnet">follow these instructions to get a wallet</a>.  Then please <a rel="noreferrer" target="_blank" href="https://www.opensourcestrategies.com/contact-us/">contact us</a> so we can register your wallet on the network.</p>
        <p>You can also <Link href="/sign-up">Sign Up</Link> with your email to get an account and try it out.</p>

        <p>Or you can start here to get an emissions estimate here, then request an emissions audit based on the result:</p>

      </div>}
      <h3>Request audit</h3>
      <Form
        onSubmit={handleSubmit}
        noValidate validated={validated}>

        { signedInAddress &&
        <FormWalletRow form={emForm} setForm={setEmForm} errors={formErrors} field="issued_from" label="Issue From Address" showValidation={validated} disabled={!!topSuccess} onWalletChange={(w)=>{
          setEmForm({
            ...emForm,
            issued_from: w?.address ?? '',
            flight_carrier: w?.organization ?? '',
            carrier: w?.organization ?? ''
          })
        }} /> }
        <Row>
          <Form.Group as={Col} className="mb-3" controlId="fromDateInput">
            <Form.Label>From date</Form.Label>
            {/* @ts-ignore : some weird thing with the types ... */}
            {!topSuccess ? <Datetime disabled={!!topSuccess} onChange={(moment)=>{setFromDate((typeof moment !== 'string') ? moment.toDate() : null)}}/> :
              <Form.Control disabled value={fromDate?.toLocaleString() || ''}/>}
          </Form.Group>
          <Form.Group as={Col} className="mb-3" controlId="thruDateInput">
            <Form.Label>Through date</Form.Label>
            {/* @ts-ignore : some weird thing with the types ... */}
            {!topSuccess ? <Datetime disabled={!!topSuccess} onChange={(moment)=>{setThruDate((typeof moment !== 'string') ? moment.toDate() : null)}}/> :
              <Form.Control disabled value={thruDate?.toLocaleString() || ''}/>}
          </Form.Group>
        </Row>
        <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="activity_type" label="Activity Type" disabled={!!topSuccess}
          values={getActivitiesTypes(signedInAddress)}
          onChange={_=>{ setValidated(false) }}
          alsoSet={{
            'electricity': {activity_uom: 'kwh'},
            'natural_gas': {activity_uom: 'therm'},
          }}/>

        {!!emForm.activity_type && <>
          {emForm.activity_type === 'shipment' && <>
            <h3>Shipment Details</h3>
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="carrier" label="Carrier" disabled={!!topSuccess}/>
            <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="shipment_mode" label="Shipping Mode" placeholder="Use UPS Tracking Number" disabled={!!topSuccess}
              values={[
              {value:'air', label:'Air'},
              {value:'ground', label:'Ground'},
              {value:'sea', label:'Sea'}
            ]}
              alsoSet={{
                '*': {ups_tracking: ''},
              }}
            />
            {!emForm.shipment_mode && <>
              <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="ups_tracking" label="UPS Tracking Number" required disabled={!!topSuccess}/>
              </>}
            {!!emForm.shipment_mode && <>
              <Row>
                <Col>
                  <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="weight" type="number" min={0} step="any" required label={`Weight in ${emForm.weight_uom}`} disabled={!!topSuccess}/>
                </Col>
                <Col>
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="weight_uom" label="Weight UOM" required disabled={!!topSuccess} values={[
                    {value:'kg', label:'kg'},
                    {value:'lbs', label:'lbs'}
                  ]}/>
                </Col>
              </Row>
              <h4>From</h4>
              <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors}  field="from_address" label="From Address" required disabled={!!topSuccess} showValidation={validated}/>
              <h4>Destination</h4>
              <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors} field="destination_address" label="Destination Address" required disabled={!!topSuccess} showValidation={validated}/>
              </>}
            </>}


          {emForm.activity_type === 'flight' && <>
            <h3>Flight Details</h3>
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="flight_carrier" label="Carrier" disabled={!!topSuccess}/>
            <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="flight_service_level" label="Flight Class" required disabled={!!topSuccess} values={[
              {value:'economy', label:'Economy'},
              {value:'premium economy', label:'Premium Economy'},
              {value:'business', label:'Business'},
              {value:'first', label:'First'}
            ]}/>
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="num_passengers" type="number" min={1} label="Number of Passengers" required disabled={!!topSuccess}/>
            <h4>From</h4>
            <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors} types={['airport']} field="from_address" label="From Airport" required disabled={!!topSuccess} showValidation={validated}/>
            <h4>Destination</h4>
            <FormAddressRow form={emForm} setForm={setEmForm} errors={formErrors} types={['airport']} field="destination_address" label="Destination Airport" required disabled={!!topSuccess} showValidation={validated}/>
            </>}

          {emForm.activity_type === 'electricity' && <>
            {(emForm.country.toUpperCase() !== 'UNITED STATES' || !!emForm.utility) && !!electricityFactorQuery.data?.emissionsFactors?.length && <>
              <h3>Emissions Factor</h3>
              <EmissionsFactor emissionsFactor={electricityFactorQuery.data.emissionsFactors[0]}/>
              </>}
            <h3>Consumption Details</h3>
            <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="country" label="Country" required
              values={electricityCountriesQuery?.data?.countries.map(c=>{ return {label: c.toLowerCase().replaceAll('_', ' '), value: c } }) ?? []}
              disabled={!!topSuccess} />
            {emForm.country === 'UNITED STATES' && <>
              <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="state" label="State" required values={electricityUSAStatesQuery?.data?.states ?? []} disabled={!!topSuccess}
                  alsoSet={{
                    '*': {utility: ''},
                  }} />
              {emForm.state ?
                <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="utility" label="Utility" required values={electricityUSAUtilitiesQuery?.data?.utilities?.map(
                  (u) => { return  {label: u.utility_name?.replaceAll('_', ' ') || u.uuid, value: u.uuid} }
                ) ?? []} disabled={!!topSuccess}/>
                : <div>Select a State</div>
              }
            </>}
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="activity_amount" type="number" min={0} step="any" required label={`Amount in kWH`} disabled={!!topSuccess}/>
            </>}

          {emForm.activity_type === 'natural_gas' && <>
            {!!gasFactorQuery.data?.emissionsFactors?.length && <>
              <h3>Emissions Factor</h3>
              <EmissionsFactor emissionsFactor={gasFactorQuery.data.emissionsFactors[0]}/>
              </>}
            <h3>Consumption Details</h3>
            <FormInputRow form={emForm} setForm={setEmForm} errors={formErrors} field="activity_amount" type="number" min={0} step="any" required disabled={!!topSuccess} label={`Volume in Therm`}/>
            </>}

          {emForm.activity_type === 'emissions_factor' && <>
            {emForm.emissions_factor_uuid && emissionsFactor ? <>
              <h3>Emissions Factor</h3>
              <EmissionsFactor emissionsFactor={emissionsFactor}/>
              {!topSuccess && <Button className="mb-3 mt-1" onClick={_=>{ selectEmissionsFactor(null) }}>Select another Emssions Factor</Button>}

              <EmissionsFactorUomInputs emissionsFactor={emissionsFactor} form={emForm} setForm={setEmForm} errors={formErrors} disabled={!!topSuccess}/>

              </> : <>

                <h3 id="lookupForm">Choose an emissions factor</h3>
                {level1sQuery.data &&
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_1" label="Level 1" values={level1sQuery.data.emissionsFactors} disabled={!!topSuccess}
                    alsoSet={{'*': {level_2:'', level_3: '', level_4: ''}}}
                  />
              }
                {emForm.level_1 && level2sQuery.data &&
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_2" label="Level 2" values={level2sQuery.data.emissionsFactors} disabled={!!topSuccess}
                    alsoSet={{'*': {level_3: '', level_4: ''}}}
                  />
              }
                {emForm.level_1 && emForm.level_2 && level3sQuery.data &&
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_3" label="Level 3" values={level3sQuery.data.emissionsFactors} disabled={!!topSuccess}
                    alsoSet={{'*': {level_4: ''}}}
                  />
              }
                {emForm.level_1 && emForm.level_2 && emForm.level_3 && level4sQuery.data && level4sQuery.data.emissionsFactors.length > 1 &&
                  <FormSelectRow form={emForm} setForm={setEmForm} errors={formErrors} field="level_4" label="Level 4" values={level4sQuery.data.emissionsFactors} disabled={!!topSuccess}/>
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
                {validated && formErrors && formErrors.emissions_factor_uuid && <>
                  <span className="is-invalid"></span>
                  <Form.Control.Feedback type="invalid">
                    {(formErrors && formErrors.emissions_factor_uuid) || "This value is required"}
                  </Form.Control.Feedback></>}
                </>}

            </>}

          { signedInAddress &&
          <Form.Group controlId="supportingDoc" className="mb-3">
            <Form.Label>Supporting Document</Form.Label>
            {supportingDoc && supportingDoc.name ?
              <p><i>File:</i> <b>{supportingDoc.name}</b> ({supportingDoc.size} bytes) <Button className="ms-2" variant="outline-secondary" size="sm" disabled={!!topSuccess} onClick={_=>{setSupportingDoc(null)}}>Clear</Button></p> :
              <Form.Control required disabled={!!topSuccess} type="file" onChange={(e:ChangeEvent<HTMLInputElement>)=>{ setSupportingDoc(e.currentTarget.files?e.currentTarget.files[0]:null) }} />}
            <Form.Control.Feedback type="invalid">
              {(formErrors && formErrors.supportingDoc) || "This value is required"}
            </Form.Control.Feedback>
          </Form.Group>}

          {topError && <ErrorAlert error={topError} onDismiss={()=>{resetForm()}} />}

          {topSuccess ? <>
            <SuccessAlert title={topSuccess.title || "Request Submitted Successfully"} onDismiss={()=>{resetForm()}}>
              {topSuccess.distance && <div>Calculated distance: {topSuccess.distance?.value?.toFixed(3)} {topSuccess.distance?.unit}</div>}
              <div>Calculated emissions: {topSuccess.emissions?.value?.toFixed(3)} {topSuccess.emissions?.unit}{topSuccess.emissions?.unit.endsWith('CO2e')?'':'CO2e'}</div>
            </SuccessAlert>
            {!signedInAddress && <Link href="/sign-up" onClick={()=>{localStorage.setItem('fromAudit', 'true')}}><Button className="w-100" size="lg" variant="primary">Sign Up to Request to Audit</Button></Link>}
            </> :

            <AsyncButton
              className="w-100"
              variant="success"
              loading={loading}
              type="submit"
            >{ signedInAddress ? "Request Audit" : "Estimate Emissions" }</AsyncButton>
        }
          </>}
      </Form>
      <div>
       <br/><br/><br/><p>Questions?&nbsp;&nbsp;  Check out our <a rel="noreferrer" target="_blank" href="https://discord.gg/7jmwnTyyQ8">Discord channel</a>.
       </p>
      </div>
      </>
  );
}

export default RequestAudit;
