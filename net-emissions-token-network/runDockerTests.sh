#!/bin/bash
VOLUME=$(pwd)

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

docker run -it --rm --name hardhat-test -v $VOLUME:/net-emissions-token-network -w /net-emissions-token-network hardhat-test /bin/sh -c 'npx hardhat test'
