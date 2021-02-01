import React, { useState, useEffect } from "react";

import { addresses } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Row from 'react-bootstrap/Row';

import { CopyToClipboard } from 'react-copy-to-clipboard';

import { FaRegClipboard } from 'react-icons/fa'
import { FaGithub } from 'react-icons/fa'

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  return (
    <Button
      variant="primary"
      className="ml-1"
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!provider ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

const tooltipCopiedAddress = (props) => (
  <Tooltip {...props}>
    Copied to clipboard!
  </Tooltip>
);

export default function NavigationBar({ provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles }) {
  
  const [role, setRole] = useState("");
  const [cachedRoles, setCachedRoles] = useState([]);

  useEffect(() => {
    // if roles are fetched and (the display role is empty or cached roles differ from current roles), find the correct string to display
    if (roles.length === 5 && (role === "" || cachedRoles !== roles)) {
      if (roles[0] === true) {
        setRole("Owner (superuser)");
      } else if (roles[1] === true) {
        setRole("REC Dealer");
      } else if (roles[2] === true) {
        setRole("Offset Dealer")
      } else if (roles[3] === true) {
        setRole("Emissions Auditor");
      } else if (roles[4] === true) {
        setRole("Consumer");
      } else {
        setRole("Unregistered");
      }
      setCachedRoles(roles);
    }
  }, [roles, role, signedInAddress, cachedRoles]);

  function truncateAddress(addr) {
    let prefix = addr.substring(0,6);
    let suffix = addr.substring(addr.length - 4);
    return prefix + "..." + suffix;
  }

  return (
    <Navbar bg="white" expand="md">
      <Navbar.Brand>Net Emissions Token Network</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse >
        <Nav className="mr-auto">
          <Nav.Link href="https://github.com/opentaps/blockchain-carbon-accounting/tree/master/net-emissions-token-network"><FaGithub/></Nav.Link>
        </Nav>
        <Nav>
          {(signedInAddress !== "") &&
            <>
              <Nav.Item style={{padding: "0 1.2rem"}}>
                <Row className="d-flex justify-content-center">
                  {(role && role !== "Unregistered") ?
                    <span className="text-success">{role}</span>
                  : <span className="text-danger">{role || "Not connected"}</span>
                  }
                </Row>
                <Row className="d-flex justify-content-center">
                  <small className="text-secondary">{addresses.tokenNetwork.network}</small>
                </Row>
              </Nav.Item>
              <Nav.Item style={{padding: ".5rem .5rem"}}>
                <span className="text-secondary">{truncateAddress(signedInAddress)}</span>
                <CopyToClipboard text={signedInAddress}>
                  <span className="text-secondary">
                    <OverlayTrigger
                      trigger="click"
                      placement="bottom"
                      rootClose={true}
                      delay={{ show: 250, hide: 400 }}
                      overlay={tooltipCopiedAddress}
                    >
                      <sup style={{cursor: "pointer"}}>&nbsp;<FaRegClipboard/></sup>
                    </OverlayTrigger>
                  </span>
                </CopyToClipboard>
              </Nav.Item>
            </>
          }
          <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}
