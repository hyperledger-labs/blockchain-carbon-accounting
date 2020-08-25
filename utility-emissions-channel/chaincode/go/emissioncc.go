// Emission Contract in Golang

package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// Define the structure of Chaincode

type EmissionsContract struct {
}

/*Define structure of Carbon Accounting with 6 properties, these structures are used by encoding/json */

type Value struct {
	UtilityID      string `json:"utilityID"`
	PartyID        string `json:"partyID"`
	FromDate       string `json:"fromDate"`
	ThruDate       string `json:"thruDate"`
	EnergUseAmount string `json:"energyUseAmount"`
	energyUSeUom   string `json:"utilityID"`
}

/* The Init Method is called when the chaincode is instiated by the BC */
func (s *EmissionsContract) Init(APIstub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

/* Invoke Function */

func (s *EmissionsContract) Invoke(APIstub shim.ChaincodeStubInterface) pb.Response {

	// Retrieve the requested chaincode function and args

	function, args := APIstub.GetFunctionAndParameters()

	// Requests
	if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "getEmissionRecord" {
		return s.getEmissionRecord(APIstub, args)
	} else if function == "createUtilityID" {
		return s.createUtilityID(APIstub, args)
	}
	return shim.Error("Invalid Chaincode function name.")
}

/* InitLegder */
func (s *EmissionsContract) initLedger(APIstub shim.ChaincodeStubInterface) pb.Response {
	values := []Value{
		Value{UtilityID: "Utility1", PartyID: "MyCOmpany1", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1650", energyUSeUom: "KWH"},
		Value{UtilityID: "Utility2", PartyID: "MyCOmpany2", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1750", energyUSeUom: "KWH"},
		Value{UtilityID: "Utility3", PartyID: "MyCOmpany3", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", energyUSeUom: "KWH"},
	}
	i := 0
	for i < len(values) {
		fmt.Println("i is ", i)
		valuesAsBytes, _ := json.Marshal(values[i])
		APIstub.PutState("Utility"+strconv.Itoa(i), valuesAsBytes)
		fmt.Println("Added", values[i])
		i = i + 1
	}
	return shim.Success(nil)
}

/* Create an new entry UtilityID  */

func (s *EmissionsContract) createUtilityID(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 6 {
		return shim.Error("invalid number of arguments. Expect 6")
	}

	utilityID := args[0]
	var values = Value{UtilityID: args[0], PartyID: args[1], FromDate: args[2], ThruDate: args[3], EnergUseAmount: args[4], energyUSeUom: args[5]}

	valuesAsBytes, _ := json.Marshal(values)
	stub.PutState(utilityID, valuesAsBytes)
	return shim.Success(nil)
}

/* Query a value of Utility*/

func (s *EmissionsContract) getEmissionRecord(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of argument. Expect 1")
	}
	valuesAsBytes, _ := stub.GetState(args[0])
	return shim.Success(valuesAsBytes)
}

/* main function */

func main() {
	err := shim.Start(new(EmissionsContract))
	if err != nil {
		fmt.Printf("Error to start new SC", err)
	}
}


/* 

func (s *ServntireDemoChaincode) gethistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	carKey := args[1]
	fmt.Printf("##### start History of Record: %s\n", carKey)

	resultsIterator, err := stub.GetHistoryForKey(carKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistoryForMarble returning:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

*/
