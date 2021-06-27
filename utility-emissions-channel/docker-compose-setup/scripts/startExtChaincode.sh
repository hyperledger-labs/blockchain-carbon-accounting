#!/bin/bash
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-one/docker-compose-chaincode.yaml -f ./docker/nodes/node-two/docker-compose-chaincode.yaml up -d
docker network connect $NETWORK_NAME chaincode-utilityemissions1.carbonAccounting.com
docker network connect $NETWORK_NAME chaincode-utilityemissions2.carbonAccounting.com
docker network connect $NETWORK_NAME chaincode-requestmanager1.carbonAccounting.com
docker network connect $NETWORK_NAME chaincode-requestmanager2.carbonAccounting.com
