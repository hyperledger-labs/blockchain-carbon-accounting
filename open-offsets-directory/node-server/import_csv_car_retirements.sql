DROP TABLE IF EXISTS csv_car_retirements;

CREATE TABLE csv_car_retirements (
    project_id text,
    vintage integer,
    offset_credit_serial_numbers text,
    quantity_of_offset_credits bigint,
    status_effective date,
    project_name text,
    project_type text,
    protocol_version text,
    project_site_location text,
    project_site_state text,
    project_site_country text,
    additional_certifications text,
    corsia_eligible text,
    account_holder text,
    retirement_reason text,
    retirement_reason_details text,
    retirement_year integer,
    car_retirement_data text
);

COPY csv_car_retirements FROM STDIN WITH (FORMAT CSV, HEADER);
