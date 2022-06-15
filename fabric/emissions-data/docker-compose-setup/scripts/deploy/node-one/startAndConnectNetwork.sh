echo "Starting orderers, peers, and couchdb..."
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-one/docker-compose-couch.yaml -f ./docker/nodes/node-one/docker-compose-carbonAccounting.yaml up -d

docker network connect $NETWORK_NAME orderer1.auditor1.carbonAccounting.com
docker network connect $NETWORK_NAME peer1.auditor1.carbonAccounting.com
docker network connect $NETWORK_NAME couchdb0