import { FC, ReactNode, useEffect, useState } from "react";
import { Alert, Button } from "react-bootstrap";

const ErrorAlert: FC<{
  error: string,
  dismissLabel?: string,
  onDismiss?: ()=>void,
  children?: ReactNode
}> = ({error, dismissLabel, onDismiss, children}) => {
  const [show, setShow] = useState(true);

  useEffect(()=>{
    setShow(!!error)
  }, [error])

  if (show) {
    return (
      <Alert variant="danger" onClose={() => setShow(false)}>
        <Alert.Heading>An error occurred!</Alert.Heading>
        <p className="pre-wrap">
          {error}
        </p>
        {children}
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

