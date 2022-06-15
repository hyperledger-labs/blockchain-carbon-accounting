package internal

import (
	"datalock/pkg/errors"
	"datalock/pkg/logger"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	pb "github.com/hyperledger/fabric-protos-go/peer"
)

// DataLockChaincode : implements fabric
// chaincode interface
type DataLockChaincode struct{}

func (c *DataLockChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func (c *DataLockChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	const op = errors.Op("DataLockChaincode.Invoke")
	methodName, args := stub.GetFunctionAndParameters()
	method, ok := methodMap[methodName]
	if !ok {
		err := fmt.Errorf("method not supported")
		logger.SystemErr(methodName, errors.E(op, err, errors.SeverityDebug, errors.CodeInvalidInput))
		return shim.Error(err.Error())
	}
	resp, err := method(stub, args)
	if err != nil {
		logger.SystemErr(methodName, errors.E(op, err))
		return shim.Error(err.Error())
	}
	return shim.Success(resp)
}
