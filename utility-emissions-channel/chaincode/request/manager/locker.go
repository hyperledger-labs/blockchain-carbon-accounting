package manager

import (
	"encoding/json"
	"fmt"
	"request/manager/log"
	"request/manager/model"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

// TODO v 0.0.3 : use heap to keep `track` of all the lock and free done during lock()/unlock()
// if last stage and state==FINISHED
// for _,key := range getAllLockState
//   track.pop(key)
// if track != nil; return lastStage can't be finished without freeing all the data locked by
// a request

// invoke data chaincode for doing business logic check before locking a free fabric data.
// returns
// 1. output data generate by invokeing data chiancode to be stored
// 2. output data generate by invokeing data chiancode to be directly sent to client
func lock(stub shim.ChaincodeStubInterface, reqId, ccName, method string, ccInput model.DataChaincodeInput) (map[string]string, string, error) {
	// lock state check
	// invoke chaincode
	// lock returned keys

	// 1.
	log.Debugf("checking free lock state")
	for _, key := range ccInput.Keys {
		ok, err := isLockStateExists(stub, ccName, key)
		if err != nil {
			return nil, "", err
		}
		if ok {
			return nil, "", fmt.Errorf("key = %s already locked", key)
		}
	}
	// 2.
	log.Debugf("running business logic before locking , method = %s", method)
	ccInputRaw, _ := json.Marshal(ccInput)
	resp := stub.InvokeChaincode(ccName, [][]byte{[]byte(method), ccInputRaw}, "")
	if resp.GetStatus() != shim.OK {
		return nil, "", fmt.Errorf(resp.GetMessage())
	}
	log.Debugf("response = %s", string(resp.GetPayload()))

	// 3.
	var ccOutput model.DataChaincodeOutput
	err := json.Unmarshal(resp.GetPayload(), &ccOutput)
	if err != nil {
		return nil, "", fmt.Errorf("fail to unmarshal chaincode response %v", err)
	}

	log.Debugf("locking keys = %v", ccOutput.Keys)
	for _, key := range ccOutput.Keys {
		if err = putLockState(stub, reqId, ccName, key); err != nil {
			return nil, "", err
		}
	}
	log.Debugf("successfully locked : %v", ccOutput.Keys)
	return ccOutput.OutputToStore, ccOutput.OutputToClient, nil
}

// invoke data chaincode for doing business logic check before freeing a locked fabric data.
// returns
// 1. output data generate by invokeing data chiancode to be stored
// 2. output data generate by invokeing data chiancode to be directly sent to client
func unlock(stub shim.ChaincodeStubInterface, reqId, ccName, method string, ccInput model.DataChaincodeInput) (map[string]string, string, error) {
	// check locked state of each key
	// invoke chaincode
	// unlock keys

	// 1.
	log.Debug("checking locked lock state")
	for _, key := range ccInput.Keys {
		requestId, err := getLockReqId(stub, ccName, key)
		if err != nil {
			return nil, "", err
		}
		if requestId != reqId {
			return nil, "", fmt.Errorf("data is not locked for request id = %s", reqId)
		}
	}

	// 2.
	log.Debugf("running business logic before freeing , method = %s", method)
	ccInputRaw, _ := json.Marshal(ccInput)
	resp := stub.InvokeChaincode(ccName, [][]byte{[]byte(method), ccInputRaw}, "")
	if resp.GetStatus() != shim.OK {
		return nil, "", fmt.Errorf(resp.GetMessage())
	}
	log.Debugf("response = %s", string(resp.GetPayload()))

	// 3.
	var ccOutput model.DataChaincodeOutput
	err := json.Unmarshal(resp.GetPayload(), &ccOutput)
	if err != nil {
		return nil, "", fmt.Errorf("fail to unmarshal chaincode response %v", err)
	}
	log.Debugf("freeing keys = %s", ccOutput.Keys)
	for _, key := range ccOutput.Keys {
		lockId := fmt.Sprintf(lockIdFormat, ccName, key)
		if err = deleteLockState(stub, reqId, lockId); err != nil {
			return nil, "", err
		}
	}
	log.Debugf("successfully freed : %v", ccOutput.Keys)
	return ccOutput.OutputToStore, ccOutput.OutputToClient, nil
}
