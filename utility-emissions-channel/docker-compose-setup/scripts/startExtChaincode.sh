#!/bin/bash
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-one/docker-compose-chaincode.yaml -f ./docker/nodes/node-two/docker-compose-chaincode.yaml up -d
docker network connect $NETWORK_NAME chaincode_utilityemissions1
docker network connect $NETWORK_NAME chaincode_utilityemissions2
