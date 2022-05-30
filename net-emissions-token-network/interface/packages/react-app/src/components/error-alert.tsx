import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { Alert, Button } from "react-bootstrap";

const ErrorAlert: FC<{
  error: string,
  dismissLabel?: string,
  onDismiss?: ()=>void,
  children?: ReactNode
}> = ({error, dismissLabel, onDismiss, children}) => {
  const [show, setShow] = useState(true);
  const errMsg = useMemo(()=> (error && !error.endsWith(".")) ? `${error}.` : error, [error]);

  useEffect(()=>{
    setShow(!!error)
  }, [error])

  if (show) {
    return (
      <Alert variant="danger" onClose={() => setShow(false)}>
        <Alert.Heading>An error occurred!</Alert.Heading>
        <div className="pre-wrap">
          {errMsg}
          {children}
        </div>
        <hr />
        <div className="d-flex justify-content-end">
          <Button onClick={() => {setShow(false); if (onDismiss) onDismiss();}} variant="outline-danger">
           {dismissLabel || 'Clear'} 
          </Button>
        </div>
      </Alert>
    );
  }
  return <></>;
}

export default ErrorAlert

