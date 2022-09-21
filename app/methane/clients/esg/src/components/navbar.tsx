// SPDX-License-Identifier: Apache-2.0
//import { addresses } from "@blockchain-carbon-accounting/contracts";
import { FC } from "react";
import { Tooltip } from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
//import Row from 'react-bootstrap/Row';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaGithub, FaRegClipboard } from 'react-icons/fa';
import { Link } from "wouter";

type NavigationBarProps = {
  signedIn?: string
}

const NavigationBar:FC<NavigationBarProps> = ({signedIn}) => {

  return (

    <Navbar bg="white" expand="md" className="p-3">
           
      <Navbar.Brand>Methane Portal</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse >
        <Nav className="me-auto">
          <Nav.Link href=""><FaGithub/></Nav.Link> 
        </Nav>
        <Nav>
          {(signedIn === "")?
            <>
            <Link href="sign-in">
              <Button
                variant="primary"
                className="ms-1 mr-3">Sign In
              </Button>
            </Link>
          </>
          :
            <>
              <Nav.Item style={{padding: "0 1.2rem"}}>

              </Nav.Item>
              <Nav.Item style={{padding: ".5rem .5rem"}}>
                {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
                <CopyToClipboard text={signedInAddress??''}>
                  <span className="text-secondary">
                    <OverlayTrigger
                      trigger="click"
                      placement="bottom"
                      rootClose={true}
                      delay={{ show: 250, hide: 400 }}
                      overlay={<Tooltip id='copied-address-tooltip'>Copied to clipboard!</Tooltip>}
                    >
                      <sup style={{cursor: "pointer"}}>&nbsp;<FaRegClipboard/></sup>
                    </OverlayTrigger>
                  </span>
                </CopyToClipboard>
              </Nav.Item>
            </>
          }
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default NavigationBar;
