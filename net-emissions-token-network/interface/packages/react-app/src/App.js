import React from "react";
import { useQuery } from "@apollo/react-hooks";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import NavigationBar from "./components/navigation-bar";
import Dashboard from "./components/dashboard";
import IssueForm from "./components/issue-form";
import RetireForm from "./components/retire-form";
import AccessControlForm from "./components/access-control-form";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { Link, Route, Switch, Redirect } from "wouter"

import GET_TRANSFERS from "./graphql/subgraph";

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal, signedInAddress, roles] = useWeb3Modal();

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <NavigationBar
        provider={provider}
        loadWeb3Modal={loadWeb3Modal}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        signedInAddress={signedInAddress}
        roles={roles}
      />
      <Container className="mt-2">

        <Tab.Container defaultActiveKey="dashboard">
          <Row>
            <Col sm={3}  className="mb-2">
              <Nav variant="pills" className="flex-column">
                <Link href="dashboard"><Nav.Link eventKey="dashboard">Dashboard</Nav.Link></Link>
                <Link href="issue"><Nav.Link eventKey="issue">Issue tokens</Nav.Link></Link>
                <Link href="retire"><Nav.Link eventKey="retire">Retire tokens</Nav.Link></Link>
                <Link href="access-control"><Nav.Link eventKey="access-control">Manage roles</Nav.Link></Link>
              </Nav>
            </Col>
            <Col sm={9}>
              <Tab.Content animation="true">
                <Switch>
                  <Route exact path="/"><Redirect to="/dashboard" /></Route>
                  <Route path="/dashboard">
                    <Dashboard provider={provider} signedInAddress={signedInAddress} roles={roles} />
                  </Route>
                  <Route path="/issue">
                    <IssueForm provider={provider} />
                  </Route>
                  <Route path="/retire">
                    <RetireForm provider={provider} />
                  </Route>
                  <Route path="/access-control">
                    <AccessControlForm provider={provider} />
                  </Route>
                </Switch>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
        <div className="my-5"></div>
      </Container>
    </div>
  );
}

export default App;
