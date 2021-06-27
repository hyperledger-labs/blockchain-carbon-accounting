# /bin/bash


CMD=$1

case $CMD in
    "lint")
        golangci-lint run
    ;;
    "test")
        go test ./manager/*.go
    ;;

    "cover")
    cd manager
    go test -coverprofile /tmp/cover.out
    go tool cover -html=/tmp/cover.out
    ;;
    "build")
        docker build . -t zzocker20/requestmanager-chaincode:0.0.1
    ;;
    *)
        echo "commend $CMD not supported"
    ;;
esac