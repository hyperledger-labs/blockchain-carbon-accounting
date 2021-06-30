import "bootstrap/dist/css/bootstrap.min.css";
import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import "./App.css";
import ProjectView from "./components/project-view.component";
import ProjectsList from "./components/projects-list.component";

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <nav className="navbar navbar-expand navbar-dark bg-dark">
            <a href="/projects" className="navbar-brand">
              Voluntary Carbon Offsets Directory
            </a>
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
            </Switch>
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
