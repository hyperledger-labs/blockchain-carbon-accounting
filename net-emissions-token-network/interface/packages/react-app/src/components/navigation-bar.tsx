// SPDX-License-Identifier: Apache-2.0
import { FC, useState, useEffect } from "react";

import { addresses } from "@project/contracts";

import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Tooltip, { TooltipProps } from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Row from 'react-bootstrap/Row';

import { CopyToClipboard } from 'react-copy-to-clipboard';

import { FaRegClipboard } from 'react-icons/fa'
import { FaGithub } from 'react-icons/fa'
import { Web3Provider } from "@ethersproject/providers";
import { RolesInfo } from "./static-data";

type WalletButtonProps = {
  provider?: Web3Provider 
  loadWeb3Modal: ()=>void 
  logoutOfWeb3Modal:()=>void 
}

const WalletButton:FC<WalletButtonProps> = ({ provider, loadWeb3Modal, logoutOfWeb3Modal }) => {
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

const tooltipCopiedAddress: FC<Partial<TooltipProps>> = (props) => (
  <Tooltip id='copyTooltip' {...props}>
    Copied to clipboard!
  </Tooltip>
);

type NavigationBarProps = {
  provider?: Web3Provider 
  loadWeb3Modal: ()=>void 
  logoutOfWeb3Modal:()=>void
  signedInAddress?: string
  roles: RolesInfo
  limitedMode: boolean
}

const NavigationBar:FC<NavigationBarProps> = ({ provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles, limitedMode }) => {
  
  const [role, setRole] = useState("");
  const [cachedRoles, setCachedRoles] = useState<RolesInfo>({});

  useEffect(() => {
    // if roles are fetched and (the display role is empty or cached roles differ from current roles), find the correct string to display
    if (roles && (role === "" || cachedRoles !== roles)) {
      if (roles.isAdmin) {
        setRole("Admin (superuser)");
      } else if (roles.isRecDealer) {
        setRole("REC Dealer");
      } else if (roles.isCeoDealer) {
        setRole("Offset Dealer")
      } else if (roles.isAeDealer) {
        setRole("Emissions Auditor");
      } else if (roles.isIndustry) {
        setRole("Industry");
      } else if (roles.isIndustryDealer) {
        setRole("Industry Dealer");
      } else if (roles.isConsumer) {
        setRole("Consumer");
      } else {
        setRole("Unregistered");
      }
      setCachedRoles(roles);
    }
  }, [roles, role, signedInAddress, cachedRoles]);

  function truncateAddress(addr?: string) {
    if (!addr) return addr;
    let prefix = addr.substring(0,6);
    let suffix = addr.substring(addr.length - 4);
    return prefix + "..." + suffix;
  }

  return (
    <Navbar bg="white" expand="md" className="m-2">
      <Navbar.Brand>Net Emissions Token Network</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse >
        <Nav className="mr-auto">
          <Nav.Link href="https://github.com/hyperledger-labs/blockchain-carbon-accounting/tree/main/net-emissions-token-network"><FaGithub/></Nav.Link>
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
                  <small className="text-secondary">{addresses.network}</small>
                </Row>

                { (limitedMode === true) &&
                  <Row className="d-flex justify-content-center">
                    <small className="text-danger">Limited mode</small>
                  </Row>
                }

              </Nav.Item>
              <Nav.Item style={{padding: ".5rem .5rem"}}>
                <span className="text-secondary">{truncateAddress(signedInAddress)}</span>
                {/* @ts-ignore : some weird thing with the CopyToClipboard types ... */}
                <CopyToClipboard text={signedInAddress??''}>
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

export default NavigationBar;
