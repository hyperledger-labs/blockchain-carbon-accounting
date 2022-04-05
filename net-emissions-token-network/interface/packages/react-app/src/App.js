// SPDX-License-Identifier: Apache-2.0
import React, { useRef } from "react";
import { useQuery } from "@apollo/react-hooks";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

import NavigationBar from "./components/navigation-bar";
import Dashboard from "./components/dashboard";
import IssuedTokens from "./components/issued-tokens";
import IssueForm from "./components/issue-form";
import TrackForm from "./components/track-form";
import TransferForm from "./components/transfer-form";
import RetireForm from "./components/retire-form";
import AccessControlForm from "./components/access-control-form";
import GovernanceDashboard from "./components/governance-dashboard";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { Link, Route, Switch, Redirect, useLocation } from "wouter"

import GET_TRANSFERS from "./graphql/subgraph";

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles, registeredTracker, limitedMode] = useWeb3Modal();

  const [location] = useLocation();

  const dashboardRef = useRef();

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  const isOwner = (roles[0] === true);
  const isDealer = (roles[0] === true || roles[1] === true || roles[2] === true || roles[3] === true || roles[4] === true);
  const isOwnerOrDealer = (isOwner || isDealer);

  return (
    <>
      <NavigationBar
        provider={provider}
        loadWeb3Modal={loadWeb3Modal}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        signedInAddress={signedInAddress}
        roles={roles}
        limitedMode={limitedMode}
      />

      {/* Tabs to pages */}
      <Nav fill variant="tabs" className="mt-2 mb-4 border-bottom-0">
        {/* On dashboard page, click this link to refresh the balances */}
        {/* Else on other page, click this link to go to dashboard */}
        {(location.substring(1) === "dashboard")
         ? <Nav.Link onClick={() => dashboardRef.current.refresh()} eventKey="dashboard">Dashboard</Nav.Link>
         : <Link href="/dashboard"><Nav.Link eventKey="dashboard">Dashboard</Nav.Link></Link>
        }

        <Link href="/governance"><Nav.Link eventKey="governance">Governance</Nav.Link></Link>
        {isOwnerOrDealer ? 
          <Link href="/issuedtokens"><Nav.Link eventKey="issue">Issue tokens</Nav.Link></Link>
          : null
        }

        {((limitedMode && isOwner) || !limitedMode) &&
          <Link href="/transfer"><Nav.Link eventKey="transfer">Transfer tokens</Nav.Link></Link>
        }

        <Link href="/retire"><Nav.Link eventKey="retire">Retire tokens</Nav.Link></Link>

        {((limitedMode && isOwner) || !limitedMode) &&
          <Link href="/track"><Nav.Link eventKey="track">Track</Nav.Link></Link>
        }

        {/* Display "Manage Roles" if owner/dealer, "My Roles" otherwise */}
        <Link href="/access-control"><Nav.Link eventKey="access-control">
                                      {( (!limitedMode && isOwnerOrDealer) ^ (limitedMode && isOwner) )
                                   ? "Manage roles"
                                   : "My roles"
                                  }
                </Nav.Link></Link>

      </Nav>

      <Container className="my-2">

        <Tab.Container defaultActiveKey={location.substring(1) || "dashboard"}>
              <Tab.Content animation="true">
                <Switch>
                  <Route exact path="/"><Redirect to="/dashboard" /></Route>
                  <Route path="/dashboard/:address?">{params=>
                    <Dashboard ref={dashboardRef} provider={provider} signedInAddress={params.address||signedInAddress} roles={roles} displayAddress={params.address} />
                  }</Route>
                  <Route path="/governance">
                    <GovernanceDashboard provider={provider} roles={roles} signedInAddress={signedInAddress} />
                  </Route>
                  <Route path="/issue">
                    <IssueForm provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} />
                  </Route>
                  <Route path="/issuedtokens">
                    <IssuedTokens provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} />
                  </Route>
                  <Route path="/transfer">
                    <TransferForm provider={provider} roles={roles} />
                  </Route>
                  <Route path="/retire">
                    <RetireForm provider={provider} roles={roles} />
                  </Route>
                  <Route path="/track">
                    <TrackForm provider={provider} registeredTracker={registeredTracker} signedInAddress={signedInAddress}/>
                  </Route>
                  <Route path="/access-control">
                    <AccessControlForm provider={provider} signedInAddress={signedInAddress} roles={roles} limitedMode={limitedMode} />
                  </Route>
                  <Route>
                    <Redirect to="/dashboard" />
                  </Route>
                </Switch>
              </Tab.Content>
        </Tab.Container>
        <div className="my-5"></div>
      </Container>
    </>
  );
}

export default App;
