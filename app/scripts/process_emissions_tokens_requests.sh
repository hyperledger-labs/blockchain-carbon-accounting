#!/bin/sh

LOGFILE="/tmp/process_emissions_tokens_requests.log"

cd /home/opentaps/blockchain-carbon-accounting || exit 1
source /home/opentaps/.bashrc
npm run supply-chain:cli -- -processrequests >> ${LOGFILE}  2>&1
