import { PropsWithChildren } from "react";
import { FloatingLabel, Form } from "react-bootstrap";


type GenericForm = {
  [P in string]: string
}

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
  }[] | string[]
}

export const FormInputRow = <T extends GenericForm,>({ form, setForm, field, label, placeholder, type, min, max }:PropsWithChildren<FormInpuRowProps<T>>) => {
  return <FloatingLabel className="mb-3" controlId={field} label={label}>
    <Form.Control
      type={type||"input"}
      min={min}
      max={max}
      placeholder={placeholder||label}
      value={form[field] as string}
      onChange={e=>{ setForm({...form, [field]: e.currentTarget.value })}}
      onFocus={e=>e.currentTarget.select()}
      />
  </FloatingLabel>
}

export const FormSelectRow = <T extends GenericForm,>({ form, setForm, field, label, placeholder, values }:PropsWithChildren<FormSelectRowProps<T>>) => {
  return <FloatingLabel className="mb-3" controlId={field} label={label}>
    <Form.Select aria-label={label}
      value={form[field] as string}
      onChange={e=>{ setForm({...form, [field]: e.currentTarget.value })}}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {values.map((o,i)=> typeof o === 'string' ? <option key={i} value={o}>{o}</option> :
        <option key={i} value={o.value}>{o.label}</option>
      )}
    </Form.Select> 
  </FloatingLabel>
}

