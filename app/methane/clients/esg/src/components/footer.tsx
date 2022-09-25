import { FC } from "react";
import { Link } from "wouter"

type FooterProps = {
  signedIn?: string
}

const AppFooter:FC<FooterProps> = ({signedIn}) => {
    return (
      <>
        <div className="py-5 container text-center">
          <p></p>
          <p><Link to={"/terms"}>Terms of Use</Link></p>
        </div>
      </>
    )
}

export default AppFooter;
