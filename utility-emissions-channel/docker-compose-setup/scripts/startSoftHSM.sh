NETWORK_NAME="carbonAccounting"
COMPOSE_VOLUME=$(pwd)

IMAGE=$(docker images softhsm2:2.6.1 --format "{{.Repository}}")
if [ "$IMAGE" ]; then
    echo "Found softhsm2:2.6.1 image. No need to build.";
else
    echo "Building softhsm2:2.6.1 image"
    docker build -t softhsm2:2.6.1 ../softhsm
fi

docker run -ti --rm --network=$NETWORK_NAME --name softhsm2 -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=$NETWORK_NAME -v $COMPOSE_VOLUME:/docker-compose-setup softhsm2:2.6.1 sh -l
