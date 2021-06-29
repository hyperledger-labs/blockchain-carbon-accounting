import http from "../http-common";

class ProjectDataService {
  getAll(params) {
    return http.get("/projects", { params });
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
      { label: "ID", name: "project_id" },
      { label: "Name", name: "project_name" },
      { label: "ARB Project", name: "arb_project" },
      { label: "Registry + ARB", name: "registry_and_arb" },
      { label: "Scope", name: "scope" },
      { label: "Type", name: "type" },
      { label: "Methodology / Proposal", name: "methodology_protocol" },
      { label: "Region", name: "project_site_region" },
      { label: "Country", name: "project_site_country" },
      { label: "State", name: "project_site_state" },
      { label: "Location", name: "project_site_location" },
      { label: "Developer", name: "developer" },
      { label: "Total Issued", name: "total_issued" },
      { label: "Total Retired", name: "total_retired" },
      { label: "Total Outstanding", name: "total_outstanding" },
      {
        label: "Total Issued on Future Years",
        name: "total_issued_future_years",
      },
      {
        label: "Total Retired on Unknown Years",
        name: "total_retired_unknown_years",
      },
      { label: "First Project Year", name: "first_project_year" },
      { label: "Project Owner", name: "project_owner" },
      { label: "Offset Project Operator", name: "offset_project_operator" },
      {
        label: "Authorized Project Designee",
        name: "authorized_project_designee",
      },
      { label: "Verifier", name: "verifier" },
      { label: "Voluntary Status", name: "voluntary_status" },
      { label: "Project Listed", name: "project_listed" },
      { label: "Project Registered", name: "project_registered" },
      { label: "ARB ID", name: "arb_id" },
      { label: "Active CCB Status", name: "active_ccb_status" },
      { label: "Project Type", name: "project_type" },
      { label: "Notes", name: "notes" },
      { label: "Date Added", name: "date_added" },
      { label: "Source", name: "source" },
      { label: "By User", name: "by_user" },
    ];
  }
}

export default new ProjectDataService();
