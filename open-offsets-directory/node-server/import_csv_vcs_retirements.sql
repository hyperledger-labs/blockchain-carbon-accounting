DROP TABLE IF EXISTS csv_vcs_retirements;

CREATE TABLE csv_vcs_retirements (
    id_year text,
    is_unique_for_issuance_tab text,
    vcs_id text,
    issuance_date date,
    vintage_start date,
    vintage_end date,
    project_id text,
    project_name text,
    total_vintage_quantity bigint,
    credits_quantity_issued bigint,
    serial_number text,
    additional_certifications text,
    retirement_cancellation_date date,
    retirement_beneficiary text,
    retirement_reason text,
    retirement_details text,
    vintage_year integer,
    credits_issued bigint,
    retirement_year integer,
    credits_retired bigint,
    date_format date
);

COPY csv_vcs_retirements FROM STDIN WITH (FORMAT CSV, HEADER);
