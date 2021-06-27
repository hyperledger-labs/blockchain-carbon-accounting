package manager

import (
	"fmt"

	"request/manager/log"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

// []byte{0x00}
// requestLockIndex : to get query all the lock id assigned to a request
const requestLockIndex = "reqId~lockId"
const lockIdFormat = "%s::%s" // ccName::key

func putLockState(stub shim.ChaincodeStubInterface, reqId, ccName, key string) error {
	lockId := fmt.Sprintf(lockIdFormat, ccName, key)
	err := stub.PutState(lockId, []byte(reqId))
	if err != nil {
		log.Debugf("%s :: key = %s", errPuttingState, lockId)
	}
	lockIndex, _ := shim.CreateCompositeKey(requestLockIndex, []string{reqId, lockId})
	if err = stub.PutState(lockIndex, []byte{0x00}); err != nil {
		log.Debugf("%s :: key = %s", errPuttingState, lockIndex)
		return err
	}
	return nil
}

func isLockStateExists(stub shim.ChaincodeStubInterface, ccName, key string) (bool, error) {
	lockId := fmt.Sprintf(lockIdFormat, ccName, key)
	raw, err := stub.GetState(lockId)
	if err != nil {
		log.Debugf("%s :: key = %s", errGettingState, lockId)
		return false, err
	}
	return len(raw) != 0, nil
}

func getLockReqId(stub shim.ChaincodeStubInterface, ccName, key string) (string, error) {
	lockId := fmt.Sprintf(lockIdFormat, ccName, key)
	raw, err := stub.GetState(lockId)
	if err != nil {
		log.Debugf("%s :: key = %s", errGettingState, lockId)
		return "", err
	}
	if len(raw) == 0 {
		return "", fmt.Errorf("lock doesn't exist for key = %s on chaincode = %s", key, ccName)
	}
	return string(raw), nil
}

func deleteLockState(stub shim.ChaincodeStubInterface, reqId, lockId string) error {
	if err := stub.DelState(lockId); err != nil {
		log.Debugf("%s :: key = %s", errDeletingState, lockId)
		return err
	}
	lockIndex, _ := shim.CreateCompositeKey(requestLockIndex, []string{reqId, lockId})
	if err := stub.DelState(lockIndex); err != nil {
		log.Debugf("%s :: key = %s", errDeletingState, lockId)
		return err
	}
	return nil
}

// returns list of locks place by a given request
func getAllLockState(stub shim.ChaincodeStubInterface, reqId string) ([]string, error) {
	out := []string{}
	iterator, err := stub.GetStateByPartialCompositeKey(requestLockIndex, []string{reqId})
	if err != nil {
		return nil, err
	}
	defer iterator.Close()
	for iterator.HasNext() {
		kv, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		_, args, err := stub.SplitCompositeKey(kv.Key)
		if err != nil {
			return nil, err
		}
		out = append(out, args[1])
	}
	return out, nil
}
