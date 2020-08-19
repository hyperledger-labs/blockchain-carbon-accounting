package main

import (
	"fmt"
	"bytes"
	"encoding/json"
	"time"
	"strconv"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/lib/cid"
	sc "github.com/hyperledger/fabric/protos/peer"
)

//represent SC
type SmartContract struct {
}

type UtilityEmissionFactors struct {
	year int 
	country string
	_division_id int
	division_name string
	next_generation string
	net_generation_uom int32 
	CO2_equivalent_Emission int32
	CO2_equivalent_Emission_UOM int16
	souce string
}

func main() {
	err:=shim.Start(new(SmartContract))
	if err!=nil{
		fmt.Printf("Error starting Utility Chaincode %s", err)
	}
}

//init function
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Respoinse{
	return shim.Success(nil)
}

// Invoke function
func (s *SmartContract) 


