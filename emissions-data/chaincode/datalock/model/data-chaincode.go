package model

type DataChaincodeOutput struct {
	// Keys : to be locked/unlocked on
	// data chaincode
	Keys []string `json:"keys"`
	// OutputToClient : base64 encoded generated after
	// calling data chaincode, this need to directly sent to the client
	OutputToClient string `json:"output_to_client"`
	// OutputToStore : key,value (base64) generated after
	// calling data chaincode, this will be stored with tx
	// for further stages
	OutputToStore map[string]string `json:"output_to_store"`
}

type DataChaincodeInput struct {
	// Keys : to be locked/unlocked on
	// data chaincode
	Keys []string `json:"keys"`

	// Params : method and chaincode specific
	// list of argument.
	Params []string `json:"params"`
}
