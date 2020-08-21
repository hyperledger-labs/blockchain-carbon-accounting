package main

import (
	"fmt"
	"bytes"
	"encoding/json"
	"strconv"
	"time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

// Chain code

type EmissionContract struct {

}

//values 

type Value struct {
	UtilityID  			string `json:"utilityID"`
	PartyID    			string `json:"partyID"`
	FromDate   			string `json:"fromDate"`
	ThruDate   			string `json:"thruDate"`
	EnergUseAmount		string `json:"energyUseAmount"`
	energyUSeUom 		string `json:"utilityID"`
}

//main function 

func main() {
	err:= shim.Start(new(EmissionContract))
	if err != nil {
		fmt.Printl("Error to start new SC". err)
	}
}


// InitLedger() 
func (s *EmissionContract) InitLedger(stub shim.ChaincodeStubInterface) peer.Response {
	values := []Value{
		Value{UtilityID: "BigUtility", PartyID: "MyCOmpany1", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount:"1650", energyUSeUom:"KWH"},
		Value{UtilityID: "SmallUtility", PartyID: "MyCOmpany2", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount:"1750", energyUSeUom:"KWH"},
		Value{UtilityID: "MediumUtility", PartyID: "MyCOmpany3", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount:"1550", energyUSeUom:"KWH"},		
	}
	i :=0
	for i < len(values){
		fmt.Println("i is ", i)
		valuesAsBytes, _ := json.Marshal(values[i])
		stub.PutState(values[i].UtilityID, valuesAsBytes)
		fmt.Println("Added", values[i])
		i=i+1
	}
	return shim.Success(nil)
}

func (s *EmissionContract) queryValue(stub shim.ChaincodeStubInterface, arg []string) peer.Response{
	if len(args) !=1{
		return shim.Error("Incorrect number of argument. Expect 1")
	}
	valuesAsBytes, _ := stub.GetState(args[0])
	return shim.Success(valuesAsBytes)
}

func (s *EmissionContract) registrationUtility(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	if len(args) !=1 {
		return shim.Error("invalid number of arguments")
	}
	utilityID :=args[0]
	values := Value{utilityID: args[0], PartyID: " ", FromDate: " ", ThruDate: " ", EnergUseAmount: " ", energyUSeUo: " " }
	valuesAsBytes, _ := json.Marshal(value)
	stub.PutState(utilityID, valuesAsBytes)
	return shim.Success(nil)
}


func (s *EmissionContract) addValue(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	//update ledger with new utility, etc. 
	if len(args) != 6 {
		return shim.Error(" Invalid number o argument")
	}
	utilityID := args[0] 
	partyID := args[1]
	fromDate := args[2]
	thruDate := args[3]
	energyUseAmount := args[4]
	energyUSeUo := args[5]

	//Fetch State from ledger
	valuesAsBytes, _ := stub.GetState(utilityID)
	value := Value{}
	json.Unmarshal(valuesAsBytes, &value)
	fmt.Println(value)


	// Check if the parameters is set in request, if not, use fetched value
	
	//Always update the timestamp
	value.Time = time

	fmt.Println(value)

	// pack and store updated values
	valuesByBytes, _ :=json.Marshal(value)
	stub.PutState(utilityID, valueByBytes)

	return shim.Success(nil)
}

func (s *EmissionContract) getRecord(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	if len(args) !=1 {
		return shim.Error("Invalid number of arguments")
	}
	utilityID := args[0]

	iterator, err :=stub.GetHistoryForKey(utilityID)
	if err!=nil {
		return shim.Error(err.Error())
	}
	iterator.Close()


	//buffer is a Json array containing queryresults
	var buffer bytes.Buffer
	buffer.WriteString("[")
	bArrayMemberAlreadyWritten := false
	for iterator.HasNext() {
		queryResponse, err := iterator.Next()
		if err != nil {
			shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		if queryResponse.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(queryResponse.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(queryResponse.Timestamp.Seconds, int64(queryResponse.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(queryResponse.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("getHistory:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}