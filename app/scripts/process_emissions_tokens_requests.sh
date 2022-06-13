#!/bin/sh

cd /home/opentaps/blockchain-carbon-accounting || exit 1
npm run supply-chain:cli -- -processrequests
