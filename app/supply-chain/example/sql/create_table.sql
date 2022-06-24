CREATE TABLE shipment_route_segment_token (
    shipment_id text NOT NULL,
    shipment_route_segment_id text NOT NULL,
    tracking_number text NOT NULL,
    status text NULL,
    token_id text NULL,
    node_id text NULL,
    emissions_request_uuid text NULL,
    error text NULL,
    created_stamp timestamptz NULL,
    created_tx_stamp timestamptz NULL,
    last_updated_stamp timestamptz NULL,
    last_updated_tx_stamp timestamptz NULL,
    CONSTRAINT pk_srs_token PRIMARY KEY (shipment_id, shipment_route_segment_id, tracking_number)
);

CREATE TABLE q_v_delivery_token (
    delivery_id text NOT NULL,
    tracking_number text NOT NULL,
    status text NULL,
    token_id text NULL,
    node_id text NULL,
    emissions_request_uuid text NULL,
    error text NULL,
    created_stamp timestamptz NULL,
    created_tx_stamp timestamptz NULL,
    last_updated_stamp timestamptz NULL,
    last_updated_tx_stamp timestamptz NULL,
    CONSTRAINT pk_qvd_token PRIMARY KEY (tracking_number)
);
