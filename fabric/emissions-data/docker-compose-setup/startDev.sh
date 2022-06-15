#!/bin/bash
# exit when any command fails
set -e

echo "=== [startDev] Starting blockchain-carbon-accounting repo"

echo "=== [startDev] Checking for carbonAccounting network..."
./scripts/startNetwork.sh

echo "=== [startDev] Starting CAs..."
./scripts/startCA.sh

echo "=== [startDev] Building chaincode compilation environment..."
docker build -f "./docker/golang-node.dockerfile" -t golang-node:latest "./docker"

echo "=== [startDev] Starting client..."
./scripts/startCli.sh

echo "=== [startDev] Generating crpyto and orgs..."
docker exec cli /bin/bash ./network.sh up

echo "=== [startDev] Starting orderers, peers, and couchdb..."
sh ./scripts/startAndConnectNetwork.sh

echo "=== [startDev] Creating the channel..."
docker exec cli /bin/bash ./network.sh createChannel

echo "=== [startDev] Installing utility emissions channel TypeScript chaincode..."
docker exec cli /bin/bash ./network.sh deployCC -ccn emissions -ccp ../chaincode/emissionscontract/typescript -ccv 1 -ccl typescript

echo "=== [startDev] Installing datalock chaincode..."
docker exec cli /bin/bash ./network.sh deployCC -ccn datalock -ccp ../chaincode/datalock -ccv 1 -ccl go

echo "=== [startDev] Starting the api..."
./scripts/startApi.sh $1
