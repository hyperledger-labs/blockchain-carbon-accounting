#!/bin/sh

cd /home/opentaps/blockchain-carbon-accounting/supply-chain || exit 1
npm run cli -- -processrequests
