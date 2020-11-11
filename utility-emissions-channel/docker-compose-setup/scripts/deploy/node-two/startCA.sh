#!/bin/bash
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-two/docker-compose-ca.yaml up -d
docker network connect $NETWORK_NAME auditor2.carbonAccounting.com