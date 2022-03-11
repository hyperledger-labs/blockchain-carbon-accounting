package model

type StageUpdateInput struct {
	// TxID : ID of transition
	TxID string `json:"tx_id"`
	// Name : of the stage
	Name string `json:"name"`

	// DataLocks : input for locking data
	DataLocks map[string]DataChaincodeInput `json:"data_locks"`
	// DataFree : input for unlocking data
	DataFree map[string]DataChaincodeInput `json:"data_free"`

	// IsLast : true, if the stage is last and false otherwise
	IsLast bool `json:"is_last"`
	// Storage : data to be stored for tx
	// to use in further stages
	Storage map[string]string `json:"storage"`
}

type StageUpdateOutput struct {
	// DataLocks : key (ccName),value(key => base64) returned by
	// data chancode after calling before locking data
	DataLocks map[string]string `json:"data_locks"`

	// DataFree : key (ccName),value(key => base64) returned by
	// data chancode after calling before unlocking data
	DataFree map[string]string `json:"data_free"`
}
