import { FC } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsTrash, BsPlus } from 'react-icons/bs';

export type KeyValuePair = {
  key: string
  value: string
}

type FormGroupJSONHandles = {
  setKeyValuePair:(_keyValuePair:KeyValuePair[])=>void
  addField:() => void
  removeField:(key:number) => void
}

type FormGroupJSONProps = {
  keyValuePair: KeyValuePair[]
  handles: FormGroupJSONHandles 
}

const FormGroupJSON:FC<FormGroupJSONProps> = ({keyValuePair,handles}) => {
  return <Form.Group>
    {keyValuePair.map((field, key) =>
      <Row key={key}>
        <Col md={3}>
          <Form.Control
            type="input"
            placeholder="Key"
            value={field.key}
            onChange={e => { keyValuePair[key].key = e.target.value; handles.setKeyValuePair([...keyValuePair]); }}
          />
        </Col>
        <Col md={7}>
          <Row className="mb-3">
            <Form.Label column md={2}>
            </Form.Label>
            <Col md={10}>
              <Form.Control
                type="input"
                value={field.value}
                placeholder="Value"
                onChange={e => { keyValuePair[key].value = e.target.value; handles.setKeyValuePair([...keyValuePair]); }}
                />
            </Col>
          </Row>
        </Col>
        <Col md={2}>
          <Row className="mb-3 g-0 gx-2">
            <Col className="col-md-auto col-6">
              <Button className="w-100" variant="outline-dark" onClick={handles.addField}><BsPlus /></Button>
            </Col>
            <Col className="col-md-auto col-6">
              <Button className="w-100" variant="outline-dark" onClick={() => handles.removeField(key)}><BsTrash /></Button>
            </Col>
          </Row>
        </Col>
      </Row>
    )}
    <br />
  </Form.Group>    
}

export default FormGroupJSON;

