import React, { Component } from "react";
import Linkify from "react-linkify";
import ProjectDataService from "../services/project.service";

const componentDecorator = (href, text, key) => (
  <a href={href} key={key} target="_blank" rel="noreferrer">
    {text}
  </a>
);

export default class Project extends Component {
  constructor(props) {
    super(props);
    this.getProject = this.getProject.bind(this);
    this.goBack = this.goBack.bind(this);

    this.state = {
      current: {
        id: null,
        project_name: "",
      },
      message: "",
    };
  }

  componentDidMount() {
    this.getProject(this.props.match.params.id);
  }

  goBack() {
    this.props.history.goBack();
  }

  getProject(id) {
    ProjectDataService.get(id)
      .then((response) => {
        this.setState({
          current: response.data,
        });
        console.log(response.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  renderProjectField(field, current) {
    return (
      <div key={field.label}>
        <label>
          <strong>{field.label}:</strong>
        </label>{" "}
        <Linkify componentDecorator={componentDecorator}>
          {current[field.name] && field.fmtNumber
            ? parseInt(current[field.name]).toLocaleString()
            : current[field.name]}
        </Linkify>
      </div>
    );
  }

  render() {
    const { current } = this.state;

    return (
      <div>
        {current ? (
          <div>
            <h4>
              Project {current.project_name}{" "}
              <button
                className="btn btn-primary btn-sm ms-4"
                onClick={this.goBack}
              >
                Back
              </button>
            </h4>
            <div className="mt-4">
              {ProjectDataService.fields().map((f) =>
                this.renderProjectField(f, current)
              )}
            </div>
            <p>{this.state.message}</p>
          </div>
        ) : (
          <div>
            <br />
            <p>Please select on a Project...</p>
          </div>
        )}
      </div>
    );
  }
}
