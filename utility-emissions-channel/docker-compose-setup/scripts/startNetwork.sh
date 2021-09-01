#!/bin/bash
NETWORK_NAME="carbonAccounting"

EXISTS=$(docker network inspect $(docker network ls -q) | grep "carbonAccounting")
if [ -z "$EXISTS" ]; then
    # start docker network
    echo "Starting docker network with name $NETWORK_NAME"
    docker swarm init --advertise-addr 127.0.0.1
    docker network create --attachable --driver overlay $NETWORK_NAME
else
    echo "Network $NETWORK_NAME already exists, skipping creation..."
fi