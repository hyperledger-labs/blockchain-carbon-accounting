#!/bin/bash
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/application/docker-compose.yaml up -d

docker network connect $NETWORK_NAME api