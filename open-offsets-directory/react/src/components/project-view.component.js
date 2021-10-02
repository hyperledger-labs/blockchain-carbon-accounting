import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
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
const DEFAULT_TAB = 0;

export default class Project extends Component {
  constructor(props) {
    super(props);
    this.getProject = this.getProject.bind(this);
    this.goBack = this.goBack.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleRegistriesPageChange =
      this.handleRegistriesPageChange.bind(this);
    this.handleRegistriesPageSizeChange =
      this.handleRegistriesPageSizeChange.bind(this);
    this.handleRatingsPageChange = this.handleRatingsPageChange.bind(this);
    this.handleRatingsPageSizeChange =
      this.handleRatingsPageSizeChange.bind(this);
    this.handleIssuancesPageChange = this.handleIssuancesPageChange.bind(this);
    this.handleIssuancesPageSizeChange =
      this.handleIssuancesPageSizeChange.bind(this);
    this.handleRetirementsPageChange =
      this.handleRetirementsPageChange.bind(this);
    this.handleRetirementsPageSizeChange =
      this.handleRetirementsPageSizeChange.bind(this);

    this.pageSizes = [10, 25, 50, 100];
    this.state = {
      current_tab: DEFAULT_TAB,
      current: {
        id: null,
        project_name: "",
      },
      issuances: [],
      issuances_page: 1,
      issuances_count: 0,
      issuances_total: 0,
      issuances_pageSize: DEFAULT_PAGE_SIZE,
      issuances_loadingIndicator: true,
      retirements: [],
      retirements_page: 1,
      retirements_count: 0,
      retirements_total: 0,
      retirements_pageSize: DEFAULT_PAGE_SIZE,
      retirements_loadingIndicator: false,
      message: "",
      registries: [],
      registries_page: 1,
      registries_count: 0,
      registries_total: 0,
      registries_pageSize: DEFAULT_PAGE_SIZE,
      registries_loadingIndicator: false,
      ratings: [],
      ratings_page: 1,
      ratings_count: 0,
      ratings_total: 0,
      ratings_pageSize: DEFAULT_PAGE_SIZE,
      ratings_loadingIndicator: false,
    };
  }

  componentDidMount() {
    this.getProject(this.props.match.params.id);
  }

  goBack() {
    this.props.history.goBack();
  }

  handleTabChange(event, newValue) {
    this.setState({
      current_tab: newValue,
    });
  }

