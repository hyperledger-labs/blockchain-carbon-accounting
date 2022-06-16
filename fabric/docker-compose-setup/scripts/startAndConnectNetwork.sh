#!/bin/bash
NETWORK_NAME="carbonAccounting"

# Start both nodes for development
docker-compose -f ./docker/nodes/node-one/docker-compose-couch.yaml -f ./docker/nodes/node-one/docker-compose-carbonAccounting.yaml -f ./docker/nodes/node-two/docker-compose-couch.yaml -f ./docker/nodes/node-two/docker-compose-carbonAccounting.yaml up -d

docker network inspect $NETWORK_NAME | grep --silent '"orderer1.auditor1.carbonAccounting.com"' || docker network connect $NETWORK_NAME orderer1.auditor1.carbonAccounting.com
docker network inspect $NETWORK_NAME | grep --silent '"peer1.auditor1.carbonAccounting.com"' || docker network connect $NETWORK_NAME peer1.auditor1.carbonAccounting.com
docker network inspect $NETWORK_NAME | grep --silent '"couchdb0"' || docker network connect $NETWORK_NAME couchdb0

docker network inspect $NETWORK_NAME | grep --silent '"orderer1.auditor2.carbonAccounting.com"' || docker network connect $NETWORK_NAME orderer1.auditor2.carbonAccounting.com
docker network inspect $NETWORK_NAME | grep --silent '"peer1.auditor2.carbonAccounting.com"' || docker network connect $NETWORK_NAME peer1.auditor2.carbonAccounting.com
docker network inspect $NETWORK_NAME | grep --silent '"couchdb1"' || docker network connect $NETWORK_NAME couchdb1
