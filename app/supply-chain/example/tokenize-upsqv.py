import argparse
import json
from datetime import datetime

import db
import supply_chain_api
import api_server
from common import logging

# Note: Quantum View is a UPS service, so all deliveries are from UPS and have a UPS tracking number
CARRIER_PARTY_ID = "UPS"

def tokenize_emissions(conn, from_date, thru_date, issued_to):
    json_file_name = '/tmp/tokenize_qv_input.json'
    from_timestamp = datetime.strptime(from_date, '%Y-%m-%d %H:%M:%S')
    thru_timestamp = datetime.strptime(thru_date, '%Y-%m-%d %H:%M:%S')
    shipment_route_segments = db.get_q_v_subscription_file_deliveries(conn, from_timestamp, thru_timestamp)
    try:
        activities = []
        while True:
            rows = shipment_route_segments.fetchmany(1000)
            if len(rows) == 0:
                break

            for row in rows:
                if row.tracking_number:
                    tracking_numbers = row.tracking_number.split(",")
                    for tracking in tracking_numbers:
                        token = db.check_tracking_code_token(conn, tracking)
                        if token:
                            logging.warning("tracking number {} already tokenized, token id: {}"
                                            .format(tracking, token.token_id, ))
                            continue

                        activity = {"type": "shipment", "carrier": CARRIER_PARTY_ID.lower()}
                        tracking = tracking.strip()
                        if len(tracking) > 18:
                            logging.warning("Could be wrong tracking number: skip delivery {} - tracking: {}"
                                            .format(row.delivery_id, tracking))
                            continue
                        item_id = row.delivery_id + ":" + tracking
                        activity["id"] = item_id
                        activity["tracking"] = tracking
                        activity["from_date"] = from_timestamp.strftime('%Y-%m-%dT%H:%M:%S.000%z')
                        activity["thru_date"] = thru_timestamp.strftime('%Y-%m-%dT%H:%M:%S.000%z')

                        # # test overrides for weight / tracking
                        # # ONLY FOR TESTING
                        # if not activity.get("weight"):
                        #     activity["weight"] = "5"
                        # if not activity.get("weight_uom"):
                        #     activity["weight_uom"] = "lbs"
                        # # set a valid UPS tracking number
                        # activity["tracking"] = "1Z038EY90300111662"
                        # # END -- ONLY FOR TESTING

                        activities.append(activity)
                        logging.info(" -- activity {}".format(activity))
                else:
                    logging.warning("Unexpected QVSubscriptionFileDelivery entry without tracking number!")

        if len(activities) == 0:
            logging.warning("Nothing to tokenize")
        else:
            input_data = {"activities": activities}
            with open(json_file_name, 'w') as outfile:
                json.dump(input_data, outfile, sort_keys=True, indent=4, default=str)
            logging.info("Calling API ...")
            tokenize_data = supply_chain_api.tokenize(issued_to, json_file_name)
            logging.info("API response: {}".format(tokenize_data))
            if tokenize_data:
                save_tokenize_result(conn, tokenize_data)
            else:
                logging.error("Cannot tokenize shipments")
    except Exception as e1:
        logging.exception(e1)
    finally:
        shipment_route_segments.close()


def save_tokenize_result(conn, tokenize_data):
    # tokenize_data is either a dict or a list
    if isinstance(tokenize_data, dict):
        if tokenize_data["status"] == "failed":
            logging.error("Tokenize failed: {}".format(tokenize_data["msg"]))
            return
    success_count = 0
    error_count = 0
    for item in tokenize_data:
        tmp = item["id"].split(":")
        tracking = None
        if len(tmp) > 1:
            tracking = tmp[1]
        token_id = None
        node_id = None
        emissions_request_uuid = None
        error = None
        status = "failed"
        if "tokenId" in item:
            token_id = item["tokenId"]
            status = "success"
            success_count += 1
            if "emissionsRequestUuid" in item:
                emissions_request_uuid = item["emissionsRequestUuid"]
            if "nodeId" in item:
                node_id = item["nodeId"]
        else:
            error_count += 1
            if "error" in item:
                error = item["error"]
            else:
                error = "Cannot create a token"

        logging.info("tokenize_emissions: shipment {}:{} - {} : {}"
                     .format(tmp[0], tracking, status, error or 'queued'))
        if error:
            error = str(error)
        db.save_q_v_delivery_token(conn, tmp[0], tracking, status, token_id, node_id, emissions_request_uuid, error)
    logging.info("Results: success: {} error: {}".format(success_count, error_count))


def update_token_status(conn):
    q_v_delivery_tokens = db.get_queued_q_v_delivery_tokens(conn)
    try:
        update_counter = 0
        while True:
            rows = q_v_delivery_tokens.fetchmany(1000)
            if len(rows) == 0:
                break

            for row in rows:
                token = api_server.get_token(row.node_id, row.emissions_request_uuid)
                if token and token["status"] == 'success' and token["token"]:
                    db.update_q_v_delivery_token(conn, row.delivery_id, row.tracking_number, 'success',
                                                 token["token"]["tokenId"], None)
                    update_counter += 1

        logging.info("Results: updated: {}".format(update_counter))
    except Exception as e1:
        logging.exception(e1)
    finally:
        q_v_delivery_tokens.close()


def main(args):
    try:
        conn = db.get_connection()
    except Exception as e:
        logging.exception("Cannot connect to database")
    else:
        if args.cmd == "issue":
            tokenize_emissions(conn, args.from_date, args.thru_date, args.issued_to)
        else:
            update_token_status(conn)

        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='cmd', required=True)
    parser_a = subparsers.add_parser('issue', help='issue tokens for deliveries')
    parser_b = subparsers.add_parser('update', help='update deliveries tokens status')
    parser_a.add_argument("--from_date", help="shipments from date, format YYYY-MM-DD HH:MM:SS", required=True)
    parser_a.add_argument("--thru_date", help="shipments thru date, format YYYY-MM-DD HH:MM:SS", required=True)
    parser_a.add_argument("--issued_to", required=True, help="a wallet address to issue tokens to")

    args = parser.parse_args()
    main(args)

