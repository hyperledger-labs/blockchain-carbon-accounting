---
/*
ID - UUID we generate
Project ID - The Project ID column.  If it starts with "VCS" then remove "VCS".  For example, "VCS896" refers to VCS project 896.
All these columns directly map from their worksheet (see "Column Descriptions" in their spreadsheet):
ARB Project
Registry_and_ARB
Scope
Type
Methodology - Protocol means the same thing
Region
Developer
Total Issued
Total Retired
Total Outstanding
First Project Year
Total Issued Future Years - column AQ, "Credits Issued in Future Years"
Total Retired Unknown Years - column BR, "Credits Retired in Year Unknown"
Project Owner
Offset Project Operator
Authorized Project Designee
Verifier
Voluntary Status
Project Listed
Project Registered
ARB ID
Active CCB Status
Project Type
Notes
Date Added - from "Date project added to database"
Additional fields we add:
Source - text field of where it came from.  In this case "Berkeley Carbon Trading Project.  Barbara Haya, Micah Elias, Ivy So. (2021, April). Voluntary Registry Offsets Database, Berkeley Carbon Trading Project, Center for Environmental Public Policy, University of California, Berkeley. Retrieved from: https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database"
User - Record of Fabric user adding this data
*/
---

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS project;

CREATE TABLE project (
    id uuid primary key,
    project_id text,
    project_name text,
    arb_project text,
    registry_and_arb text,
    scope text,
    type text,
    methodology_protocol text,
    project_site_region text,
    project_site_country text,
    project_site_state text,
    project_site_location text,
    developer text,
    total_issued bigint,
    total_retired bigint,
    total_outstanding bigint,
    first_project_year integer,
    total_issued_future_years bigint,
    total_retired_unknown_years bigint,
    project_owner text,
    offset_project_operator text,
    authorized_project_designee text,
    verifier text,
    voluntary_status text,
    project_listed integer,
    project_registered integer ,
    arb_id text,
    active_ccb_status text,
    project_type text,
    notes text,
    date_added integer,
    source text,
    by_user text
);
