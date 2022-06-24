import pgdb
import config
from common import logging


def get_connection():
    return pgdb.connect(host=config.DB_HOST, database=config.DB_NAME, port=config.DB_PORT,
                        user=config.DB_USER, password=config.DB_PASS)


def check_tracking_code_token(conn, tracking):
    cursor = conn.cursor()
    token = None
    
    sql = ''' select token_id from shipment_route_segment_token 
                where tracking_number = %s and token_id is not null
            union select token_id from q_v_delivery_token
                where tracking_number = %s and token_id is not null
            '''
    try:
        cursor.execute(sql, (tracking, tracking,))
        token = cursor.fetchone()
    except Exception as e:
        logging.exception(e)

    cursor.close()
    return token


def get_shipment_route_segments(conn, from_date, thru_date, facility_id):
    cursor = conn.cursor()

    sql = ''' select srs.shipment_id, srs.shipment_route_segment_id, srs.origin_facility_id,
        srs.origin_contact_mech_id, srs.dest_contact_mech_id,
        srs.carrier_party_id, srs.shipment_method_type_id,
        srs.tracking_id_number,
        srs.billing_weight,
        srs.billing_weight_uom_id,
        pa.address1 as origin_address1,
        pa.address2 as origin_address2,
        pa.city as origin_city,
        pa.postal_code as origin_postal_code,
        pa.country_geo_id as origin_country_geo_id,
        pa.state_province_geo_id as origin_state_province_geo_id,
        pa.postal_code_ext as origin_postal_code_ext,
        pa.state_province_name as origin_state_province_name,
        pa1.address1 as dest_address1,
        pa1.address2 as dest_address2,
        pa1.city as dest_city,
        pa1.postal_code as dest_postal_code,
        pa1.country_geo_id as dest_country_geo_id,
        pa1.state_province_geo_id as dest_state_province_geo_id,
        pa1.postal_code_ext as dest_postal_code_ext,
        pa1.state_province_name as dest_state_province_name
        from shipment_route_segment srs
        join postal_address pa on srs.origin_contact_mech_id = pa.contact_mech_id
        join postal_address pa1 on srs.dest_contact_mech_id = pa1.contact_mech_id
        where srs.origin_facility_id = %s
        and srs.created_stamp between %s and %s
        order by srs.shipment_id '''

    try:
        cursor.execute(sql, (facility_id, from_date, thru_date,))
    except Exception as e:
        logging.exception(e)

    return cursor


def get_q_v_subscription_file_deliveries(conn, from_date, thru_date):
    cursor = conn.cursor()

    sql = '''select
        qv.delivery_id,
        qv.tracking_number
        from q_v_subscription_file_delivery qv
        where
        (qv.delivery_date + qv.delivery_time) between %s and %s
        order by qv.delivery_date, qv.delivery_time '''

    try:
        cursor.execute(sql, (from_date, thru_date,))
    except Exception as e:
        logging.exception(e)

    return cursor


def save_q_v_delivery_token(conn, delivery_id, tracking, status, token_id, node_id, emissions_request_uuid, error):
    q_v_delivery_token = get_q_v_delivery_token(conn, delivery_id, tracking)
    if q_v_delivery_token:
        update_q_v_delivery_token(conn, delivery_id, tracking,
                                  status, token_id, error)
    else:
        create_q_v_delivery_token(conn, delivery_id, tracking,
                                  status, token_id, node_id, emissions_request_uuid, error)


def get_q_v_delivery_token(conn, delivery_id, tracking):
    q_v_delivery_token = None

    cursor = conn.cursor()
    try:
        cursor.execute(''' select delivery_id, token_id
        from q_v_delivery_token
        where delivery_id = %s and tracking_number = %s
        ''', (delivery_id, tracking,))

        q_v_delivery_token = cursor.fetchone()

    except Exception as e:
        logging.exception(e)

    cursor.close()
    return q_v_delivery_token


