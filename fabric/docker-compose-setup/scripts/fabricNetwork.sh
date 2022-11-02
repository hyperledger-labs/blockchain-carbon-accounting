# /bin/bash
# script for stoping and restarting fabric network
# helpful in development

CMD=$1
DOCKERE_CMD=stop
case $CMD in
    "stop")
        DOCKERE_CMD=stop
        docker stop cli
    ;;
    "resume")
        DOCKERE_CMD=restart
        ./scripts/startCli.sh
    ;;
    "reset")
        DOCKERE_CMD="down --volumes --remove-orphans"

        # remove channel artifacts
        rm -r channel-artifacts
        # remove txt files
        rm -r chaincode1_log.txt chaincode2_log.txt log.txt
        # remove crypto files
        rm -r organizations/peerOrganizations
        cd organizations/fabric-ca
        cd auditor1
        rm -r msp ca-cert.pem fabric-ca-server.db IssuerPublicKey IssuerRevocationPublicKey tls-cert.pem
        cd ../auditor2
        rm -r msp ca-cert.pem fabric-ca-server.db IssuerPublicKey IssuerRevocationPublicKey tls-cert.pem
        cd ../../..

        # clean containers
        if [ "$(docker ps -q -f name=api)" ]; then
            docker rm -f api
        fi

        if [ "$(docker ps -q -f name=vault)" ]; then
            docker rm -f vault
        fi

        if [ "$(docker ps -q -f name=locals3)" ]; then
            docker rm -f locals3
        fi

        if [ "$(docker ps -q -f name=cli)" ]; then
            docker rm -f cli
        fi

        if [ "$(docker ps -q -f name=ws-identity)" ]; then
            docker rm -f ws-identity
        fi

        if [ "$(docker ps -q -f name=oracle)" ]; then
            docker rm -f oracle
        fi
        
        if [ "$(docker ps -q -f name=api-server)" ]; then
            docker rm -f api-server
        fi

        if [ "$(docker ps -q -f name=postgres)" ]; then
            docker rm -f postgres
        fi
    ;;

    *)
        echo "command $CMD not supported"
        exit 1
    ;;
esac

docker-compose \
    -f ./docker/nodes/node-one/docker-compose-ca.yaml \
    -f ./docker/nodes/node-two/docker-compose-ca.yaml \
    -f ./docker/nodes/node-one/docker-compose-couch.yaml \
    -f ./docker/nodes/node-one/docker-compose-carbonAccounting.yaml \
    -f ./docker/nodes/node-two/docker-compose-couch.yaml \
    -f ./docker/nodes/node-two/docker-compose-carbonAccounting.yaml \
    -f ./docker/nodes/node-one/docker-compose-chaincode.yaml \
    -f ./docker/nodes/node-two/docker-compose-chaincode.yaml \
    $DOCKERE_CMD
