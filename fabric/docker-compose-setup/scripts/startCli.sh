#!/bin/bash
NETWORK_NAME="carbonAccounting"
COMPOSE_VOLUME=$(pwd)
CHAIN_CODE_VOLUME=${COMPOSE_VOLUME//docker-compose-setup/chaincode}

echo "Using volumes for Cli container: "
echo
echo $COMPOSE_VOLUME
echo $CHAIN_CODE_VOLUME

# docker run -it --detach --network=$NETWORK_NAME --name cli -e GOPATH=/opt/gopath -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_TLS_ENABLED=false -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e FABRIC_LOGGING_SPEC=DEBUG -e CORE_PEER_ID=cli -e CORE_PEER_ADDRESS=peer1.auditor1.carbonAccounting.com:7051 -e CORE_PEER_NETWORKID=cli -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=$NETWORK_NAME  -v $COMPOSE_VOLUME:/docker-compose-setup -v $CHAIN_CODE_VOLUME:/chaincode -w /docker-compose-setup ubuntu:18.04 /bin/bash -c 'sleep infinity'
docker run -it --rm --detach --network=$NETWORK_NAME --name cli \
    --link orderer1.auditor1.carbonAccounting.com:orderer1.auditor1.carbonAccounting.com \
    --link peer1.auditor1.carbonAccounting.com:peer1.auditor1.carbonAccounting.com \
    --link peer1.auditor2.carbonAccounting.com:peer1.auditor2.carbonAccounting.com \
    -p 12051:7051 -p 12052:7052 -p 12053:8051 -p 12054:8052 \
    -e GOPATH=/opt/gopath -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_TLS_ENABLED=true \
    -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e FABRIC_LOGGING_SPEC=DEBUG \
    -e CORE_PEER_ID=cli -e CORE_PEER_ADDRESS=peer1.auditor1.carbonAccounting.com:7051 \
    -e CORE_PEER_NETWORKID=cli \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
    -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=$NETWORK_NAME  \
    -v $COMPOSE_VOLUME:/docker-compose-setup \
    -v $CHAIN_CODE_VOLUME:/chaincode \
    -w /docker-compose-setup golang-node /bin/bash -c 'sleep infinity'

#    --add-host=host.docker.internal:host-gateway \
