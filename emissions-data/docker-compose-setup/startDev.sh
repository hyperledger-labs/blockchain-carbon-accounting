#!/bin/bash
echo "Starting blockchain-carbon-accounting repo"

echo "Checking for carbonAccounting network..."
./scripts/startNetwork.sh

echo "Starting CAs..."
./scripts/startCA.sh

echo "Building chaincode compilation environment..."
docker build -f "./docker/golang-node.dockerfile" -t golang-node:latest "./docker"

echo "Starting client..."
./scripts/startCli.sh

echo "Generating crpyto and orgs..."
docker exec cli /bin/bash ./network.sh up

echo "Starting orderers, peers, and couchdb..."
sh ./scripts/startAndConnectNetwork.sh

echo "Creating the channel..."
docker exec cli /bin/bash ./network.sh createChannel

echo "Installing utility emissions channel TypeScript chaincode..."
docker exec cli /bin/bash ./network.sh deployCC -ccn emissions -ccp ../chaincode/emissionscontract/typescript -ccv 1 -ccl typescript

echo "Installing datalock chaincode..."
docker exec cli /bin/bash ./network.sh deployCC -ccn datalock -ccp ../chaincode/datalock -ccv 1 -ccl go

echo "Starting the api..."
./scripts/startApi.sh $1