import React from "react";

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

export function NavigationBar({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  return (
    <Navbar bg="light">
      <Navbar.Brand>Net Emissions Token Network</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Navbar.Collapse>
    </Navbar>
  )
}
