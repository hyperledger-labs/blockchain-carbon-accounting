package manager

import (
	"request/manager/log"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
)

// RequestManagerChaincode : manages state of a request
// also maintains locks on fabric data
// present on different chaincode installed on same channel.
type RequestManagerChaincode struct{}

func (*RequestManagerChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

func (*RequestManagerChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	methodName, args := stub.GetFunctionAndParameters()
	if len(args) != 1 {
		log.Errorf("%s :: request manager chaincode require one argument (a JSON Request Object)", errBadRequest)
		return peer.Response{
			Status:  400,
			Message: "request manager chaincode require one argument (a JSON Request Object)",
		}
	}
	method, ok := methodRegistry[methodName]
	if !ok {
		log.Errorf("%s :: method = %s", errMethodUnsupported, methodName)
		return peer.Response{
			Status:  404,
			Message: "not supported",
		}
	}
	log.Infof("method = %s", methodName)
	return method(stub, []byte(args[0]))
}

var methodRegistry = map[string]func(stub shim.ChaincodeStubInterface, args []byte) peer.Response{
	"stageUpdate":       stageUpdate,
	"getRequest":        getRequest,
	"getAllLocksForReq": getAllLocksForReq,
}

// ConfigureChaincode : configure chaincode instance.
func (*RequestManagerChaincode) ConfigureChaincode() {
	log.InitLogger(true)
}
