import React from "react";
import { useQuery } from "@apollo/react-hooks";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { NavigationBar } from "./components/navigation-bar";
import { GreeterTest } from "./components/greeter-test";
import { AddCarbonToken } from "./components/add-carbon-token";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { Link, Route, Switch, Redirect } from "wouter"

import GET_TRANSFERS from "./graphql/subgraph";

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <NavigationBar provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      <Container className="mt-2">

        <Tab.Container defaultActiveKey="test">
          <Row>
            <Col sm={3}>
              <Nav variant="pills" className="flex-column">
                <Link href="test"><Nav.Link eventKey="test">Test greeter contract</Nav.Link></Link>
                <Link href="add-carbon-token"><Nav.Link eventKey="add-carbon-token">Add carbon token</Nav.Link></Link>
              </Nav>
            </Col>
            <Col sm={9}>
              <Tab.Content animation="true">
                <Switch>
                  <Route exact path="/"><Redirect to="/test" /></Route>
                  <Route path="/test">
                    <GreeterTest provider={provider} />
                  </Route>
                  <Route path="/add-carbon-token">
                    <AddCarbonToken provider={provider} />
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
