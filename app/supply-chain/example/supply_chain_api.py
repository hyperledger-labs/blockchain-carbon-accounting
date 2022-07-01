import requests
from common import logging

import config


def tokenize(issued_to, input_file_name):
    form_data = {"issuedTo": issued_to}
    files = {
        'input': open(input_file_name, 'rb')
    }
    try:
        res = requests.post(config.SUPPLY_CHAIN_API_BASE_URL + "/issue", data=form_data, files=files, verify=True)
        return res.json()
    except requests.exceptions.ConnectionError:
        return None
    except Exception as e:
        logging.error(e)
        return None

