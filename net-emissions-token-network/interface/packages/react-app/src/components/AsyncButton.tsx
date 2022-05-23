import { FC, MouseEventHandler, ReactNode } from "react";
import { Button, Spinner } from "react-bootstrap";
import { ButtonVariant } from "react-bootstrap/esm/types";


type Props = {
  children: ReactNode,
  loading: boolean,
  size?: 'sm' | 'lg',
  type?: 'button' | 'submit' | 'reset',
  className?: string,
  variant?: ButtonVariant,
  onClick?: MouseEventHandler,
};

const AsyncButton: FC<Props> = ({
  children,
  size,
  variant,
  type,
  className,
  onClick,
  loading
}) => {


  return <Button
    className={className}
    variant={variant}
    size={size || "lg"}
    disabled={loading}
    type={type}
    onClick={onClick}
  >
    {loading ?
      <Spinner
        animation="border" 
        className="me-2"
        size="sm"
        as="span"
        role="status"
        aria-hidden="true"
        /> : <></>
  }
    {children}
  </Button>
}

export default AsyncButton;
