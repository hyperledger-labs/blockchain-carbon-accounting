DROP TABLE IF EXISTS csv_acr_issuances;

CREATE TABLE csv_acr_issuances (
    date_issued text,
    project_id text,
    project_name text,
    project_developer text,
    project_type text,
    project_version text,
    arb_eligible text,
    corsia_qualified text,
    vintage integer,
    issuance_year integer,
    total_credits_issued bigint,
    credits_issued_to_project bigint,
    credits_issued_to_buffer_pool bigint,
    project_site_location text,
    project_site_state text,
    project_site_country text,
    additional_certifications text,
    verifier text,
    project_website text
);

COPY csv_acr_issuances FROM STDIN WITH (FORMAT CSV, HEADER);
