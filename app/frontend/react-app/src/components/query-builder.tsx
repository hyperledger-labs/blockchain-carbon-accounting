import { ChangeEvent, MouseEvent, FC, useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsTrash, BsPlus } from 'react-icons/bs';
import AsyncButton from "./AsyncButton";
import { OPERATORS, FIELD_OPS, TOKEN_TYPES, Field, FieldOp } from "./static-data";

/**
* Requirements.
* A. UI
* a) There are 3 input for fields, op, and value
* b) select with pre-defined validator
* c) add new blank / delete previous one
*
* B. Functions
* a) fill select options with possible values
* b) filter op based on type of fields
* c) validation before next
* d) generate query bundle
*/
type QueryBuilderProps = {
  fieldList: Field[]
  handleQueryChanged: (queries: string[])=>Promise<void>
  conjunction?: boolean
}
const QueryBuilder: FC<QueryBuilderProps> = ({fieldList, handleQueryChanged, conjunction}) => {

  // start with empty one
  const [fields, setFields] = useState<Field[]>([{
    value: ''
  }]);
  const [loading, setLoading] = useState(false);

  async function removeField(idx: number): Promise<void> {
    if(fields.length === 1) {
      setFields([{name: '', value: ''}])
      await search(null, []);
      return;
    }
    const filtered = fields.filter((_, i) => {
      return idx !== i;
    })
    setFields([...filtered]);
    await search(null, filtered);
  }

  function addField() {
    setFields([...fields, {}]);
  }

  function onChangeFieldName(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, key: number) {
    const fieldName = event.target.value;
    const match = fieldList.find(item => item.name === fieldName);
    if(match === undefined || !match.type) return;
    const ops = OPERATORS[match.type];
    const op = ops.length >= 1 ? ops[0] : undefined;
    fields[key] = {
      name: fieldName,
      ops: ops,
      type: match.type,
      op: op,
      value: ''
    }
    setFields([...fields]);
  }


  function onValueChanged(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, key: number) {
    let value = 0.0;
    if(fields[key].type === 'number') {
      value = Number(e.target.value);
      if(isNaN(value)) {
        return;
      }
    }
    fields[key].value = e.target.value;
    setFields([...fields]);
  }

  function onOperatorChanged(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, key: number) {
    fields[key].op = e.target.value as FieldOp;
    setFields([...fields]);
  }

  async function search(_: MouseEvent | null, _fields: Field[]) {
    // getting query
    if(loading) return;
    setLoading(true);
    let queries: string[] = [];
    _fields.map((item: Field) => {
      if (item.value === undefined || !item.op) return null;
      const op = FIELD_OPS.find(op => op.label === item.op);
      let query = '';
      if (item.type === 'enum') {
        if(item.value === 0 || item.value === '') return null;
        query = `${item.name},number,${item.value},eq`;
      } else if (item.type === 'number') {
        query = `${item.name},number,${item.value},${op!.value}`;
      } else if (item.type === 'balance') {
        query = `${item.name},number,${Number(item.value as number * 1000)},${op!.value}`;
      } else {
        query = `${item.name},string,${item.value},${op!.value}`;
      }
      if(conjunction){
        query += `,true`
      }
      queries.push(query);
      return queries;
    })
    // send query
    console.log(queries);
    await handleQueryChanged(queries);
    setLoading(false);
  }

  return (
    <>
      {fields.map((field, key) => {
        return (
          <Form.Group key={key}>
            <Row>
              <Col md={4} className="mb-2">
                <Form.Select onChange={e => onChangeFieldName(e, key)} value={field.name}>
                  <option value={0}>{}</option>
                  {fieldList !== undefined && fieldList.map((item, i) => {
                    return (
                      <option value={item.name} key={i}>{item.alias}</option>
                    )
                  })}
                </Form.Select>
              </Col>
              <Col md={2} className="mb-2">
                <Form.Select
                  onChange={e => onOperatorChanged(e, key)}
                  value={field.op}
                >
                  <option value={0}>{}</option>
                  {field.ops !== undefined && field.ops.map((item, i) => {
                    return (
                      <option value={item} key={i}>{item}</option>
                    )
                  })}
                </Form.Select>
              </Col>
              <Col md={4} className="mb-2">
                {field.type === 'enum' ?
                  <Form.Select onChange={e => onValueChanged(e, key)} value={field.value}>
                    <option value={0}>{}</option>
                    {TOKEN_TYPES.map((item, i) => {
                      return (
                        <option value={i+1} key={i}>{item}</option>
                      )
                    })}
                  </Form.Select> :
                  <Form.Control
                    type="input"
                    placeholder="type value"
                    value={field.value}
                    onChange={e => onValueChanged(e, key)}
                    disabled={field.op === undefined || !field.op}
                    />}

              </Col>
              <Col md={2} className="mb-2">
                <Row>
                  <Button className="col me-2" onClick={_ => removeField(key)} variant="outline-dark"><BsTrash /></Button>
                  <Button className="col" onClick={addField} variant="outline-dark"><BsPlus /></Button>
                </Row>
              </Col>
            </Row>
          </Form.Group>
        )
      })}
      <AsyncButton
        className="mb-1"
        onClick={e => {search(e, fields)}}
        variant="outline-dark"
        size="sm"
        loading={loading}
      >Search</AsyncButton>
      </>
  )
}

export default QueryBuilder;
