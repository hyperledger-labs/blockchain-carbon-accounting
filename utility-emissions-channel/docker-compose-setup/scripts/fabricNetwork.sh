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
