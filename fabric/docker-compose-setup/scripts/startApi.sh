#!/bin/bash

# start vault server
# vault development mode, to use a producation ready vault server
# https://learn.hashicorp.com/tutorials/vault/getting-started-deploy?in=vault/getting-started
# start the api in two different mode
# 1. local mode, for local development and testing
# 2. docker mode, for running the api in a docker container

MODE=${1:-local}

case $MODE in
  local)
        docker-compose -f ./docker/application/docker-compose.yaml up -d vault locals3
        docker run --rm --name ws-identity -d --cap-add=IPC_LOCK -p 8700:8700 ghcr.io/brioux/ws-identity
        cd ../typescript_app
        ./cp-blockchain-gateway-lib.sh

        if [ ! -d "node_modules" ];then
            npm i
        fi

        if [ ! -d "dist" ];then
            npm run build
        fi
        npm run start
  ;;

  docker)
        NETWORK_NAME="carbonAccounting"

        docker-compose -f ./docker/application/docker-compose.yaml up -d

        docker network connect $NETWORK_NAME api
  ;;
  *)
        echo "Usage: $0 {local|docker}"
  ;;
esac
