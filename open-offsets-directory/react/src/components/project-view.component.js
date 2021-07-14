import Pagination from "@material-ui/lab/Pagination";
import React, { Component } from "react";
import Linkify from "react-linkify";
import { ActivityIndicator } from "react-native";
import ProjectDataService from "../services/project.service";

const componentDecorator = (href, text, key) => (
  <a href={href} key={key} target="_blank" rel="noreferrer">
    {text}
  </a>
);

const DEFAULT_PAGE_SIZE = 25;

export default class Project extends Component {
  constructor(props) {
    super(props);
    this.getProject = this.getProject.bind(this);
    this.goBack = this.goBack.bind(this);
    this.handleIssuancesPageChange = this.handleIssuancesPageChange.bind(this);
    this.handleIssuancesPageSizeChange =
      this.handleIssuancesPageSizeChange.bind(this);
    this.handleRetirementsPageChange =
      this.handleRetirementsPageChange.bind(this);
    this.handleRetirementsPageSizeChange =
      this.handleRetirementsPageSizeChange.bind(this);

    this.pageSizes = [10, 25, 50, 100];
    this.state = {
      current: {
        id: null,
        project_name: "",
      },
      issuances: [],
      issuances_page: 1,
      issuances_count: 0,
      issuances_pageSize: DEFAULT_PAGE_SIZE,
      issuances_loadingIndicator: true,
      retirements_page: 1,
      retirements_count: 0,
      retirements_pageSize: DEFAULT_PAGE_SIZE,
      retirements_loadingIndicator: false,
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
          issuances_page: 1,
          issuances_count: 0,
          issuances_loadingIndicator: false,
          retirements_page: 1,
          retirements_count: 0,
          retirements_loadingIndicator: false,
        });
        console.log(response.data);
        this.setState({ issuances_loadingIndicator: true });
        this.retrieveIssuances();
        this.retrieveRetirements();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  getRequestParams(project, page, pageSize) {
    if (!project || !project.id) {
      return null;
    }

    let params = { project_id: project.id };

    if (page) {
      params["page"] = page - 1;
    }

    if (pageSize) {
      params["size"] = pageSize;
    }

    console.log("getRequestParams:: params", params);
    return params;
  }

  retrieveRetirements() {
    const { current, retirements_page, retirements_pageSize } = this.state;
    if (!current || !current.id) {
      console.log("No current project to fetch retirements for !");
      return;
    }
    ProjectDataService.getRetirements(
      this.getRequestParams(current, retirements_page, retirements_pageSize)
    )
      .then((retirements_response) => {
        const { retirements, totalPages } = retirements_response.data;
        this.setState({
          retirements,
          retirements_count: totalPages,
        });
        this.setState({ retirements_loadingIndicator: false });
      })
      .catch((e) => {
        this.setState({ retirements_loadingIndicator: false });
        console.log(e);
      });
  }

  retrieveIssuances() {
    const { current, issuances_page, issuances_pageSize } = this.state;
    if (!current || !current.id) {
      console.log("No current project to fetch issuances for !");
      return;
    }
    ProjectDataService.getIssuances(
      this.getRequestParams(current, issuances_page, issuances_pageSize)
    )
      .then((issuances_response) => {
        const { issuances, totalPages } = issuances_response.data;
        this.setState({
          issuances,
          issuances_count: totalPages,
        });
        this.setState({ issuances_loadingIndicator: false });
      })
      .catch((e) => {
        this.setState({ issuances_loadingIndicator: false });
        console.log(e);
      });
  }

  refreshIssuancesList() {
    this.retrieveIssuances();
  }

  refreshRetirementsList() {
    this.retrieveRetirements();
  }

  handleIssuancesPageChange(event, value) {
    console.log("handleIssuancesPageChange:: ", event, value);
    this.setState(
      {
        issuances_page: value,
      },
      () => {
        this.refreshIssuancesList();
      }
    );
  }

  handleIssuancesPageSizeChange(event) {
    console.log("handleIssuancesPageSizeChange:: ", event);
    this.setState(
      {
        issuances_pageSize: event.target.value,
        issuances_page: 1,
      },
      () => {
        this.refreshIssuancesList();
      }
    );
  }

  handleRetirementsPageChange(event, value) {
    console.log("handleRetirementsPageChange:: ", event, value);
    this.setState(
      {
        retirements_page: value,
      },
      () => {
        this.refreshRetirementsList();
      }
    );
  }

  handleRetirementsPageSizeChange(event) {
    console.log("handleRetirementsPageSizeChange:: ", event);
    this.setState(
      {
        retirements_pageSize: event.target.value,
        retirements_page: 1,
      },
      () => {
        this.refreshRetirementsList();
      }
    );
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

  renderSpinner(loading) {
    return loading ? (
      <div className="spinner-placeholder">
        <ActivityIndicator size="large" color="blue" animating={loading} />
      </div>
    ) : (
      ""
    );
  }

  renderPaginator(count, page, pageSize, pageChangeHandler, pageSizeHandler) {
    return count === 0 ? (
      <p>No items found.</p>
    ) : (
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
            onChange={pageChangeHandler}
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
              onChange={pageSizeHandler}
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
    );
  }

  render() {
    const {
      current,
      issuances,
      issuances_count,
      issuances_page,
      issuances_pageSize,
      issuances_loadingIndicator,
      retirements,
      retirements_count,
      retirements_page,
      retirements_pageSize,
      retirements_loadingIndicator,
    } = this.state;

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
            <div className="issuances">
              <h4>Issuances</h4>
              {this.renderSpinner(issuances_loadingIndicator)}
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Vintage Year</th>
                    <th scope="col">Issuance Date</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Serial Number</th>
                  </tr>
                </thead>
                <tbody>
                  {issuances &&
                    issuances.map((issuance, index) => (
                      <tr key={index}>
                        <td>{issuance.vintage_year}</td>
                        <td>{issuance.issuance_date}</td>
                        <td>{issuance.quantity_issued}</td>
                        <td>{issuance.serial_number}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {this.renderPaginator(
                issuances_count,
                issuances_page,
                issuances_pageSize,
                this.handleIssuancesPageChange,
                this.handleIssuancesPageSizeChange
              )}
            </div>

            <div className="retirements">
              <h4>Retirements</h4>
              {this.renderSpinner(retirements_loadingIndicator)}
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Vintage Year</th>
                    <th scope="col">Retirement Date</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Serial Number</th>
                    <th scope="col">Beneficiary</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {retirements &&
                    retirements.map((retirement, index) => (
                      <tr key={index}>
                        <td>{retirement.vintage_year}</td>
                        <td>{retirement.retirement_date}</td>
                        <td>{retirement.quantity_retired}</td>
                        <td>{retirement.serial_number}</td>
                        <td>{retirement.retirement_beneficiary}</td>
                        <td>{retirement.retirement_reason}</td>
                        <td>{retirement.retirement_detail}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {this.renderPaginator(
                retirements_count,
                retirements_page,
                retirements_pageSize,
                this.handleRetirementsPageChange,
                this.handleRetirementsPageSizeChange
              )}
            </div>
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
