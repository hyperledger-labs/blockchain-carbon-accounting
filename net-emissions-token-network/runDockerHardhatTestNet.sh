#!/bin/bash
VOLUME=$(pwd)
NETWORK_NAME="carbonAccounting"
IMAGE=$(docker images hardhat-test --format "{{.Repository}}")
if [ "$IMAGE" ]; then
    echo "Found hardhat-test image. No need to build.";
else
    echo "Building hardhat-test image"
    docker build -t hardhat-test .
fi
echo "Using volumes for hardhat-test container: "
echo
echo $VOLUME

docker run -it --rm -p 8545:8545 --name hardhat-test --network=$NETWORK_NAME -v $VOLUME:/net-emissions-token-network -w /net-emissions-token-network hardhat-test /bin/sh -c 'npx hardhat node --hostname 0.0.0.0'



