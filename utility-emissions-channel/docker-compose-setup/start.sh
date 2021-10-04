#!/bin/bash
echo "Starting blockchain-carbon-accounting repo"

echo "Checking for carbonAccounting network..."
./scripts/startNetwork.sh

echo "Starting CAs..."
./scripts/startCA.sh
echo "Starting client..."
./scripts/startCli.sh

echo "Generating crpyto and orgs..."
docker exec cli /bin/bash ./network.sh up

echo "Starting orderers, peers, and couchdb..."
sh ./scripts/startAndConnectNetwork.sh

echo "Creating the channel..."
docker exec cli /bin/bash ./network.sh createChannel

echo "Install ext chaincode..."
docker exec cli /bin/bash ./scripts/installChaincode.sh 1 2
docker exec cli /bin/bash ./scripts/installChaincode.sh 1 1

echo "Starting ext chaincode..."
sh ./scripts/startExtChaincode.sh

echo "Deploying CC Ext..."
docker exec cli /bin/bash ./scripts/deployCCExt.sh 1 1
docker exec cli /bin/bash ./scripts/deployCCExt.sh 1 2

sleep 20
docker exec cli /bin/bash ./scripts/commitCCExt.sh 1 1

echo "Starting the api..."
./scripts/startApi.sh $1
