package model

// modeles.cc.go : defines all inputs/output received/returned by fabric data chaincode
// from/to request Manager chaincode

// DataChaincodeOutput : output sent by data chaincode to request manager
// aftere executing method before locking and free locks on request Manager
type DataChaincodeOutput struct {
	// Keys : list of keys that need to locked or unlocked
	// request manager chaincode
	Keys []string `json:"keys"`

	// OutputToClient : a base64 string of JSON.marshal
	OutputToClient string `json:"outputToClient"`

	// a base64 string of JSON.marshal
	OutputToStore map[string]string `json:"outputToStore"`
}

// DataChaincodeLockInput : input send to data chaincode
// before locking the key on request manager
// invokeChaincode(args),
// args[0] : method to call
// args[1] : json.Marshal(DataChaincodeLockInput)
type DataChaincodeInput struct {
	// Keys : which need to checked before locking
	Keys []string `json:"keys"`

	// Parmas : chaincode logic specific
	// a base64 string of JSON.marshal
	Params string `json:"params"`
}
