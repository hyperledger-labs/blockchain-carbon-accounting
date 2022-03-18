import argparse
import json
import logging
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
                if row.carrier_party_id == "UPS" and row.tracking_id_number:
                    tracking_numbers = row.tracking_id_number.split(",")
                    for tracking in tracking_numbers:
                        tracking = tracking.strip()
                        if len(tracking) > 18:
                            logging.warning("Could be wrong tracking number: skip shipment {}:{} - tracking: {}"
                                            .format(row.shipment_id, row.shipment_route_segment_id, tracking))
                            continue
                        item_id = row.shipment_id + ":" + row.shipment_route_segment_id + ":" + tracking
                        activity = {"id": item_id, "type": "shipment",
                                    "carrier": row.carrier_party_id.lower(), "tracking": tracking}
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
        tracking = None
        if len(tmp) > 2:
            tracking = tmp[2]
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

        logging.info("tokenize_emissions: shipment {}:{}:{} - {}"
                     .format(tmp[0], tmp[1], tracking, status))
        if error:
            error = str(error)
        db.save_token(conn, tmp[0], tmp[1], tracking, status, token_id, error)


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
