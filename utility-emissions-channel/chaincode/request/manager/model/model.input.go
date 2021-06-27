package model

// model.input.go : input type definition of inputs to request manager chaincode

type StageUpdateInput struct {
	RequestId string `json:"requestId"`

	// Name : of the stage
	Name string `json:"name"`

	// StageState : state of the stage
	// is StageState == "FINISHED" && IsLast = true
	// request will be finished
	StageState string `json:"stageState"`

	// FabricDataLock : contains information about fabric data
	// which should be locked by request Manager cc
	// key of the map : chaincodeName on which data is found
	// value of the map : BeforeParmas : instruct reqCC to call mentioned chaincode with parameter
	FabricDataLocks map[string]RequestDataChaincodeInput `json:"fabricDataLocks"`

	// FabricDataFree : contains information about fabric data
	// which should be freed by request Manager cc
	// key of the map : chaincodeName on which data is found
	// value of the map : BeforeParmas : instruct reqCC to call mentioned chaincode with parameter
	FabricDataFree map[string]RequestDataChaincodeInput `json:"fabricDataFree"`

	// IsLast : is this stage a last one ?
	IsLast bool `json:"isLast"`

	// BlockchainData : data for which will be required by
	// upcoming stages
	BlockchainData []BlockchainData `json:"blockchainData"`

	CallerType RequestCallerType `json:"callerType"`
}

type RequestDataChaincodeInput struct {
	MethodName string             `json:"methodName"`
	Input      DataChaincodeInput `json:"input"`
}
