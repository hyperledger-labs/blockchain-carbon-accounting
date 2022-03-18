import requests

import config


def tokenize(issuee, pubkey, input_file_name):
    form_data = {"issuee": issuee}
    files = {
        'keys': open(pubkey, 'rb'),
        'input': open(input_file_name, 'rb')
    }
    try:
        res = requests.post(config.API_BASE_URL + "/issue", data=form_data, files=files, verify=True)
        return res.json()
    except requests.exceptions.ConnectionError:
        return None

