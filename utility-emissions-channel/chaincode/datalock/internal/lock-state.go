package internal

import (
	"datalock/pkg/errors"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

const (
	lockStateIndexObj = "txID~lockID"
)

func lockStateID(cc, key string) string {
	return fmt.Sprintf("%s::%s", cc, key)
}

func lockStateIndex(txID, lockID string) string {
	lockIndex, _ := shim.CreateCompositeKey(lockStateIndexObj, []string{txID, lockID})
	return lockIndex
}

func putLockState(stub shim.ChaincodeStubInterface, txID, cc, key string) error {
	const op = errors.Op("LockState.putLockState")
	lockID := lockStateID(cc, key)
	err := stub.PutState(lockID, []byte(txID))
	if err != nil {
		return errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to put lock state : %w", err),
			errors.SeverityError,
			errors.TxID(txID),
		)
	}
	index := lockStateIndex(txID, lockID)
	err = stub.PutState(index, []byte{0x00})
	if err != nil {
		return errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to put lock state : %w", err),
			errors.SeverityError,
			errors.TxID(txID),
		)
	}
	return nil
}

func isLockStateExists(stub shim.ChaincodeStubInterface, cc, key string) (bool, error) {
	const op = errors.Op("LockState.isLockStateExists")
	lockID := lockStateID(cc, key)
	raw, err := stub.GetState(lockID)
	if err != nil {
		return false, errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to get lock state : %w", err),
			errors.SeverityError,
		)
	}
	return len(raw) != 0, nil
}

func getLockStateTxID(stub shim.ChaincodeStubInterface, cc, key string) (string, error) {
	const op = errors.Op("LockState.getLockStateTxID")
	lockID := lockStateID(cc, key)
	raw, err := stub.GetState(lockID)
	if err != nil {
		return "", errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to get lock state : %w", err),
			errors.SeverityError,
		)
	}
	return string(raw), nil
}

func deleteLockState(stub shim.ChaincodeStubInterface, txID, lockID string) error {
	const op = errors.Op("LockState.getLockStateTxID")
	err := stub.DelState(lockID)
	if err != nil {
		return errors.E(
			op,
			fmt.Errorf("failed to delete lock state : %w", err),
			errors.SeverityError,
			errors.TxID(txID),
		)
	}
	index := lockStateIndex(txID, lockID)
	err = stub.DelState(index)
	if err != nil {
		return errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to delete lock state index : %w", err),
			errors.SeverityError,
			errors.TxID(txID),
		)
	}
	return nil
}

func getAllLockState(stub shim.ChaincodeStubInterface, txID string) ([]string, error) {
	const op = errors.Op("LockState.getAllLockState")
	itr, err := stub.GetStateByPartialCompositeKey(lockStateIndexObj, []string{txID})
	if err != nil {
		return nil, errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to create tx index iterator : %w", err),
			errors.SeverityError,
			errors.TxID(txID),
		)
	}
	out := []string{}
	defer itr.Close()
	for itr.HasNext() {
		kv, _ := itr.Next()
		_, args, _ := stub.SplitCompositeKey(kv.Key)
		out = append(out, args[1])
	}
	return out, nil
}
