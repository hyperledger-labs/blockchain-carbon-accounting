import { FC } from "react";
import { Link } from "wouter"

const AppFooter : FC<{}> = () => {
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
