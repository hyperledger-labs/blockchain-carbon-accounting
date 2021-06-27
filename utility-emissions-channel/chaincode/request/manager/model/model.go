// Package model : contains type definitions for
// storing data on request manager chaincode worldstate
// input/output to/from request Manager
// input/output to/from data chaincode
package model

// Request : Definition for storing request onto the fabric
type Request struct {
	// ID : Ideinfier of a request
	// used to resolving request from fabric
	ID string `json:"id"`

	// RequestState : overall state of a request
	// can be any one
	// 1. PROCESSING
	// 2. FINISHED
	State RequestState `json:"state"`

	// CurrentStageName : name of currently executing stage
	CurrentStageName string `json:"currentStageName"`

	// CurrentStageState : state of currently executing stage
	// 1. PROCESSING
	// 2. FINISHED
	// 3... also business specific state
	CurrentStageState string `json:"currentStageState"`

	CallerType RequestCallerType `json:"callerType"`
	// CallerID : id of user (from certificate) executing this request
	// CallerId = fmt.Sprintf("%s_%s",mspId,userCommonName) || msp
	// CallerId = msp , means anyone one from the organization can resume the request (when required)
	CallerID string `json:"callerId"`

	// CreatedAt : epoch timestamp of request creation
	CreatedAt int64 `json:"createdAt"`

	// StageData : to keep track of data created during a stage
	// key of the map : unique business logic specific stage Name
	StageData map[string]*StageData `json:"stageData"`
}

type RequestState string

const (
	RequestStatePROCESSING RequestState = "PROCESSING"
	RequestStateFINISHED   RequestState = "FINISHED"
)

type RequestCallerType string

const (
	RequestCallerTypeCLIENT RequestCallerType = "CLIENT"
	RequestCallerTypeMSP    RequestCallerType = "MSP"
)

type StageData struct {
	BlockchainData []BlockchainData `json:"blockchainData"`

	// Output : output generate during a stage
	// which may required by upcoming stages
	// Business logic specific field
	// example : after fetching uuids of valid emission records
	// these uuid will be required to mint the token and update emission records
	/*
			utilityEmissionsCC : {
		  		 uuids : {"uuid-1","uuid-2"} --> base64 of json marshal
			}
	*/
	Outputs map[string]map[string]string `json:"outputs"`
}

// BlockchainData : data/assets which can resolved on given BlockchainNetworkType created during a stage
// which will be required by upcoming stage
// example tokenId of the minted token during tokenMinting stage
// need to be stored for updateEmissionsTokenId stage
// these data are only for business logic to understand
type BlockchainData struct {

	// NetworkType : name of the blockchain network where
	// data/asset has been created
	// Fabric
	// Ethereum
	Network string `json:"network"`

	// ContractAddress : address of a contract
	// in case of blockchain address will be contract address
	// - for ethereum network : it is simply `chainId::contractAddress`
	// - for fabric network : it is `channelName::chaincodeName`
	ContractAddress string `json:"contractAddress"`

	// KeysOfCreatedData : list of keys created on those contract
	// can be data or asset
	// example :
	/*
	   {
	       // tokenId of minted token on ethereum
	       tokenId : 0x115.......
	   }
	*/
	KeysCreated map[string]string `json:"keysCreated"`
}
