// Emission Contract in Golang

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

/* Define the structure of Chaincode */

type EmissionsContract struct {}

// this is the input for emissions calculation
type EmissionsCalcInput struct {
	UtilityID                 string `json:"utilityID"`
	PartyID                   string `json:"partyID"`
	FromDate                  string `json:"fromDate"`
	ThruDate                  string `json:"thruDate"`
	EnergUseAmount            string `json:"energyUseAmount"`
	EnergyUseUom              string `json:"energyUseUom"`
}

// this is seed data for emissions factors used to calculate emissions based on audited utility data
type UtilityEmissionsFactors struct {
	UtilityID                 string `json:"utilityID"`
	UtilityName               string `json:"utilitName"`
	Year                      string `json:"year"`
	Country                   string `json:"country"`
	DivisionType              string `json:"divisionType"`
	DivisionId                string `json:"divisionId"`
	DivisionName              string `json:"divisionName"`
	NetGeneration             float32 `json:"netGeneration"`
	NetGenerationUOM          string `json:"netGenerationUOM"`
	CO2EquivalentEmissions    float32 `json:"CO2EquivalentEmissions"`
	EmissionsUOM              string `json:"emissionsUOM"`
}


/* Compute Emission Amount */

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
	} else if function == "compEmissionAmount" {
		return s.compEmissionAmount(APIstub, args)
	} else if function == "getHistory" {
		return s.getHistory(APIstub, args)
	}

	return shim.Error("Invalid Chaincode function name.")
}

/* InitLegder */
func (s *EmissionsContract) initLedger(APIstub shim.ChaincodeStubInterface) pb.Response {

// initial values - we assume there is some other service which got us this emission factor reading
// UtilityEmissionsFactors{UtilityID: "14328", Name: "Pacific Gas & Electric Co.", Year: "2018", Country: "USA",  DivisionType: "NERC", DivisionId: "WECC", DivisionName: "Western Electricity Coordinating Council", NetGeneration: 743291275, NetGenerationUOM: "MWH", CO2EquivalentEmissions: 288,021,204, EmissionsUOM: "TONS"

	values := []Value{
		Value{UtilityID: "Utility1", PartyID: "MyCOmpany1", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1650", EnergyUSeUom: "KWH", CO2equivalentemissions: "2543", NetGeneration: "5362", Usage: "3067", UsageuOM: "4676", NetGenerationuOM: "4676", CO2equivalentemissionsuOM: "257", EmissionsuOM: "140"},
		Value{UtilityID: "Utility2", PartyID: "MyCOmpany2", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1750", EnergyUSeUom: "KWH", CO2equivalentemissions: "1062", NetGeneration: "235", Usage: "328", UsageuOM: "1846", NetGenerationuOM: "1946", CO2equivalentemissionsuOM: "1338", EmissionsuOM: "484"},
		Value{UtilityID: "Utility3", PartyID: "MyCOmpany3", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", EnergyUSeUom: "KWH", CO2equivalentemissions: "7470", NetGeneration: "9549", Usage: "3335", UsageuOM: "9951", NetGenerationuOM: "951", CO2equivalentemissionsuOM: "7445", EmissionsuOM: "383"},
		Value{UtilityID: "Utility4", PartyID: "MyCOmpany4", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", EnergyUSeUom: "KWH", CO2equivalentemissions: "2770", NetGeneration: "4554", Usage: "2855", UsageuOM: "8861", NetGenerationuOM: "881", CO2equivalentemissionsuOM: "2699", EmissionsuOM: "124"},
		Value{UtilityID: "Utility5", PartyID: "MyCOmpany5", FromDate: "2020-01-02", ThruDate: "2020-20-01", EnergUseAmount: "1550", EnergyUSeUom: "KWH", CO2equivalentemissions: "3014", NetGeneration: "1162", Usage: "398", UsageuOM: "3368", NetGenerationuOM: "3368", CO2equivalentemissionsuOM: "318764", EmissionsuOM: "827"},
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

/* Query a Value of Utility*/

func (s *EmissionsContract) getEmissionRecord(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of argument. Expect 1")
	}

	valuesAsBytes, _ := APIstub.GetState(args[0])

	return shim.Success(valuesAsBytes)
}

func (s *EmissionsContract) compEmissionAmount(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("In correct number of argument. Expect 1")
	}

	valuesAsBytes, _ := APIstub.GetState(args[0])

	record := Value{}
	json.Unmarshal(valuesAsBytes, &record)

	cO2equivalentemissions := record.CO2equivalentemissions
	netGeneration := record.NetGeneration
	usage := record.Usage
	usageuOM := record.UsageuOM
	netGenerationuOM := record.NetGenerationuOM
	cO2equivalentemissionsuOM := record.CO2equivalentemissionsuOM
	emissionsuOM := record.EmissionsuOM

	v1AsInt, _ := strconv.Atoi(cO2equivalentemissions)
	v2AsInt, _ := strconv.Atoi(netGeneration)
	v3AsInt, _ := strconv.Atoi(usage)
	v4AsInt, _ := strconv.Atoi(usageuOM)
	v5AsInt, _ := strconv.Atoi(netGenerationuOM)
	v6AsInt, _ := strconv.Atoi(cO2equivalentemissionsuOM)
	v7AsInt, _ := strconv.Atoi(emissionsuOM)

// use UtilityEmissionsFactors for the UtilityID
// convertValues function should take value, fromUom, toUom, and return value converted from fromUom to toUom.  
// it could be implemented as a Map [fromUom][toUom] = conversionFactor
// For example, in this case we're converting energyUseUom in KWH to MWH so the conversion factor is 0.001
// amount := convertValues(EmissionsCalcInput.EnergyUseAmount, EmissionsCalcInput.EnergyUseUom, UtilityEmissionsFactors.NetGenerationUOM) / UtilityEmissionsFactors.NetGeneration * UtilityEmissionsFactors.CO2EquivalentEmissions

	amount := v1AsInt / v2AsInt * v3AsInt * v4AsInt / v5AsInt * v6AsInt / v7AsInt

	result := strconv.Itoa(amount) // convert int to string

	mystringasBytes := []byte(result) // convert string to []byte

	return shim.Success(mystringasBytes)
}

func (s *EmissionsContract) getHistory(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("invalid number of arguments")
	}
	utilityID := args[0]

	iterator, err := APIstub.GetHistoryForKey(utilityID)
	if err != nil {
		return shim.Error(err.Error())
	}

	iterator.Close()

	// buffer is a JSON array containing QueryResults
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

/* main function */

func main() {
	err := shim.Start(new(EmissionsContract))
	if err != nil {
		fmt.Printf("Error to start new SC", err)
	}
}
