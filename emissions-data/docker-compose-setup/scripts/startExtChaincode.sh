#!/bin/bash
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-one/docker-compose-chaincode.yaml -f ./docker/nodes/node-two/docker-compose-chaincode.yaml up -d
docker network connect $NETWORK_NAME chaincode-emissions1.carbonAccounting.com
docker network connect $NETWORK_NAME chaincode-emissions2.carbonAccounting.com
docker network connect $NETWORK_NAME chaincode-datalock1.carbonAccounting.com
docker network connect $NETWORK_NAME chaincode-datalock2.carbonAccounting.com