DROP TABLE IF EXISTS csv_gold_issuances;

CREATE TABLE csv_gold_issuances (
    project_id text,
    gsid text,
    vintage integer,
    issuance_year integer,
    credit_status text,
    quantity bigint,
    project_name text,
    project_developer text,
    project_type text,
    product_type text,
    project_site_country text,
    methodology text,
    program_of_activities text,
    poa_gsid text,
    issuance_date timestamp,
    monitoring_period_start date,
    monitoring_period_end date,
    serial_number text,
    eligible_for_corsia text
);

COPY csv_gold_issuances FROM STDIN WITH (FORMAT CSV, HEADER);
