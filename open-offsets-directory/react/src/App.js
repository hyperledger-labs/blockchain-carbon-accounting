import "bootstrap/dist/css/bootstrap.min.css";
import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import "./App.css";
import ProjectView from "./components/project-view.component";
import ProjectsList from "./components/projects-list.component";

class App extends Component {
  getBaseUrl() {
    let baseEl = document.head.querySelector("base");
    if (!baseEl) return "";
    return baseEl.getAttribute("href");
  }

  render() {
    const basename = this.getBaseUrl();
    return (
      <Router basename={basename}>
        <div>
          <nav className="navbar navbar-expand navbar-dark bg-dark">
            <Link to={"/projects"} className="navbar-brand">
              The Open Offsets Directory
            </Link>
            <div className="navbar-nav mr-auto">
              <li className="nav-item">
                <Link to={"/projects"} className="nav-link">
                  Projects
                </Link>
              </li>
            </div>
          </nav>

          <div className="container mt-3">
            <Switch>
              <Route
                exact
                path={[
                  "/",
                  "/projects",
                  "/projects-list",
                  "/projects-list/:pageSize",
                  "/projects-list/:pageSize/:page",
                  "/projects-list/:pageSize/:page/:filters*",
                ]}
                component={ProjectsList}
              />
              <Route exact path="/projects/:id" component={ProjectView} />
              <Route exact path="/about">
                <h1>About</h1>
                <p>
                  The Open Offsets Directory - This directory is a project of
                  the Linux Foundation's Hyperledger Climate Action and
                  Accounting SIG's{" "}
                  <a
                    href="https://wiki.hyperledger.org/display/CASIG/Voluntary+Carbon+Offsets+Directory+Research+Project"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Voluntary Carbon Offsets Directory Research Project.
                  </a>
                  We are working on a decentralized directory of all voluntary
                  carbon offset projects and invite your input and suggestions.
                  Please start with the{" "}
                  <a
                    href="https://wiki.hyperledger.org/display/CASIG/Carbon+Offsets+Research+Questionnaire"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Carbon Offsets Questionnaire
                  </a>{" "}
                  to get involved with our project.
                </p>
                <p>
                  This project is open source. The source code for is available
                  on{" "}
                  <a
                    href="https://github.com/hyperledger-labs/blockchain-carbon-accounting"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Github
                  </a>
                  , and the data is from the Berkeley Carbon Trading Project.
                  Barbara Haya, Micah Elias, Ivy So. (2021, April). Voluntary
                  Registry Offsets Database, Berkeley Carbon Trading Project,
                  Center for Environmental Public Policy, University of
                  California, Berkeley. Retrieved from:{" "}
                  <a
                    href="https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database"
                    rel="noreferrer"
                    target="_blank"
                  >
                    https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database
                  </a>
                </p>
                <p>
                  See our <Link to={"/terms"}>Terms of Use</Link>
                </p>
              </Route>
              <Route exact path="/terms">
                <h1>Terms of Use</h1>
                <p>
                  Use of this application or website is subject to the{" "}
                  <a
                    href="https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/LICENSE"
                    rel="noreferrer"
                    target="_blank"
                  >
                    License
                  </a>
                  . We specifically do not guarantee the accuracy, completeness,
                  efficiency, timeliness, or correct sequencing of any
                  information. Use of such information is voluntary, and
                  reliance on it should only be undertaken after an independent
                  review of its accuracy, completeness, efficiency, and
                  timeliness. We assume no responsibility for consequences
                  resulting from the use of the information herein, or from use
                  of the information obtained at linked Internet addresses, or
                  in any respect for the content of such information, including
                  (but not limited to ) errors or omissions, the accuracy or
                  reasonableness of factual or scientific assumptions, studies
                  or conclusions, the defamatory nature of statements, ownership
                  of copyright or other intellectual property rights, and the
                  violation of property, privacy, or personal rights of others.
                  We are not responsible for, and expressly disclaims all
                  liability for, damages of any kind arising out of use,
                  reference to, or reliance on such information. No guarantees
                  or warranties, including (but not limited to) any express or
                  implied warranties of merchantability or fitness for a
                  particular use or purpose, are made with respect to such
                  information. At certain places on this application and
                  website, live links to other Internet addresses can be
                  accessed. Such external Internet addresses contain information
                  created, published, maintained, or otherwise posted by
                  institutions or organizations independent of us. We do not
                  endorse, approve, certify, or control these external Internet
                  addresses and does not guarantee the accuracy, completeness,
                  efficacy, timeliness, or correct sequencing of information
                  located at such addresses. Use of information obtained from
                  such addresses is voluntary, and reliance on it should only be
                  undertaken after an independent review of its accuracy,
                  completeness, efficacy, and timeliness. Reference therein to
                  any specific commercial product, process, or service by
                  tradename, trademark, service mark, manufacturer, or otherwise
                  does not constitute or imply endorsement, recommendation, or
                  favoring by us.
                </p>
              </Route>
            </Switch>
          </div>
        </div>
        <footer className="bg-light">
          <div className="py-5 container text-left">
            <p>
              The Open Offsets Directory - This directory is a project of the
              Linux Foundation's Hyperledger Climate Action and Accounting SIG's{" "}
              <a
                href="https://wiki.hyperledger.org/display/CASIG/Voluntary+Carbon+Offsets+Directory+Research+Project"
                rel="noreferrer"
                target="_blank"
              >
                Voluntary Carbon Offsets Directory Research Project.
              </a>
              We are working on a decentralized directory of all voluntary
              carbon offset projects and invite your input and suggestions.
              Please start with the{" "}
              <a
                href="https://wiki.hyperledger.org/display/CASIG/Carbon+Offsets+Research+Questionnaire"
                rel="noreferrer"
                target="_blank"
              >
                Carbon Offsets Questionnaire
              </a>{" "}
              to get involved with our project.
            </p>
            <p>
              This project is open source. The source code for is available on{" "}
              <a
                href="https://github.com/hyperledger-labs/blockchain-carbon-accounting"
                rel="noreferrer"
                target="_blank"
              >
                Github
              </a>
              , and the data is from the Berkeley Carbon Trading Project.
              Barbara Haya, Micah Elias, Ivy So. (2021, April). Voluntary
              Registry Offsets Database, Berkeley Carbon Trading Project, Center
              for Environmental Public Policy, University of California,
              Berkeley. Retrieved from:{" "}
              <a
                href="https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database"
                rel="noreferrer"
                target="_blank"
              >
                https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database
              </a>
            </p>
            <p>
              See our <Link to={"/terms"}>Terms of Use</Link>
            </p>
          </div>
        </footer>
      </Router>
    );
  }
}

export default App;
