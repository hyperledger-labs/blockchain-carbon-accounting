import argparse
import json
from datetime import datetime

import db
import supply_chain_api
from common import logging


def tokenize_emissions(conn, from_date, thru_date, facility_id, issuee, pubkey):
    json_file_name = '/tmp/tokenize_input.json'
    from_timestamp = datetime.strptime(from_date, '%Y-%m-%d %H:%M:%S')
    thru_timestamp = datetime.strptime(thru_date, '%Y-%m-%d %H:%M:%S')
    shipment_route_segments = db.get_shipment_route_segments(conn, from_timestamp, thru_timestamp, facility_id)
    try:
        activities = []
        while True:
            rows = shipment_route_segments.fetchmany(1000)
            if len(rows) == 0:
                break

            for row in rows:
                activity = {"id": row.shipment_id + ":" + row.shipment_route_segment_id, "type": "shipment",
                            "carrier": row.carrier_party_id.lower()}

                if row.tracking_id_number:
                    activity["tracking"] = row.tracking_id_number

                if row.carrier_party_id != "UPS" or not row.tracking_id_number:
                    if row.shipment_method_type_id:
                        activity["mode"] = row.shipment_method_type_id.lower()
                    from_addr = {"country": row.origin_country_geo_id}
                    if row.origin_state_province_geo_id:
                        from_addr["state_province"] = row.origin_state_province_geo_id
                    from_addr["city"] = row.origin_city
                    from_addr["address"] = row.origin_address1
                    if row.origin_address2:
                        from_addr["address"] += " " + row.origin_address2

                    activity["from"] = from_addr

                    to_addr = {"country": row.dest_country_geo_id}
                    if row.dest_state_province_geo_id:
                        to_addr["state_province"] = row.dest_state_province_geo_id
                    to_addr["city"] = row.dest_city
                    to_addr["address"] = row.dest_address1
                    if row.dest_address2:
                        to_addr["address"] += " " + row.dest_address2

                    activity["to"] = to_addr

                    if row.billing_weight:
                        activity["weight"] = row.billing_weight
                    if row.billing_weight_uom_id:
                        activity["weight_uom"] = row.billing_weight_uom_id.lower()
                activities.append(activity)

        if len(activities) == 0:
            logging.warning("Noting to tokenize")
        else:
            input_data = {"activities": activities}
            with open(json_file_name, 'w') as outfile:
                json.dump(input_data, outfile, sort_keys=True, indent=4)
            tokenize_data = supply_chain_api.tokenize(issuee, pubkey, json_file_name)
            if tokenize_data:
                save_tokenize_result(conn, tokenize_data)
            else:
                logging.error("Cannot tokenize shipments")
    except Exception as e1:
        logging.exception(e1)
    finally:
        shipment_route_segments.close()


def save_tokenize_result(conn, tokenize_data):
    for item in tokenize_data:
        tmp = item["id"].split(":")
        token_id = None
        error = None
        status = "failed"
        if "tokenId" in item:
            token_id = item["tokenId"]
            status = "success"
        elif "error" in item:
            error = item["error"]
        else:
            error = "Cannot create a token"

        logging.info("tokenize_emissions: shipment {}:{} - {}"
                     .format(tmp[0], tmp[1], status))
        if error:
            error = str(error)
        db.save_token(conn, tmp[0], tmp[1], status, token_id, error)


def main(args):
    try:
        conn = db.get_connection()
    except Exception as e:
        logging.exception("Cannot connect to database")
    else:
        tokenize_emissions(conn, args.from_date, args.thru_date, args.facility_id, args.issuee, args.pubkey)
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--from_date", help="shipments from date, format YYYY-MM-DD HH:MM:SS", required=True)
    parser.add_argument("--thru_date", help="shipments thru date, format YYYY-MM-DD HH:MM:SS", required=True)
    parser.add_argument("--facility_id", required=True)
    parser.add_argument("--issuee", required=True)
    parser.add_argument("--pubkey", help="public key file name", required=True)

    args = parser.parse_args()
    main(args)
