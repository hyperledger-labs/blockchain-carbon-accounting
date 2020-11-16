#!/bin/bash
NETWORK_NAME=net_carbonAccounting
echo "Starting local dynamodb..."

if [ "$( docker container inspect -f '{{.State.Status}}' localdynamodb )" == "exited" ]; then
    docker start localdynamodb
else
    echo "Could not find localdynamodb, creating a new container..."
    docker run --detach -p 8000:8000 --name localdynamodb --network=$NETWORK_NAME amazon/dynamodb-local
fi