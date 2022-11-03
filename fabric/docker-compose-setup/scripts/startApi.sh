#!/bin/bash

# start vault, ws-idenity, api-server, and oracle server,
# vault development mode, to use a producation ready vault server
# https://learn.hashicorp.com/tutorials/vault/getting-started-deploy?in=vault/getting-started
# start the api in two different mode
# 1. local mode, for local development and testing
# 2. docker mode, for running the api in a docker container

MODE=${1:-local}

NETWORK_NAME="carbonAccounting"
case $MODE in
  local)

        docker-compose -f ./docker/application/docker-compose.yaml up -d vault locals3 ws-identity oracle api-server
        docker network connect $NETWORK_NAME oracle

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
        docker-compose -f ./docker/application/docker-compose.yaml up -d

        docker network connect $NETWORK_NAME api
  ;;
  *)
        echo "Usage: $0 {local|docker} {[<db_host>]}"
  ;;
esac
