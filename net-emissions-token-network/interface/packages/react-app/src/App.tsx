// SPDX-License-Identifier: Apache-2.0
import { ElementRef, FC, useRef, useState } from "react";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

import NavigationBar from "./components/navigation-bar";
import Dashboard from "./pages/dashboard";
import IssuedTokens from "./pages/issued-tokens";
import EmissionsRequests from "./pages/emissions-requests";
import PendingEmissions from "./pages/pending-emissions";
import IssueForm from "./pages/issue-form";
import IssuedTrackers from "./pages/issued-trackers";
import TrackForm from "./pages/track-form";
import ProductForm from "./pages/product-form";
import ProductTransferForm from "./pages/product-transfer-form";
import TransferForm from "./pages/transfer-form";
import RetireForm from "./pages/retire-form";
import AccessControlForm from "./pages/access-control-form";
import GovernanceDashboard from "./pages/governance-dashboard";
import RequestAudit from "./pages/request-audit";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { Link, Route, Switch, Redirect, useLocation } from "wouter"

import { QueryClient, QueryClientProvider } from "react-query";
import { trpc, useTrpcClient } from "./services/trpc";

const App:FC = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useTrpcClient();

  const { provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles, registeredTracker, limitedMode } = useWeb3Modal();
  //console.log(roles)
  const [location] = useLocation();

  const dashboardRef = useRef<ElementRef<typeof Dashboard>>(null);

  const isOwner = roles.isAdmin;
  const isDealer = roles.hasDealerRole;
  const isOwnerOrDealer = (isOwner || isDealer);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
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
            ? <Nav.Link onClick={() => dashboardRef.current?.refresh()} eventKey="dashboard">Dashboard</Nav.Link>
            : <Link href="/dashboard"><Nav.Link eventKey="dashboard">Dashboard</Nav.Link></Link>
        }

          <Link href="/governance"><Nav.Link eventKey="governance">Governance</Nav.Link></Link>
          {isOwnerOrDealer ? 
            <Link href="/issuedtokens"><Nav.Link eventKey="issue">Issue tokens</Nav.Link></Link>
            : null
        }
          {roles.isConsumer ? 
            <Link href="/requestAudit"><Nav.Link eventKey="requestAudit">Request audit</Nav.Link></Link>
            : null
        }

          {((limitedMode && isOwner) || !limitedMode) &&
            <Link href="/transfer"><Nav.Link eventKey="transfer">Transfer tokens</Nav.Link></Link>
        }

          <Link href="/retire"><Nav.Link eventKey="retire">Retire tokens</Nav.Link></Link>

          {((limitedMode && isOwner) || !limitedMode) &&
            <Link href="/issuedTrackers"><Nav.Link eventKey="issuedTrackers">Track</Nav.Link></Link>
        }


          {/* Display "Manage Roles" if owner/dealer, "My Roles" otherwise */}
          <Link href="/access-control"><Nav.Link eventKey="access-control">
            {( (!limitedMode && isOwnerOrDealer) || (limitedMode && isOwner) )
              ? "Manage roles"
              : "My roles"
          }
          </Nav.Link></Link>

        </Nav>

        <Container className="my-2">

          <Tab.Container defaultActiveKey={location.substring(1) || "dashboard"}>
            <Tab.Content>
              <Switch>
                <Route path="/"><Redirect to="/dashboard" /></Route>
                <Route path="/dashboard/:address?">{params=>
                  <Dashboard ref={dashboardRef} provider={provider} signedInAddress={params.address||signedInAddress} displayAddress={params.address} />
                }</Route>
                <Route path="/governance">
                  <GovernanceDashboard provider={provider} roles={roles} signedInAddress={signedInAddress} />
                </Route>
                <Route path="/issue">
                  <IssueForm provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} />
                </Route>
                <Route path="/requestAudit">
                  <RequestAudit provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} />
                </Route>
                <Route path="/issuedtokens/:address?">{params=>
                  <IssuedTokens provider={provider} roles={roles} signedInAddress={params.address||signedInAddress} displayAddress={params.address} />
                }</Route>
                <Route path="/emissionsrequests">
                  <EmissionsRequests provider={provider} roles={roles} signedInAddress={signedInAddress} />
                </Route>
                <Route path="/pendingemissions/:uuid">{params=>
                  <PendingEmissions provider={provider} roles={roles} signedInAddress={signedInAddress} uuid={params.uuid} />
                }</Route>
                <Route path="/transfer">
                  <TransferForm provider={provider} roles={roles} />
                </Route>
                <Route path="/retire">
                  <RetireForm provider={provider} roles={roles} />
                </Route>
                <Route path="/issuedTrackers/:address?">{params=>
                  <IssuedTrackers provider={provider} roles={roles} signedInAddress={params.address||signedInAddress} displayAddress={params.address}/>
                }</Route>
                <Route path="/track/:trackerId?">{params=>
                  <IssueForm provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} trackerId={Number(params.trackerId)}/>
                }</Route>
                <Route path="/addProduct/:trackerId?">{params=>
                  <ProductForm provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} trackerId={Number(params.trackerId)}/>
                }</Route>
                <Route path="/transferProduct/:trackerId/:productId?">{params=>
                  <ProductTransferForm provider={provider} roles={roles} signedInAddress={signedInAddress} trackerId={Number(params.trackerId)} productId={Number(params.productId)}/>
                }</Route>
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

      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
