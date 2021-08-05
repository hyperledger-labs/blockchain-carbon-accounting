import http from "../http-common";

class ProjectDataService {
  getAll(params) {
    return http.get("/projects", { params });
  }

  getRegistries(params) {
    return http.get("/registries", { params });
  }

  getRatings(params) {
    return http.get("/ratings", { params });
  }

  getIssuances(params) {
    return http.get("/issuances", { params });
  }

  getRetirements(params) {
    return http.get("/retirements", { params });
  }

  get(id) {
    return http.get(`/projects/${id}`);
  }

  create(data) {
    return http.post("/projects", data);
  }

  update(id, data) {
    return http.put(`/projects/${id}`, data);
  }

  delete(id) {
    return http.delete(`/projects/${id}`);
  }

  fields() {
    return [
      { label: "Name", name: "project_name" },
      { label: "Scope", name: "scope" },
      { label: "Type", name: "type" },
      { label: "Region", name: "project_site_region" },
      { label: "Country", name: "project_site_country" },
      { label: "State", name: "project_site_state" },
      { label: "Location", name: "project_site_location" },
      { label: "Developer", name: "developer" },
      { label: "Total Issued", name: "total_issued", fmtNumber: true },
      { label: "Total Retired", name: "total_retired", fmtNumber: true },
      {
        label: "Total Outstanding",
        name: "total_outstanding",
        fmtNumber: true,
      },
      {
        label: "Total Issued on Future Years",
        name: "total_issued_future_years",
        fmtNumber: true,
      },
      {
        label: "Total Retired on Unknown Years",
        name: "total_retired_unknown_years",
        fmtNumber: true,
      },
      { label: "First Project Year", name: "first_project_year" },
      { label: "Project Owner", name: "project_owner" },
      { label: "Offset Project Operator", name: "offset_project_operator" },
      {
        label: "Authorized Project Designee",
        name: "authorized_project_designee",
      },
      { label: "Voluntary Status", name: "voluntary_status" },
      { label: "Project Website", name: "project_website" },
      { label: "Notes", name: "notes" },
      { label: "Date Added", name: "date_added" },
      { label: "Source", name: "source" },
      { label: "By User", name: "by_user" },
    ];
  }
}

export default new ProjectDataService();
