import { ElementRef, FC, useRef, useState, lazy, Suspense  } from 'react';
import { QueryClient, QueryClientProvider } from "react-query";

import NavigationBar from "./components/navbar";
import { Link, Route, Switch, Redirect, useLocation } from "wouter"

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

import './App.css';

const AppFooter = lazy(() => import("./components/footer"));
// lazy load routes
const Operators = lazy(() => import("./pages/operators"));
const TermsOfUse = lazy(() => import("./pages/terms"));

const App:FC = () => {
  const [queryClient] = useState(() => new QueryClient());

  const signedIn = "";

  const [location] = useLocation();

  const operatorsRef = useRef<ElementRef<typeof Operators>>(null);

  useState(async() => {
    const sayHello = async() => {
      //const response = await fetch("/api/hello");
      //const body = await response.json();
      //console.log(body);
    };
    sayHello();
  });
  return (<>

    <QueryClientProvider client={queryClient}>
      <NavigationBar signedIn={signedIn}/>
      <>
        {/* Tabs to pages, only displayed when the user is signed in */}
        {/* signed && (*/}
          <Nav fill variant="tabs" className="mt-2 mb-4 border-bottom-0">
            {/* On operators page, click this link to refresh the balances */}
            {/* Else on other page, click this link to go to operators */}
            {(location.substring(1) === "operators")
              ? <Nav.Link onClick={() => operatorsRef.current?.refresh()} eventKey="operators">Operators</Nav.Link>
              : <Link href="/operators"><Nav.Link eventKey="operators">Operators</Nav.Link></Link>
            }
          </Nav>
        {/*}*/}
        <Container className="my-2 main-container">
          <Tab.Container defaultActiveKey={location.substring(1) || "operators"}>
            <Tab.Content>
              <Suspense fallback={<p>Loading ...</p>}>
                { true || signedIn ? (
                  <Switch>
                    <Route path="/"><Redirect to="/operators" /></Route>
                    <Route path="/operators">
                      <Operators ref={operatorsRef} signedIn={signedIn}/>
                    </Route>
                    <Route path="/terms">
                      <TermsOfUse></TermsOfUse>
                    </Route>
                  </Switch>
                ) : (
                    <Switch>
                    </Switch>
                  )
              }
              </Suspense>
            </Tab.Content>
          </Tab.Container>
          <div className="my-5"></div>
        </Container>
      </>
    </QueryClientProvider>
    <footer>
      <AppFooter></AppFooter>
    </footer>
  </>);
}

export default App;
