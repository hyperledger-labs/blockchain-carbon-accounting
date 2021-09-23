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

	server := shim.ChaincodeServer{
		CCID:    os.Getenv("DATALOCK_CC_ID"),
		Address: os.Getenv("DATALOCK_CC_ADDRESS"),
		CC:      cc,
		TLSProps: shim.TLSProperties{
			Disabled: true,
		},
	}
	logger.Infof("Starting chaincode server")
	logger.Infof("ADDRESS : %s", server.Address)
	logger.Infof("CC_ID : %s", server.CCID)
	if err := server.Start(); err != nil {
		panic(err)
	}
}
