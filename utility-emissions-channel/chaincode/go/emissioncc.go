// Emission Contract in Golang

package main

import (
	"fmt"
	"encoding/json"
	"strconv"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// Define the structure of Chaincode

type EmissionsContract struct {
}

/*Define structure of Carbon Accounting with 13 properties, these structures are used by encoding/json */

type Value struct {
	UtilityID      					string `json:"utilityID"`
	PartyID      					string `json:"partyID"`
	FromDate    					string `json:"fromDate"`
	ThruDate      					string `json:"thruDate"`
	EnergUseAmount 					string `json:"energyUseAmount"`
	EnergyUSeUom 					string `json:"energyUSeUom"`
	CO2equivalentemissions 				string `json:"cO2equivalentemissions"`
	NetGeneration				 	string `json:"netGeneration"`
	Usage				 		string `json:"usage"`
	UsageuOM				 	string `json:"usageuOM"`
	NetGenerationuOM				string `json:"netGenerationuOM"`
	CO2equivalentemissionsuOM			string `json:"eO2equivalentemissionsuOM"`
	EmissionsuOM				 	string `json:"emissionsuOM"`
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
	} else if function == "createEmissionRecord" {
		return s.createEmissionRecord(APIstub, args)
	} else if function == "compEmissionAmount"{
		return s.compEmissionAmount(APIstub, args)
	}
	return shim.Error("Invalid Chaincode function name.")
}

/* InitLegder */
func (s *EmissionsContract) initLedger(APIstub shim.ChaincodeStubInterface) pb.Response {
	values := []Value{
		Value{UtilityID: "Utility1", PartyID: "MyCOmpany1", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1650", EnergyUSeUom: "KWH", CO2equivalentemissions: "2528243",   NetGeneration: "5319362",   Usage: "3067",   UsageuOM: "4676",  NetGenerationuOM: "4676",  CO2equivalentemissionsuOM: "2514657",   EmissionsuOM: "11340"},
		Value{UtilityID: "Utility2", PartyID: "MyCOmpany2", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1750", EnergyUSeUom: "KWH", CO2equivalentemissions: "109280652", NetGeneration: "233461835", Usage: "32448",  UsageuOM: "19846", NetGenerationuOM: "19846", CO2equivalentemissionsuOM: "108778338", EmissionsuOM: "41584"},
		Value{UtilityID: "Utility3", PartyID: "MyCOmpany3", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", EnergyUSeUom: "KWH", CO2equivalentemissions: "7467070",   NetGeneration: "9553,749",   Usage: "3335",  UsageuOM: "9951",  NetGenerationuOM: "9951",  CO2equivalentemissionsuOM: "7412845",   EmissionsuOM: "22383"},
		Value{UtilityID: "Utility4", PartyID: "MyCOmpany4", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", EnergyUSeUom: "KWH", CO2equivalentemissions: "271139570", NetGeneration: "455122654", Usage: "254855", UsageuOM: "88461", NetGenerationuOM: "88461", CO2equivalentemissionsuOM: "269299999", EmissionsuOM: "19224"}, 
		Value{UtilityID: "Utility5", PartyID: "MyCOmpany5", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", EnergyUSeUom: "KWH", CO2equivalentemissions: "321014", 	  NetGeneration: "1167962",   Usage: "398",      UsageuOM: "3368",  NetGenerationuOM: "3368",  CO2equivalentemissionsuOM: "318764",     EmissionsuOM: "80027"},
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

func (s *EmissionsContract) createEmissionRecord(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 13 {
		return shim.Error("invalid number of arguments. Expect 13")
	}

	utilityID := args[0]

	var values = Value{UtilityID: args[0], PartyID: args[1], FromDate: args[2], ThruDate: args[3], EnergUseAmount: args[4], EnergyUSeUom: args[5], CO2equivalentemissions: args[6], NetGeneration: args[7], Usage: args[8], UsageuOM: args[9], NetGenerationuOM: args[10], CO2equivalentemissionsuOM: args[11], EmissionsuOM: args[12]}

	valuesAsBytes, _ := json.Marshal(values)
	APIstub.PutState(utilityID, valuesAsBytes)
	return shim.Success(nil)
}

/* Query a value of Utility*/

func (s *EmissionsContract) getEmissionRecord(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of argument. Expect 1")
	}

	valuesAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(valuesAsBytes)
}

/* Compute Emission Amount */ 

func (s *EmissionsContract) compEmissionAmount(APIstub shim.ChaincodeStubInterface, args []string) pb.Response{
	if len(args) !=1 {
		return shim.Error("Utility ID is required")
	}

	utilityID 		:= args[0]
	valuesAsBytes, _ 	:= APIstub.GetState(args[0])
	co2amount 		:= Value{}
	json.UnMarshal(valuesAsBytes, co2amount)

	cO2equivalentemissions 		  := args[6]
	netGeneration 		  	  := args[7]
	usage				  := args[8]
	usageuOM 			  := args[9]
	netGenerationuOM 	 	  := args[10]
	cO2equivalentemissionsuOM	  := args[11]
	emissionsuOM 			  := args[12]

	var emissionAmount = ((cO2equivalentemissions/netGeneration)*usage*(usageuOM/netGenerationuOM)*(cO2equivalentemissionsuOM/emissionsuOM))

	return emissionAmount
}

/* main function */

func main() {
	err := shim.Start(new(EmissionsContract))
	if err != nil {
		fmt.Printf("Error to start new SC", err)
	}
}

