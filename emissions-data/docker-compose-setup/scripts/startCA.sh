#!/bin/bash
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-one/docker-compose-ca.yaml -f ./docker/nodes/node-two/docker-compose-ca.yaml up -d
docker network inspect $NETWORK_NAME | grep --silent '"auditor1.carbonAccounting.com"' || docker network connect $NETWORK_NAME auditor1.carbonAccounting.com
docker network inspect $NETWORK_NAME | grep --silent '"auditor2.carbonAccounting.com"' || docker network connect $NETWORK_NAME auditor2.carbonAccounting.com


# Production settings

# docker-compose -f ./docker/nodes/node-one/docker-compose-ca.yaml up -d
# docker network connect $NETWORK_NAME auditor1.carbonAccounting.com

# docker-compose -f ./docker/nodes/node-two/docker-compose-ca.yaml up -d
# docker network connect $NETWORK_NAME auditor2.carbonAccounting.com
