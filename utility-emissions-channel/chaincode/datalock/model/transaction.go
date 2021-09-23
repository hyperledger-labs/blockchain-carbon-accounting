package model

// Transaction : a multi blockchain tx
type Transaction struct {
	TxID         string                  `json:"tx_id"`
	State        TxState                 `json:"state"`
	CurrentStage string                  `json:"current_stage"`
	StageData    map[string]*TxStageData `json:"stage_data"`
}

type TxState string

const (
	TxStateFINISHED      TxState = "FINISHED"
	TxStatePROCESSING    TxState = "PROCESSING"
	TxStateNOTPROCESSING TxState = "NOT-PROCESSING"
)

type TxStageData struct {
	// keep track of data generated
	// during the executing of the transition
	Storage map[string]string `json:"storage"`

	// Output : genereate from data chaincode
	// which are required for further stages
	Output map[string]map[string]string `json:"output"`
}
