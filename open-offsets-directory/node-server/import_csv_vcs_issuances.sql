DROP TABLE IF EXISTS csv_vcs_issuances;

CREATE TABLE csv_vcs_issuances (
    unique_issuances text,
    project_id text,
    vcs_id text,
    vintage_year integer,
    issuance_date date,
    issuance_year integer,
    project_name text,
    credits_issued bigint
);

COPY csv_vcs_issuances FROM STDIN WITH (FORMAT CSV, HEADER);
