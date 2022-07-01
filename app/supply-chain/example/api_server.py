import requests
from common import logging

import config


def get_token(node_id, request_uuid):
    try:
        res = requests.get(config.API_SERVER_BASE_URL +
                           "/emissionsrequesttoken/{}/{}".format(node_id, request_uuid))
        return res.json()
    except requests.exceptions.ConnectionError:
        return None
    except Exception as e:
        logging.error(e)
        return None
