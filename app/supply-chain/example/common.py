import logging
from logging.handlers import RotatingFileHandler

import config

log_format = '%(asctime)s [%(filename)s] - %(levelname)s: %(message)s'
log_date_fmt = '%m/%d/%Y %I:%M:%S %p'
logging.basicConfig(level=config.LOG_LEVEL, format=log_format, datefmt=log_date_fmt)

# add a rotating handler
if config.LOG_FILE:
    handler = RotatingFileHandler(config.LOG_FILE, maxBytes=(70 * 1048576), backupCount=5)
    handler.setLevel(config.LOG_LEVEL)
    formatter = logging.Formatter(log_format, datefmt=log_date_fmt)
    handler.setFormatter(formatter)
    logging.getLogger('').addHandler(handler)

