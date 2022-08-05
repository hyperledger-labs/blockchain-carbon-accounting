// SPDX-License-Identifier: Apache-2.0
import { ElementRef, FC, useRef, useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Link, Route, Switch, Redirect, useLocation } from "wouter"

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

import { trpc, useTrpcClient } from "./services/trpc";
import useWeb3Modal from "./hooks/useWeb3Modal";
import NavigationBar from "./components/navigation-bar";

// lazy load routes
const Dashboard = lazy(() => import("./pages/dashboard"));
const SignUp = lazy(() => import("./pages/sign-up"));
const SignIn = lazy(() => import("./pages/sign-in"));
const IssuedTokens = lazy(() => import("./pages/issued-tokens"));
const IssuedTrackers = lazy(() => import("./pages/issued-trackers"));
const EmissionsRequests = lazy(() => import("./pages/emissions-requests"));
const IssueForm = lazy(() => import("./pages/issue-form"));
const TransferForm = lazy(() => import("./pages/transfer-form"));
const RetireForm = lazy(() => import("./pages/retire-form"));
const ProductForm = lazy(() => import("./pages/product-form"));
const ProductTransferForm = lazy(() => import("./pages/product-transfer-form"));
const AccessControlForm = lazy(() => import("./pages/access-control-form"));
const GovernanceDashboard = lazy(() => import("./pages/governance-dashboard"));
const RequestAudit = lazy(() => import("./pages/request-audit"));
const ChangePassword = lazy(() => import("./pages/change-password"));
const ExportPk = lazy(() => import("./pages/export-pk"));
const TermsOfUse = lazy(() => import("./pages/terms-of-use"));
const AppFooter = lazy(() => import("./components/app-footer"));