def create_q_v_delivery_token(conn, delivery_id, tracking, status,
                              token_id, node_id, emissions_request_uuid, error):
    cursor = conn.cursor()
    try:
        cursor.execute(''' insert into q_v_delivery_token
        (delivery_id, tracking_number, status, token_id, node_id, emissions_request_uuid, error,
        created_stamp, created_tx_stamp, last_updated_stamp, last_updated_tx_stamp)
        values (%s, %s, %s, %s, %s, %s, %s, now(), now(), now(), now())
        ''', (delivery_id, tracking, status, token_id, node_id, emissions_request_uuid, error,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        logging.exception(e)

    cursor.close()


def update_q_v_delivery_token(conn, delivery_id, tracking, status, token_id, error):
    cursor = conn.cursor()
    try:
        cursor.execute(''' update q_v_delivery_token
        set status = %s,
        token_id = %s,
        error = %s,
        last_updated_stamp = now(),
        last_updated_tx_stamp = now()
        where delivery_id = %s and tracking_number = %s
        ''', (status, token_id, error, delivery_id, tracking,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        logging.exception(e)

    cursor.close()


def save_shipment_route_segment_token(conn, shipment_id, shipment_route_segment_id, tracking, status,
                                      token_id, node_id, emissions_request_uuid, error):
    shipment_route_segment_token = get_shipment_route_segment_token(conn, shipment_id,
                                                                    shipment_route_segment_id, tracking)
    if shipment_route_segment_token:
        update_shipment_route_segment_token(conn, shipment_id, shipment_route_segment_id, tracking,
                                            status, token_id, error)
    else:
        create_shipment_route_segment_token(conn, shipment_id, shipment_route_segment_id, tracking,
                                            status, token_id, node_id, emissions_request_uuid, error)


def get_shipment_route_segment_token(conn, shipment_id, shipment_route_segment_id, tracking):
    shipment_route_segment_token = None

    cursor = conn.cursor()
    try:
        cursor.execute(''' select shipment_id, shipment_route_segment_id, token_id
        from shipment_route_segment_token
        where shipment_id = %s and shipment_route_segment_id = %s and tracking_number = %s
        ''', (shipment_id, shipment_route_segment_id, tracking,))

        shipment_route_segment_token = cursor.fetchone()

    except Exception as e:
        logging.exception(e)

    cursor.close()
    return shipment_route_segment_token


def create_shipment_route_segment_token(conn, shipment_id, shipment_route_segment_id,
                                        tracking, status, token_id, node_id, emissions_request_uuid, error):
    cursor = conn.cursor()
    try:
        cursor.execute(''' insert into shipment_route_segment_token
        (shipment_id, shipment_route_segment_id, tracking_number, status, token_id, node_id, emissions_request_uuid,
        error, created_stamp, created_tx_stamp, last_updated_stamp, last_updated_tx_stamp)
        values (%s, %s, %s, %s, %s, %s, %s, %s, now(), now(), now(), now())
        ''', (shipment_id, shipment_route_segment_id, tracking, status, token_id,
              node_id, emissions_request_uuid, error,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        logging.exception(e)

    cursor.close()


def update_shipment_route_segment_token(conn, shipment_id, shipment_route_segment_id,
                                        tracking, status, token_id, error):
    cursor = conn.cursor()
    try:
        cursor.execute(''' update shipment_route_segment_token 
        set status = %s,
        token_id = %s,
        error = %s,
        last_updated_stamp = now(),
        last_updated_tx_stamp = now()
        where shipment_id = %s and shipment_route_segment_id = %s and tracking_number = %s
        ''', (status, token_id, error, shipment_id, shipment_route_segment_id, tracking,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        logging.exception(e)

    cursor.close()


def get_queued_shipment_route_segment_tokens(conn):
    cursor = conn.cursor()
    try:
        cursor.execute(''' select shipment_id, shipment_route_segment_id, tracking_number,
        node_id, emissions_request_uuid
        from shipment_route_segment_token
        where token_id = %s
        and node_id is not null
        and emissions_request_uuid is not null
        order by created_stamp
        ''', ('queued',))
    except Exception as e:
        logging.exception(e)

    return cursor


def get_queued_q_v_delivery_tokens(conn):
    cursor = conn.cursor()
    try:
        cursor.execute(''' select delivery_id, tracking_number, node_id, emissions_request_uuid
        from q_v_delivery_token
        where token_id = %s
        and node_id is not null
        and emissions_request_uuid is not null
        order by created_stamp
        ''', ('queued',))
    except Exception as e:
        logging.exception(e)

    return cursor
