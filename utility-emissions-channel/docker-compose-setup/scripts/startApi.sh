#!/bin/bash
# NETWORK_NAME="carbonAccounting"

# docker-compose -f ./docker/application/docker-compose.yaml up -d

# docker network connect $NETWORK_NAME api
# start vault server
docker run --name devVault -d --cap-add=IPC_LOCK -p 8200:8200 -e 'VAULT_DEV_ROOT_TOKEN_ID=tokenId' -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' vault
cd ../../utility-emissions-channel/typescript_app

if [ ! -d "node_modules" ];then
    npm i
fi

if [ ! -d "dist" ];then
    npm run build
fi
npm run start