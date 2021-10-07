package internal

import (
	"datalock/model"
	"datalock/pkg/errors"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

func lock(stub shim.ChaincodeStubInterface, txID, cc string, ccInput model.DataChaincodeInput) (map[string]string, string, error) {
	const op = errors.Op("Locker.lock")
	ccName := errors.Chaincode(cc)
	// lock state check
	// invoke chaincode
	// lock returned keys

	// 1.
	for _, key := range ccInput.Keys {
		ok, err := isLockStateExists(stub, cc, key)
		if err != nil {
			return nil, "", errors.E(op, err, ccName)
		}
		if ok {
			return nil, "", errors.E(
				op,
				errors.CodeConflict,
				fmt.Errorf("key = %s already locked", key),
				errors.SeverityDebug,
				errors.TxID(txID),
				ccName,
			)
		}
	}

	// 2.
	resp := stub.InvokeChaincode(cc, stringArgsToByte(ccInput.Params), "")
	if resp.GetStatus() != shim.OK {
		return nil, "", errors.E(
			op,
			errors.CodeConflict,
			fmt.Errorf("failed to execute chaincode : %v", resp.Message),
			errors.SeverityDebug,
			errors.TxID(txID),
			ccName,
		)
	}

	// 3.
	var ccOutput model.DataChaincodeOutput
	err := json.Unmarshal(resp.Payload, &ccOutput)
	if err != nil {
		return nil, "", errors.E(
			op,
			errors.CodeConflict,
			fmt.Errorf("invalid response from data chaincode : %w", err),
			errors.SeverityDebug,
			errors.TxID(txID),
			ccName,
		)
	}
	for _, key := range ccOutput.Keys {
		err := putLockState(stub, txID, cc, key)
		if err != nil {
			return nil, "", errors.E(
				op,
				err,
				ccName,
			)
		}
	}
	return ccOutput.OutputToStore, ccOutput.OutputToClient, nil
}

func unlock(stub shim.ChaincodeStubInterface, txID, cc string, ccInput model.DataChaincodeInput) (map[string]string, string, error) {
	const op = errors.Op("Locker.unlock")
	ccName := errors.Chaincode(cc)
	// check locked state of each key
	// invoke chaincode
	// unlock keys

	// 1.
	for _, key := range ccInput.Keys {
		gotTxID, err := getLockStateTxID(stub, cc, key)
		if err != nil {
			return nil, "", errors.E(op, err, ccName)
		}

		if gotTxID != txID {
			return nil, "", errors.E(
				op,
				errors.CodeConflict,
				fmt.Errorf("data not locked for txID = %s", txID),
				errors.SeverityDebug,
				errors.TxID(txID),
				ccName,
			)
		}
	}

	// 2.
	resp := stub.InvokeChaincode(cc, stringArgsToByte(ccInput.Params), "")
	if resp.GetStatus() != shim.OK {
		return nil, "", errors.E(
			op,
			errors.CodeConflict,
			fmt.Errorf("failed to execute chaincode : %v", resp.Message),
			errors.SeverityDebug,
			errors.TxID(txID),
			ccName,
		)
	}

	// 3.
	var ccOutput model.DataChaincodeOutput
	err := json.Unmarshal(resp.Payload, &ccOutput)
	if err != nil {
		return nil, "", errors.E(
			op,
			errors.CodeConflict,
			fmt.Errorf("invalid response from data chaincode : %w", err),
			errors.SeverityDebug,
			errors.TxID(txID),
			ccName,
		)
	}
	for _, key := range ccOutput.Keys {
		err := deleteLockState(stub, txID, lockStateID(cc, key))
		if err != nil {
			return nil, "", errors.E(
				op,
				err,
				ccName,
			)
		}
	}
	return ccOutput.OutputToStore, ccOutput.OutputToClient, nil
}

func stringArgsToByte(args []string) [][]byte {
	out := make([][]byte, len(args))
	for i, arg := range args {
		out[i] = []byte(arg)
	}
	return out
}
