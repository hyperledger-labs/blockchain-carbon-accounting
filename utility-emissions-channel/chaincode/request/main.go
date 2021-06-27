// Package main
// for testing logic are separated
// from main package
package main

import (
	"fmt"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"os"
	"request/manager"
)

func main() {
	cc := new(manager.RequestManagerChaincode)
	cc.ConfigureChaincode()

	ccServer := shim.ChaincodeServer{
		CCID:    os.Getenv("CHAINCODE_ID"),
		Address: os.Getenv("CHAINCODE_ADDRESS"),
		CC:      cc,
		TLSProps: shim.TLSProperties{
			Disabled: true,
		},
	}
	fmt.Printf("starting chaincode server\n")
	fmt.Printf("CCID = %s\n", ccServer.CCID)
	fmt.Printf("Address = %s\n", ccServer.Address)
	if err := ccServer.Start(); err != nil {
		panic(err)
	}
}
