#!/bin/bash
NETWORK_NAME="carbonAccounting"
COMPOSE_VOLUME=$(pwd)
API_VOLUME=${COMPOSE_VOLUME//docker-compose-setup/application}

IMAGE=$(docker images api --format "{{.Repository}}")
if [ "$IMAGE" ]; then
    echo "Found api image. No need to build.";
else
    echo "Building api image"
    docker build -t api ../application
fi
echo "Using volumes for API container: "
echo
echo $COMPOSE_VOLUME
echo $API_VOLUME

docker run -it --rm --publish 9000:9000 --network=$NETWORK_NAME --name api -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=$NETWORK_NAME  -v $COMPOSE_VOLUME:/docker-compose-setup -v $API_VOLUME:/application -w /application api /bin/sh -c 'nodemon index.js'