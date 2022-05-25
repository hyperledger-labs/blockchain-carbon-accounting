import { CSSProperties, ElementType, PropsWithChildren } from "react";
import { FloatingLabel, Form, InputGroup } from "react-bootstrap";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import WalletLookupInput from "../components/wallet-lookup-input";
import { Wallet } from "./static-data";


type GenericForm = {
  [P in string]: string
}

type FormInputRowProps<T extends GenericForm, T2 extends Partial<T>> = {
  form: T,
  setForm: React.Dispatch<React.SetStateAction<T>>,
  field: keyof T & string,
  label: string
  type?: 'input' | 'number' | 'password' | 'email'
  as?: ElementType,
  min?: number,
  minlength?: number,
  max?: number,
  step?: number | 'any',
  placeholder?: string,
  style?: CSSProperties,
  required?: boolean,
  disabled?: boolean,
  errors?: T2,
  onChange?: (value: string)=>void
};

type FormWalletRowProps<T extends GenericForm, T2 extends Partial<T>> = {
  form: T,
  setForm: React.Dispatch<React.SetStateAction<T>>,
  field: keyof T & string,
  label: string
  errors?: T2,
  showValidation?: boolean
  disabled?: boolean,
  onChange?: (value: string)=>void
  onWalletChange?: (value: Wallet | null)=>void
};

type FormAddressRowProps<T extends GenericForm, T2 extends Partial<T>> = {
  form: T,
  setForm: React.Dispatch<React.SetStateAction<T>>,
  field: keyof T & string,
  label: string
  required?: boolean,
  errors?: T2,
  types?: string[]
  showValidation?: boolean
  disabled?: boolean,
  onChange?: (value: string)=>void
};

type FormSelectRowProps<T extends GenericForm, T2 extends Partial<T>> = FormInputRowProps<T,T2> & {
  alsoSet?: Record<string, Partial<T>>,
  values: {
    value: string
    label: string
  }[] | string[]
}

export const FormAddressRow = <T extends GenericForm, T2 extends Partial<T>,>({ form, setForm, field, label, required, errors, types, showValidation, onChange }:PropsWithChildren<FormAddressRowProps<T,T2>>) => {
  return <Form.Group className="mb-3" controlId={field}>
    <GooglePlacesAutocomplete 
      apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      autocompletionRequest={{types}}
      selectProps={{
        className: (errors && errors[field]) ? "is-invalid" : "",
        required,
        placeholder: label,
        defaultInputValue: form[field],
        onChange: (e:any)=>{setForm({...form, [field]: e?.label || '' }); if (onChange) onChange(e?.label)},
      }}
      />
    {showValidation && <Form.Control.Feedback type="invalid">
      {(errors && errors[field]) || "This value is required"}
    </Form.Control.Feedback>}
  </Form.Group>
}

export const FormInputRow = <T extends GenericForm, T2 extends Partial<T>,>({ form, setForm, field, label, placeholder, type, as, style, min, minlength, max, step, required, disabled, errors, onChange }:PropsWithChildren<FormInputRowProps<T,T2>>) => {
  return <FloatingLabel className="mb-3" controlId={field} label={label}>
    <Form.Control
      type={type||"input"}
      isInvalid={errors && !!errors[field]}
      disabled={disabled}
      as={as}
      style={style}
      min={min}
      minLength={minlength}
      max={max}
      step={step}
      placeholder={placeholder||label}
      value={form[field]??'' as string}
      onChange={e=>{ setForm({...form, [field]: e.currentTarget.value }); if (onChange) onChange(e.currentTarget.value); }}
      onFocus={e=>e.currentTarget.select()}
      required={required}
      />
    <Form.Control.Feedback type="invalid">
      {(errors && errors[field]) || "This value is required"}
    </Form.Control.Feedback>
  </FloatingLabel>
}

export const FormSelectRow = <T extends GenericForm, T2 extends Partial<T>,>({ form, setForm, field, alsoSet, label, placeholder, values, required, disabled, errors, onChange }:PropsWithChildren<FormSelectRowProps<T,T2>>) => {
  return <FloatingLabel className="mb-3" controlId={field} label={label}>
    <Form.Select aria-label={label}
      value={form[field]??'' as string}
      disabled={disabled}
      onChange={e=>{
        const v = e.currentTarget.value;
        const ac = alsoSet?.[v] ?? alsoSet?.['*'] ?? {};
        console.log(ac);
        setForm({...form, ...ac, [field]: e.currentTarget.value });
        if (onChange) onChange(e.currentTarget.value);
      }}
      required={required}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {values.map((o,i)=> typeof o === 'string' ? <option key={i} value={o}>{o}</option> :
        <option key={i} value={o.value} data-val={o}>{o.label}</option>
      )}
    </Form.Select> 
    <Form.Control.Feedback type="invalid">
      {(errors && errors[field]) || "This value is required"}
    </Form.Control.Feedback>
  </FloatingLabel>
}

const inputErrorStyles = {
  borderColor: 'rgb(220, 53, 69)'
}

export const FormWalletRow = <T extends GenericForm, T2 extends Partial<T>,>({ form, setForm, field, label, errors, showValidation, disabled, onChange, onWalletChange }:PropsWithChildren<FormWalletRowProps<T,T2>>) => {
  return <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    <InputGroup className={(showValidation && errors && errors[field]) ? 'is-invalid' : ''}>
      <WalletLookupInput
        value={form[field]??''}
        disabled={disabled}
        onChange={(v: string) => { setForm({...form, [field]: v}); if (onChange) onChange(v); }} 
        onWalletChange={(w)=>{
          const v = w ? w.address! : ''
          setForm({...form, [field]: v})
          if (onChange) onChange(v)
          if (onWalletChange) onWalletChange(w)
        }}
        // onBlur={() => setInitializedAddressInput(true)}
        sx={(showValidation && errors && errors[field]) ? {
          '& .MuiOutlinedInput-notchedOutline': inputErrorStyles
        } : {}
      }
        />
    </InputGroup>
    {showValidation && <Form.Control.Feedback type="invalid">
      {(errors && errors[field]) || "This value is required"}
    </Form.Control.Feedback>}
  </Form.Group>
}
