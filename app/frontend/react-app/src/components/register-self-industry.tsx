import { FC, useReducer } from "react";
import { Form } from "react-bootstrap";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

import ErrorAlert from "./error-alert";
import { registerIndustry } from "../services/contract-functions";
import SuccessAlert from "./success-alert";
import AsyncButton from "./AsyncButton";

type Action = {
  type: 'loading' | 'success' | 'error' | 'dismissError'
  payload?: string
}

const initialState = {
  error: '',
  success: '',
  loading: false,
};
type State = typeof initialState;


function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        error: '',
        loading: true
      };
    case 'success':
      return {
        ...state,
        error: '',
        loading: false,
        success: 'Successfully registered as industry, refresh the page after a while to see the changes.'
      };
    case 'error':
      return {
        ...state,
        error: action.payload || '',
        loading: false
      };
    case 'dismissError':
      return {
        ...state,
        error: '',
      };
    default:
      throw new Error();
  }
}


type RegisterIndustryProps = {
  provider?: Web3Provider | JsonRpcProvider
  signedInAddress: string
}

const RegisterIndustry: FC<RegisterIndustryProps> = ({provider, signedInAddress}) => {

  const [state, dispatch] = useReducer(reducer, initialState);

  async function RegisterIndustry() {
    if (!provider) return;
    dispatch({type: 'loading'});
    const result = await registerIndustry(provider, signedInAddress);
    if (!result || result.toString().indexOf('Success') === -1) {
      console.error('Transaction did not succeed', result);
      dispatch({type: 'error', payload: result});
    } else {
      console.log('Transaction successful', result.toString());
      dispatch({type: 'success'});
    }
  }

  return <>
    <h4 className="mt-4">Register my account as industry</h4>
    {!state.success && <Form.Group className="d-grid gap-2 mt-3 mb-2">
      <AsyncButton
        loading={state.loading}
        variant="success"
        onClick={RegisterIndustry}
      >Register</AsyncButton>
    </Form.Group>}
    {state.error && <ErrorAlert error={state.error} onDismiss={()=>{ dispatch({type: 'dismissError'}) }} />}
    {state.success && <SuccessAlert title="Success" noDismiss>{state.success}</SuccessAlert>}
    </>
}

export default RegisterIndustry;
