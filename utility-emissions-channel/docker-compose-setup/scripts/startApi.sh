#!/bin/bash
NETWORK_NAME="carbonAccounting"
COMPOSE_VOLUME=$(pwd)
API_VOLUME=${COMPOSE_VOLUME//docker-compose-setup/typescript_app}
CHAINCODE_VOLUME=${COMPOSE_VOLUME//docker-compose-setup/chaincode}

IMAGE=$(docker images api --format "{{.Repository}}")
if [ "$IMAGE" ]; then
    echo "Found api image. No need to build.";
else
    echo "Building api image"
    docker build -t api ../typescript_app
fi
echo "Using volumes for API container: "
echo
echo $COMPOSE_VOLUME
echo $API_VOLUME

docker run -it --rm --publish 9000:9000 --publish 4569:4569 --network=$NETWORK_NAME --name api -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=$NETWORK_NAME -v $CHAINCODE_VOLUME:/chaincode -v $COMPOSE_VOLUME:/docker-compose-setup -v $API_VOLUME:/typescript_app -w /typescript_app api /bin/sh -c 'npm install && sh start.sh'