const App:FC = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useTrpcClient();

  const { provider, loadWeb3Modal, logoutOfWeb3Modal, loadWalletInfo, logoutOfWalletInfo, signedInAddress, signedInWallet, roles,  limitedMode, refresh, loaded } = useWeb3Modal();

  const [location] = useLocation();

  const dashboardRef = useRef<ElementRef<typeof Dashboard>>(null);
  const accessControlRef = useRef<ElementRef<typeof AccessControlForm>>(null);

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
          logoutOfWalletInfo={logoutOfWalletInfo}
          signedInAddress={signedInAddress}
          signedInWallet={signedInWallet}
          roles={roles}
          limitedMode={limitedMode}
          />

        { loaded ? <>
          {/* Tabs to pages, only displayed when the user is signed in */}
          { signedInAddress && (
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
              <Link href="/requestAudit"><Nav.Link eventKey="requestAudit">Request audit</Nav.Link></Link>
              {((limitedMode && isOwner) || !limitedMode) &&
                <Link href="/transfer"><Nav.Link eventKey="transfer">Transfer tokens</Nav.Link></Link>
            }

              <Link href="/retire"><Nav.Link eventKey="retire">Retire tokens</Nav.Link></Link>

              {((limitedMode && isOwner) || !limitedMode) &&
                <Link href="/issuedTrackers"><Nav.Link eventKey="issuedTrackers">Track</Nav.Link></Link>
            }

              {/* Display "Manage Roles" if owner/dealer, "My Roles" otherwise */}
              {(location.substring(1) === "access-control")
                ? <Nav.Link onClick={() => accessControlRef.current?.refresh()} eventKey="access-control">
                  {( (!limitedMode && isOwnerOrDealer) || (limitedMode && isOwner) )
                    ? "Manage roles"
                    : "My roles"
                }
                </Nav.Link>
                : <Link href="/access-control"><Nav.Link eventKey="access-control">
                  {( (!limitedMode && isOwnerOrDealer) || (limitedMode && isOwner) )
                    ? "Manage roles"
                    : "My roles"
                }
                </Nav.Link></Link>
            }
            </Nav>)}

          <Container className="my-2 main-container">

            <Tab.Container defaultActiveKey={location.substring(1) || "dashboard"}>
              <Tab.Content>
                <Suspense fallback={<p>Loading ...</p>}>
                  { signedInAddress ? (
                    <Switch>
                      <Route path="/"><Redirect to="/dashboard" /></Route>
                      <Route path="/dashboard">
                        <Dashboard ref={dashboardRef} provider={provider} signedInAddress={signedInAddress} displayAddress=""/>
                      </Route>
                      <Route path="/dashboard/address/:address?">{(params)=>
                        <Dashboard ref={dashboardRef} provider={provider} signedInAddress={params.address||signedInAddress} displayAddress={params.address} />
                      }</Route>
                      <Route path="/dashboard/token/:tokenid?">{(params)=>
                        <Dashboard ref={dashboardRef} provider={provider} signedInAddress={signedInAddress} displayAddress="" tokenid={params.tokenid} />
                      }</Route>
                      <Route path="/governance">
                        <GovernanceDashboard provider={provider} roles={roles} signedInAddress={signedInAddress} />
                      </Route>
                      <Route path="/issue">
                        <IssueForm provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} signedInWallet={signedInWallet}  />
                      </Route>
                      <Route path="/requestAudit">
                        <RequestAudit provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} />
                      </Route>
                      <Route path="/issuedtokens/:address?">{(params)=>
                        <IssuedTokens provider={provider} roles={roles} signedInAddress={params.address||signedInAddress} displayAddress={params.address} />
                      }</Route>
                      <Route path="/emissionsrequests">
                        <EmissionsRequests provider={provider} roles={roles} signedInAddress={signedInAddress} />
                      </Route>
                      <Route path="/pendingemissions/:requestId?">{(params)=>
                        <IssueForm provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} signedInWallet={signedInWallet} requestId={params.requestId} />
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
                        <AccessControlForm ref={accessControlRef} provider={provider} providerRefresh={refresh} signedInAddress={signedInAddress} roles={roles} limitedMode={limitedMode} signedInWallet={signedInWallet} />
                      </Route>
                      <Route path="/reset-password">
                        <ChangePassword></ChangePassword>
                      </Route>
                      <Route path="/sign-up">
                        <SignUp></SignUp>
                      </Route>
                      <Route path="/sign-in">
                        <SignIn loadWalletInfo={loadWalletInfo} />
                      </Route>
                      <Route path="/export-pk">
                        <ExportPk signedInWallet={signedInWallet} logoutOfWalletInfo={logoutOfWalletInfo} />
                      </Route>
                      <Route path="/terms">
                        <TermsOfUse></TermsOfUse>
                      </Route>
                      <Route>
                        <Redirect to="/dashboard" />
                      </Route>
                    </Switch>
                  ) : (
                      <Switch>
                        <Route path="/"><Redirect to="/requestAudit" /></Route>
                        <Route path="/sign-up">
                          <SignUp></SignUp>
                        </Route>
                        <Route path="/sign-in">
                          <SignIn loadWalletInfo={loadWalletInfo} />
                        </Route>
                        <Route path="/reset-password">
                          <ChangePassword></ChangePassword>
                        </Route>
                        <Route path="/export-pk">
                          <ExportPk signedInWallet={signedInWallet} logoutOfWalletInfo={logoutOfWalletInfo} />
                        </Route>
                        <Route path="/requestAudit">
                          <RequestAudit provider={provider} roles={roles} signedInAddress={signedInAddress} limitedMode={limitedMode} />
                        </Route>
                        <Route path="/terms">
                          <TermsOfUse></TermsOfUse>
                        </Route>
                        <Route>
                          <Redirect to="/requestAudit" />
                        </Route>
                      </Switch>
                    )
                }
                </Suspense>
              </Tab.Content>
            </Tab.Container>
            <div className="my-5"></div>
          </Container>
        </> : <p>Loading ...</p>}
      </QueryClientProvider>
      <footer>
        <AppFooter></AppFooter>
      </footer>
    </trpc.Provider>
  );
}

export default App;
