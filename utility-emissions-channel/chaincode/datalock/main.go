package main

import (
	"datalock/internal"
	"datalock/pkg/logger"
	"os"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

func main() {
	level := os.Getenv("DATALOCK_LOG_LEVEL")
	if level == "" {
		level = "INFO"
	}
	logger.NewAppLogger(level)
	cc := new(internal.DataLockChaincode)

	logger.Infof("Starting chaincode server")
	if err := shim.Start(cc); err != nil {
		panic(err)
	}
}