  getProject(id) {
    ProjectDataService.get(id)
      .then((response) => {
        this.setState({
          current_tab: DEFAULT_TAB,
          current: response.data,
          issuances_page: 1,
          issuances_count: 0,
          issuances_loadingIndicator: false,
          retirements_page: 1,
          retirements_count: 0,
          retirements_loadingIndicator: false,
          registries_page: 1,
          registries_count: 0,
          registries_loadingIndicator: false,
          ratings_page: 1,
          ratings_count: 0,
          ratings_loadingIndicator: false,
        });
        console.log(response.data);
        window.scrollTo(0, 0);
        this.setState({ issuances_loadingIndicator: true });
        this.retrieveRegistries();
        this.retrieveRatings();
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

  retrieveRegistries() {
    const { current, registries_page, registries_pageSize } = this.state;
    if (!current || !current.id) {
      console.log("No current project to fetch registries for !");
      return;
    }
    ProjectDataService.getRegistries(
      this.getRequestParams(current, registries_page, registries_pageSize)
    )
      .then((registries_response) => {
        const { project_registries, totalPages, totalItems } =
          registries_response.data;
        this.setState({
          registries: project_registries,
          registries_count: totalPages,
          registries_total: totalItems,
        });
        this.setState({ registries_loadingIndicator: false });
      })
      .catch((e) => {
        this.setState({ registries_loadingIndicator: false });
        console.log(e);
      });
  }

  retrieveRatings() {
    const { current, ratings_page, ratings_pageSize } = this.state;
    if (!current || !current.id) {
      console.log("No current project to fetch ratings for !");
      return;
    }
    ProjectDataService.getRatings(
      this.getRequestParams(current, ratings_page, ratings_pageSize)
    )
      .then((ratings_response) => {
        const { project_ratings, totalPages, totalItems } =
          ratings_response.data;
        this.setState({
          ratings: project_ratings,
          ratings_count: totalPages,
          ratings_total: totalItems,
        });
        this.setState({ ratings_loadingIndicator: false });
      })
      .catch((e) => {
        this.setState({ ratings_loadingIndicator: false });
        console.log(e);
      });
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
        const { retirements, totalPages, totalItems } =
          retirements_response.data;
        this.setState({
          retirements,
          retirements_count: totalPages,
          retirements_total: totalItems,
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
        const { issuances, totalPages, totalItems } = issuances_response.data;
        this.setState({
          issuances,
          issuances_count: totalPages,
          issuances_total: totalItems,
        });
        this.setState({ issuances_loadingIndicator: false });
      })
      .catch((e) => {
        this.setState({ issuances_loadingIndicator: false });
        console.log(e);
      });
  }

  refreshRegistriesList() {
    this.retrieveRegistries();
  }

  refreshRatingsList() {
    this.retrieveRatings();
  }

  refreshIssuancesList() {
    this.retrieveIssuances();
  }

  refreshRetirementsList() {
    this.retrieveRetirements();
  }

  handleRegistriesPageChange(event, value) {
    console.log("handleRegistriesPageChange:: ", event, value);
    this.setState(
      {
        registries_page: value,
      },
      () => {
        this.refreshRegistriesList();
      }
    );
  }

  handleRegistriesPageSizeChange(event) {
    console.log("handleRegistriesPageSizeChange:: ", event);
    this.setState(
      {
        registries_pageSize: event.target.value,
        registries_page: 1,
      },
      () => {
        this.refreshRegistriesList();
      }
    );
  }

  handleRatingsPageChange(event, value) {
    console.log("handleRatingsPageChange:: ", event, value);
    this.setState(
      {
        ratings_page: value,
      },
      () => {
        this.refreshRatingsList();
      }
    );
  }

  handleRatingsPageSizeChange(event) {
    console.log("handleRatingsPageSizeChange:: ", event);
    this.setState(
      {
        ratings_pageSize: event.target.value,
        ratings_page: 1,
      },
      () => {
        this.refreshRatingsList();
      }
    );
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

  renderFormattedField(field, item) {
    return item[field.name] && field.fmtNumber
      ? parseInt(item[field.name]).toLocaleString()
      : item[field.name]
  }

  renderProjectField(field, current) {
    return (
      <div key={field.label}>
        <label>
          <strong>{field.label}:</strong>
        </label>{" "}
        <Linkify componentDecorator={componentDecorator}>
          {this.renderFormattedField(field, current)}
        </Linkify>
      </div>
    );
  }

  renderFieldsTableHeaders(fields) {
    return (
      <thead>
        <tr>
          {fields.map((f) => (
            <th key={f.label} scope="col">{f.label}</th>
          ))}
        </tr>
      </thead>
    );
  }

  renderFieldsTableRow(fields, item, index) {
    return (
      <tr key={index}>
        {fields.map((f) =>
          f.linkify ? (
            <Linkify componentDecorator={componentDecorator} key={`${index}_${f.label}`}>
              <td>{this.renderFormattedField(f, item)}</td>
            </Linkify>
          ) : (
            <td key={`${index}_${f.label}`}>{this.renderFormattedField(f, item)}</td>
          )
        )}
      </tr>
    );
  }

  renderFieldsTableBody(fields, items) {
    return (
      <tbody>
        {items &&
          items.map(
            (item, index) => this.renderFieldsTableRow(fields, item, index)
          )
        }
      </tbody>
    )
  }

  renderFieldsTable(fields, items) {
    return (
      <table className="table">
        {this.renderFieldsTableHeaders(fields)}
        {this.renderFieldsTableBody(fields, items)}
      </table>
    )
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
      issuances_total,
      issuances_page,
      issuances_pageSize,
      issuances_loadingIndicator,
      retirements,
      retirements_count,
      retirements_total,
      retirements_page,
      retirements_pageSize,
      retirements_loadingIndicator,
      registries,
      registries_count,
      registries_total,
      registries_page,
      registries_pageSize,
      registries_loadingIndicator,
      ratings,
      ratings_count,
      ratings_total,
      ratings_page,
      ratings_pageSize,
      ratings_loadingIndicator,
      current_tab,
    } = this.state;

    return (
      <div>
        {current ? (
          <div className="inner-list-placeholder">
            <h4>
              Project {current.project_name}{" "}
              <button
                className="btn btn-primary btn-sm ms-4"
                onClick={this.goBack}
              >
                Back
              </button>
            </h4>

            <Tabs
              value={current_tab}
              indicatorColor="primary"
              textColor="primary"
              onChange={this.handleTabChange}
            >
              <Tab label="Details" />
              <Tab label={`Registries (${registries_total})`} />
              <Tab label={`Ratings (${ratings_total})`} />
              <Tab label={`Issuances (${issuances_total})`} />
              <Tab label={`Retirements (${retirements_total})`} />
            </Tabs>

            <p>{this.state.message}</p>
            <div role="tabpanel" hidden={current_tab !== 0}>
              <div className="mt-4">
                {ProjectDataService.fields()
                  .filter((f) => !f.searchOnly)
                  .map((f) => this.renderProjectField(f, current))}
              </div>
            </div>

            <div role="tabpanel" hidden={current_tab !== 1}>
              {this.renderSpinner(registries_loadingIndicator)}
              {this.renderFieldsTable(
                ProjectDataService.registry_fields(),
                registries
              )}
              {this.renderPaginator(
                registries_count,
                registries_page,
                registries_pageSize,
                this.handleRegistriesPageChange,
                this.handleRegistriesPageSizeChange
              )}
            </div>

            <div role="tabpanel" hidden={current_tab !== 2}>
              {this.renderSpinner(ratings_loadingIndicator)}
              {this.renderFieldsTable(
                ProjectDataService.rating_fields(),
                ratings
              )}
              {this.renderPaginator(
                ratings_count,
                ratings_page,
                ratings_pageSize,
                this.handleRatingsPageChange,
                this.handleRatingsPageSizeChange
              )}
            </div>

            <div role="tabpanel" hidden={current_tab !== 3}>
              {this.renderSpinner(issuances_loadingIndicator)}
              {this.renderFieldsTable(
                ProjectDataService.issuance_fields(),
                issuances
              )}
              {this.renderPaginator(
                issuances_count,
                issuances_page,
                issuances_pageSize,
                this.handleIssuancesPageChange,
                this.handleIssuancesPageSizeChange
              )}
            </div>

            <div role="tabpanel" hidden={current_tab !== 4}>
              {this.renderSpinner(retirements_loadingIndicator)}
              {this.renderFieldsTable(
                ProjectDataService.retirement_fields(),
                retirements
              )}
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
          <div className="empty-placeholder">
            <br />
            <p>Please select on a Project...</p>
          </div>
        )}
      </div>
    );
  }
}
