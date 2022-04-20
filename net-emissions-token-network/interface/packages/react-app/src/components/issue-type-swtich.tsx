import {FC, useState} from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import { Spinner } from 'react-bootstrap';

type IssueTypeSwtichProps = {
    h: string;
    changed: (type: string) => void;
}

type ISSUED_TYPE = {
    value: string;
    label: string;
}

const ISSUED_TYPES: Array<ISSUED_TYPE> = [
    {
        label: 'issued by',
        value: 'issuedBy'
    }, 
    {
        label: 'issued from',
        value: 'issuedFrom'
    }, 
];

const IssuedTypeSwtich:FC<IssueTypeSwtichProps> = ({changed, h}) => {
    const [ issuedType, setIssuedType ] = useState(ISSUED_TYPES[0].value);
    const [ loading, setLoading ] = useState(false);

    const onIssueTypeChanged = async (e: any) => {
        console.log(e);
        const value = e.value
        if(issuedType === value) return;
        setIssuedType(value);
        setLoading(true);
        await changed(value);
        setLoading(false);
    }

    return (
        <>
        {ISSUED_TYPES.map((i: ISSUED_TYPE , key: any) => 
            (<a
                className='mr-2'
                key={key}
                style={(issuedType !== i.value) ? 
                    {textDecoration: 'underline', cursor: "pointer"} : 
                    {textDecoration: 'none', color: '#333333'}
                }
                onClick={(e) => {
                    onIssueTypeChanged(i)
                }}
            >
                {loading && issuedType === i.value ? 
                    <Spinner 
                        animation="border" 
                        variant="warning" 
                        size="sm"   
                        as="span"
                        role="status"
                        aria-hidden="true"
                    /> : <></>
                }&nbsp;{i.label}&nbsp;{h}
            </a>)
        )}
        </>
    )
}

export default IssuedTypeSwtich;