import React, { useState, useEffect } from "react";

import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  return (
    <Button
      variant="primary"
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

export default function NavigationBar({ provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles }) {
  
  const [role, setRole] = useState("");

  useEffect(() => {

    if (roles.length === 5 && role === "") {
      if (roles[0] === true) {
        setRole("Owner (superuser)");
      } else if (roles[1] === true) {
        setRole("REC Dealer");
      } else if (roles[2] === true) {
        setRole("CEO Dealer")
      } else if (roles[3] === true) {
        setRole("AE Dealer");
      } else if (roles[4] === true) {
        setRole("Consumer");
      } else {
        setRole("Unregistered");
      }
    }
  }, [roles, role]);

  function truncateAddress(addr) {
    let prefix = addr.substring(0,6);
    let suffix = addr.substring(addr.length - 4);
    return prefix + "..." + suffix;
  }

  return (
    <Navbar bg="white">
      <Navbar.Brand>Net Emissions Token Network</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        {(signedInAddress !== "") &&
          <>
            <span className="mr-2">
              {(role && role !== "Unregistered") ?
                <span className="text-success">{role}</span>
              : <span className="text-danger">{role || "Not connected"}</span>
              }
            </span>
            <span className="mr-2 text-secondary">{truncateAddress(signedInAddress)}</span>
          </>
        }
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Navbar.Collapse>
    </Navbar>
  )
}
