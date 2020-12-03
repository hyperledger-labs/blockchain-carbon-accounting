import React from "react";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { NavigationBar } from "./components/navigation-bar";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { Link, Route, Switch, Redirect } from "wouter"

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

async function readOnChainData(w3provider) {
  // Create an instance of an ethers.js Contract
  // The address below is copied after deploying the greeter contract to the local hardhat network
  const contract_greeter = new Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", abis.greeter.abi, w3provider);
  const greeting = await contract_greeter.greet(); // returns error
  console.log({ greeting: greeting.toString() });

  // Get balance of test address on hardhat
  //
  // console.log(w3provider);
  // let balancePromise = w3provider.getBalance("0xdd2fd4581271e230360230f9337d5c0430bf44c0");
  // // let balancePromise = w3provider.getBlockNumber();
  // balancePromise.then(function(balance) {
  //   console.log(balance);
  // });
}

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
                <Link href="test"><Nav.Link eventKey="test">Test</Nav.Link></Link>
                <Link href="mint"><Nav.Link eventKey="mint">Mint</Nav.Link></Link>
              </Nav>
            </Col>
            <Col sm={9}>
              <Tab.Content animation="true">
                <Switch>
                  <Route exact path="/"><Redirect to="/test" /></Route>
                  <Route path="/test">
                    <Button onClick={() => readOnChainData(provider)}>
                      Return greeting
                    </Button>
                  </Route>
                  <Route path="/mint">...</Route>
                </Switch>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>

      </Container>
    </div>
  );
}

export default App;
