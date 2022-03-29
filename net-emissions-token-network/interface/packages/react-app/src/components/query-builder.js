import React, { useState } from "react";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { BsTrash, BsPlus } from 'react-icons/bs';
import { OPERATORS, FIELD_OPS, TOKEN_TYPES } from "./static-data";

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



const QueryBuilder = ({fieldList, handleQueryChanged}) => {

    // start with empty one
    const [fields, setFields] = useState([{
        op:'',
        value: ''
    }]);

    function removeField (e, idx) {
        if(fields.length === 1) return;
        const filtered = fields.filter((item, i) => {
            return idx !== i;
        })
        setFields([...filtered]);
        fieldList = [...fieldList]
    }

    function addField() {
        setFields([...fields, {}]);
    }

    function onChangeFieldName(event, key) {
        const fieldName = event.target.value;
        const match = fieldList.find(item => item.name === fieldName);
        fields[key] = {
            name: fieldName,
            ops: OPERATORS[match.type],
            type: match.type,
            op: '',
            value: ''
        }
        setFields([...fields]);
    }

    function onValueChanged(e, key) {
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

    function onOperatorChanged(e, key) {
        fields[key].op = e.target.value;
        setFields([...fields]);
    }

    function search() {
        // getting query
        let queries = [];
        fields.map(item => {
            if(item.value === undefined) return null;
            const op = FIELD_OPS.find(op => op.label === item.op);
            let query = '';
            if(item.type === 'enum') {
                if(item.value === 0 || item.value === '') return null;
                query = `${item.name},number,${item.value},eq`;
            } else if (item.type === 'number') {
                query = `${item.name},number,${item.value},${op.value}`;
            } else if (item.type === 'balance'){
                query = `${item.name},number,${Number(item.value * 1000)},${op.value}`;
            } else {
                query = `${item.name},string,${item.value},${op.value}`;
            }
            queries.push(query);
            return queries;
        })
        // send query
        handleQueryChanged(queries);
    }

    return (
        <>
            {fields.map((field, key) => {
                return (
                    <Form.Group key={key}>
                        <Row>
                            <Col md={3}>
                                <Form.Control as="select" onChange={e => onChangeFieldName(e, key)} value={field.name}>
                                    <option value={0}>{}</option>
                                    {fieldList !== undefined && fieldList.map((item, i) => {
                                        return (
                                            <option value={item.name} key={i}>{item.alias}</option>
                                        )
                                    })}
                                </Form.Control>   
                            </Col>
                            <Col md={2}>
                                <Form.Control 
                                    as="select" 
                                    onChange={e => onOperatorChanged(e, key)}
                                    value={field.op}
                                >
                                    <option value={0}>{}</option>
                                    {field.ops !== undefined && field.ops.map((item, i) => {
                                        return (
                                            <option value={item} key={i}>{item}</option>
                                        )
                                    })}
                                </Form.Control>   
                            </Col>
                            <Col md={3}>
                                {field.type === 'enum' ? 
                                <Form.Control as="select" onChange={e => onValueChanged(e, key)} value={field.value}>
                                    <option value={0}>{}</option>
                                    {TOKEN_TYPES.map((item, i) => {
                                        return (
                                            <option value={i+1} key={i}>{item}</option>
                                        )
                                    })}
                                </Form.Control> :                                 
                                <Form.Control 
                                    type="input"
                                    placeholder="type value"
                                    value={field.value}
                                    onChange={e => onValueChanged(e, key)}
                                    disabled={field.op === undefined || field.op === ''}
                                />}
                                  
                            </Col>
                            <Col sm={1}>
                                <Row>
                                    <Button className="mr-1" onClick={e => removeField(e, key)}><BsTrash /></Button>
                                    <Button onClick={addField}><BsPlus /></Button>
                                </Row>
                            </Col>
                        </Row>
                    </Form.Group>
                )
            })}
            <Button className="mb-1" onClick={search}>Search</Button>
        </>
    )
}

export default QueryBuilder;