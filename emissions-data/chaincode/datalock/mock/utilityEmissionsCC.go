package mock

import (
	"datalock/model"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
)

// Package EmissionsCC : a dummy chaincode for testing
// same kind of business logic as record audited Emissions

type MockEmissionsCC struct{}

func (MockEmissionsCC) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

func (MockEmissionsCC) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	methodName, args := stub.GetFunctionAndParameters()
	method, ok := methods[methodName]
	if !ok {
		return shim.Error("method not supported")
	}
	return method(stub, args)
}

var methods = map[string]func(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	"getValidEmissions":        getValidEmissions,
	"UpdateEmissionsWithToken": UpdateEmissionsWithToken,
	"method-invalid-response":  methodInvalidResponse,
}

type Emissions struct {
	UUID    string
	PartyId string
	TokenId string
}

func methodInvalidResponse(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	return shim.Success([]byte("invalid response"))
}

func getValidEmissions(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	validEmissions := make([]Emissions, 0)
	for _, uuid := range args {
		// get emissions record
		raw, err := stub.GetState(uuid)
		if err != nil {
			return shim.Error(err.Error())
		}
		if len(raw) == 0 {
			// record doesn't exists
			return shim.Error(fmt.Sprintf("emissions record with uuid = %s not found", uuid))
		}
		var emissions Emissions
		json.Unmarshal(raw, &emissions)
		if len(emissions.TokenId) != 0 {
			// token already minted
			continue
		}
		validEmissions = append(validEmissions, emissions)
	}
	output, _ := json.Marshal(validEmissions)
	// return shim.Success(output)

	// <<<<< extra
	uuidToLock := make([]string, len(validEmissions))
	for i, em := range validEmissions {
		uuidToLock[i] = em.UUID
	}
	validUUIdsRaw, _ := json.Marshal(uuidToLock)
	out := model.DataChaincodeOutput{
		Keys:           uuidToLock,
		OutputToClient: base64.StdEncoding.EncodeToString(output),
		OutputToStore: map[string]string{
			"validUUIDs": base64.StdEncoding.EncodeToString(validUUIdsRaw),
		},
	}
	outRaw, _ := json.Marshal(out)
	return shim.Success(outRaw)
	// >>>>>
}

func UpdateEmissionsWithToken(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 3 {
		return shim.Error(fmt.Sprintf("require at least three argument, but provided %d", len(args)))
	}

	tokenId := args[0]
	partyid := args[1]
	uuids := args[2:]
	for _, uuid := range uuids {
		raw, err := stub.GetState(uuid)
		if err != nil {
			return shim.Error(err.Error())
		}
		if len(raw) == 0 {
			return shim.Error(fmt.Sprintf("%s emissions not found", uuid))
		}
		var emissions Emissions
		json.Unmarshal(raw, &emissions)
		emissions.PartyId = partyid
		emissions.TokenId = tokenId
		raw, _ = json.Marshal(emissions)
		err = stub.PutState(uuid, raw)
		if err != nil {
			return shim.Error(err.Error())
		}
	}
	// return shim.Success(nil)
	// <<<<< extra
	out := model.DataChaincodeOutput{
		Keys:           uuids,
		OutputToClient: "",
		OutputToStore:  nil,
	}
	outRaw, _ := json.Marshal(out)
	return shim.Success(outRaw)
}
