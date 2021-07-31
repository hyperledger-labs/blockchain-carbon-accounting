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
        docker run --rm --name vault -d --cap-add=IPC_LOCK -p 8200:8200 -e 'VAULT_DEV_ROOT_TOKEN_ID=tokenId' -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' vault
        docker run -d --rm --name locals3 --net host -p 4569:4569 zzocker20/local-s3
        cd ../../utility-emissions-channel/typescript_app

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
