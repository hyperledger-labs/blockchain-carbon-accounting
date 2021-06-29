#!/bin/bash
# NETWORK_NAME="carbonAccounting"

# docker-compose -f ./docker/application/docker-compose.yaml up -d

# docker network connect $NETWORK_NAME api
cd ../../utility-emissions-channel/typescript_app

if [ ! -d "node_modules" ];then
    npm i
fi

if [ ! -d "dist" ];then
    npm run build
fi
npm run start