#!/bin/bash
echo "Starting blockchain-carbon-accounting repo"

echo "Checking for carbonAccounting network..."
./scripts/startNetwork.sh

echo "Starting CAs..."
./scripts/deploy/node-one/startCA.sh

echo "Starting client..."
./scripts/startCli.sh


