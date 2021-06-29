import Pagination from "@material-ui/lab/Pagination";
import React, { Component } from "react";
import ProjectDataService from "../services/project.service";

const FIELD_OPS = [
  { label: "=", value: "eq" },
  { label: ">", value: "gt" },
  { label: ">=", value: "gte" },
  { label: "<", value: "lt" },
  { label: "<=", value: "lte" },
  { label: "!=", value: "neq" },
  { label: "contains", value: "contains" },
];

export default class ProjectsList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchValue = this.onChangeSearchValue.bind(this);
    this.retrieveProjects = this.retrieveProjects.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveProject = this.setActiveProject.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
    this.searchOnKeyUp = this.searchOnKeyUp.bind(this);
    this.handleSearchFieldChange = this.handleSearchFieldChange.bind(this);
    this.handleSearchOpChange = this.handleSearchOpChange.bind(this);
    this.addSearchField = this.addSearchField.bind(this);
    this.removeSearchField = this.removeSearchField.bind(this);

    this.state = {
      projects: [],
      currentProject: null,
      currentIndex: -1,
      // default to the project name search only
      searchFields: [
        { ...ProjectDataService.fields()[1], value: "", op: "contains" },
      ],

      page: 1,
      count: 0,
      pageSize: 25,
    };

    this.pageSizes = [10, 25, 50, 100];
  }

  componentDidMount() {
    this.retrieveProjects();
  }

  searchOnKeyUp(event) {
    if (event.charCode === 13) {
      this.retrieveProjects();
    }
  }

  getRequestParams(searchFields, page, pageSize) {
    let params = {};

    if (searchFields && searchFields.length) {
      searchFields.forEach((e) => {
        params[`${e.name}__${e.op}`] = e.value;
      });
    }

    if (page) {
      params["page"] = page - 1;
    }

    if (pageSize) {
      params["size"] = pageSize;
    }

    return params;
  }

  retrieveProjects() {
    const { searchFields, page, pageSize } = this.state;
    const params = this.getRequestParams(searchFields, page, pageSize);

    ProjectDataService.getAll(params)
      .then((response) => {
        const { projects, totalPages } = response.data;

        this.setState({
          projects: projects,
          count: totalPages,
        });
        console.log(response.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveProjects();
    this.setState({
      currentProject: null,
      currentIndex: -1,
    });
  }

  setActiveProject(project, index) {
    console.log("Changed active project: ", project);
    this.setState({
      currentProject: project,
      currentIndex: index,
    });
  }

  onChangeSearchValue(event, index) {
    const val = event.target.value;
    this.setState((prevState) => ({
      searchFields: prevState.searchFields.map((el, j) =>
        j === index ? { ...el, value: val } : el
      ),
    }));
  }

  handleSearchFieldChange(event, index) {
    console.log("handleSearchFieldChange", index, event, event.target.value);
    // find the new selected field
    let nf = ProjectDataService.fields().find(
      (el) => el.name === event.target.value
    );
    this.setState((prevState) => ({
      searchFields: prevState.searchFields.map((el, j) =>
        j === index ? { ...el, name: nf.name, label: nf.label } : el
      ),
    }));
  }

  handleSearchOpChange(event, index) {
    console.log("handleSearchOpChange", index, event, event.target.value);
    this.setState((prevState) => ({
      searchFields: prevState.searchFields.map((el, j) =>
        j === index ? { ...el, op: event.target.value } : el
      ),
    }));
  }

  addSearchField(event, index) {
    console.log("addSearchField", index, event, event.target.value);
    // find the new selected field
    const nf = ProjectDataService.fields()[0];
    this.setState((prevState) => ({
      searchFields: prevState.searchFields.concat({
        ...nf,
        value: "",
        op: "contains",
      }),
    }));
  }

  removeSearchField(event, index) {
    console.log("removeSearchField", index, event, event.target.value);
    // don't remove all the fields.
    if (this.state.searchFields.length <= 1) return;
    this.setState((prevState) => ({
      searchFields: prevState.searchFields.filter((el, j) => index !== j),
    }));
  }

  handlePageChange(event, value) {
    this.setState(
      {
        page: value,
      },
      () => {
        this.retrieveProjects();
      }
    );
  }

  handlePageSizeChange(event) {
    this.setState(
      {
        pageSize: event.target.value,
        page: 1,
      },
      () => {
        this.retrieveProjects();
      }
    );
  }

  renderProjectField(lbl, val) {
    return (
      <div key={lbl}>
        <label>
          <strong>{lbl}:</strong>
        </label>{" "}
        {val}
      </div>
    );
  }

  render() {
    const {
      searchFields,
      projects,
      currentProject,
      currentIndex,
      page,
      count,
      pageSize,
    } = this.state;

    return (
      <div className="list row">
        <div className="col-md-8">
          <div className="input-group mb-3">
            {searchFields.map((sf, i) => (
              <div className="input-group mb-3" key={i}>
                <select
                  className="form-select"
                  onChange={(e) => this.handleSearchFieldChange(e, i)}
                  value={sf.name}
                >
                  {ProjectDataService.fields().map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  onChange={(e) => this.handleSearchOpChange(e, i)}
                  value={sf.op}
                >
                  {FIELD_OPS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder={"Search by " + sf.label}
                  value={sf.value}
                  onChange={(e) => this.onChangeSearchValue(e, i)}
                  onKeyPress={this.searchOnKeyUp}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={(e) => this.removeSearchField(e, i)}
                >
                  -
                </button>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={(e) => this.addSearchField(e, i)}
                >
                  +
                </button>
              </div>
            ))}
            <div className="input-group-append">
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={this.retrieveProjects}
              >
                Search
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <h4>Projects List</h4>
          <div className="row">
            <div className="col-auto">
              <Pagination
                className="my-3"
                count={count}
                page={page}
                siblingCount={1}
                boundaryCount={1}
                variant="outlined"
                shape="rounded"
                onChange={this.handlePageChange}
              />
            </div>
            <div className="col-auto my-3 row">
              <label className="col-auto col-form-label" htmlFor="pageSize">
                Items per Page:
              </label>
              <div className="col-auto">
                <select
                  id="pageSize"
                  className="form-select"
                  onChange={this.handlePageSizeChange}
                  value={pageSize}
                >
                  {this.pageSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <ul className="list-group">
            {projects &&
              projects.map((project, index) => (
                <li
                  className={
                    "list-group-item " +
                    (index === currentIndex ? "active" : "")
                  }
                  onClick={() => this.setActiveProject(project, index)}
                  key={index}
                >
                  {project.project_name}
                </li>
              ))}
          </ul>
        </div>
        <div className="col-md-6">
          {currentProject ? (
            <div>
              <h4>Project</h4>
              {ProjectDataService.fields().map((f) =>
                this.renderProjectField(f.label, currentProject[f.name])
              )}
            </div>
          ) : (
            <div>
              <br />
              <p>Please click on a Project...</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
