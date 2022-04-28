import {FC, useState} from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import { Spinner } from 'react-bootstrap';

type IssueTypeSwitchProps = {
    h: string;
    changed: (type: string) => void;
}

type ISSUED_TYPE = {
    value: string;
    label: string;
}

const ISSUED_TYPES: Array<ISSUED_TYPE> = [
    {
        label: 'Issued By',
        value: 'issuedBy'
    }, 
    {
        label: 'Issued From',
        value: 'issuedFrom'
    }, 
];

const IssuedTypeSwitch:FC<IssueTypeSwitchProps> = ({changed, h}) => {
    const [ issuedType, setIssuedType ] = useState(ISSUED_TYPES[0].value);
    const [ loading, setLoading ] = useState(false);

    const onIssueTypeChanged = async (e: any) => {
        const value = e.currentTarget.value
        if(issuedType === value) return;
        setIssuedType(value);
        setLoading(true);
        changed(value);
        setLoading(false);
    }

    return (
        <>
        {ISSUED_TYPES.map((i: ISSUED_TYPE , key: any) => 
            (<ToggleButton
                className='mb-3'
                key={key}
                id={`issue_type-${key}`}
                type="radio"
                value={i.value}
                variant={(issuedType !== i.value) ? 'link' : 'light'}
                onChange={(e) => onIssueTypeChanged(e)}
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
            </ToggleButton>)
        )}
        </>
    )
}

export default IssuedTypeSwitch;
