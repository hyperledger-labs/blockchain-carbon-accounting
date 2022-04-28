import { FC, useEffect, useState } from "react";
import { Alert, Button } from "react-bootstrap";

const SuccessAlert: FC<{title: string, dismissLabel?: string, onDismiss?: ()=>void}> = ({title, dismissLabel, onDismiss, children}) => {
  const [show, setShow] = useState(true);

  useEffect(()=>{
    setShow(!!title)
  }, [title])

  if (show) {
    return (
      <Alert variant="success" onClose={() => setShow(false)}>
        <Alert.Heading>{title}</Alert.Heading>
        {children}
        <hr />
        <div className="d-flex justify-content-end">
          <Button onClick={() => { setShow(false); if (onDismiss) onDismiss();}} variant="outline-success">
            {dismissLabel || 'Clear'}
          </Button>
        </div>
      </Alert>
    );
  }
  return <></>;
}

export default SuccessAlert


