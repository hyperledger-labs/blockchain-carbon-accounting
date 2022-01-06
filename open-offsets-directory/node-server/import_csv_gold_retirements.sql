DROP TABLE IF EXISTS csv_gold_retirements;

CREATE TABLE csv_gold_retirements (
    gsid text,
    id text,
    vintage integer,
    credit_status text,
    quantity bigint,
    project_name text,
    project_developer text,
    country text,
    product_type text,
    project_type text,
    issuance_date date,
    retirement_date date,
    monitoring_period_start date,
    monitoring_period_end date,
    serial_number text,
    notes text,
    retirement_year integer,
    notes2 text,
    source_data text,
    issuance text,
    issuance_serial_number text
);

COPY csv_gold_retirements FROM STDIN WITH (FORMAT CSV, HEADER);
