echo "Starting orderers, peers, and couchdb..."
NETWORK_NAME="carbonAccounting"

docker-compose -f ./docker/nodes/node-two/docker-compose-couch.yaml -f ./docker/nodes/node-two/docker-compose-carbonAccounting.yaml up -d

docker network connect $NETWORK_NAME orderer1.auditor2.carbonAccounting.com
docker network connect $NETWORK_NAME peer1.auditor2.carbonAccounting.com
docker network connect $NETWORK_NAME couchdb1