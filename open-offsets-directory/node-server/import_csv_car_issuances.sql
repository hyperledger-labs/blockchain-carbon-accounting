DROP TABLE IF EXISTS csv_car_issuances;

CREATE TABLE csv_car_issuances (
    date_issued text,
    project_id text,
    cooperative_aggregate_id text,
    project_name text,
    project_developer text,
    project_owner text,
    project_type text,
    protocol_version text,
    arb_eligible text,
    corsia_qualified text,
    vintage integer,
    issuance_year integer,
    total_offset_credits_issued bigint,
    offset_credits_currently_in_reserve_buffer_pool bigint,
    offset_credits_intended_for_arb_buffer_pool bigint,
    offset_credits_converted_to_vcus bigint,
    canceled_for_arb_compliance integer,
    canceled integer,
    project_site_location text,
    project_site_state text,
    project_site_country text,
    additional_certifications text,
    verification_body text,
    project_website text
);

COPY csv_car_issuances FROM STDIN WITH (FORMAT CSV, HEADER);
