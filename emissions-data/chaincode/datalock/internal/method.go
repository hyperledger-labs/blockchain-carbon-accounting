package internal

import (
	"datalock/model"
	"datalock/pkg/errors"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

var methodMap = map[string]func(stub shim.ChaincodeStubInterface, args []string) ([]byte, error){
	"startTransitionProcess": startTransitionProcess,
	"endTransitionProcess":   endTransitionProcess,
	"stageUpdate":            stageUpdate,
	"getTxDetails":           getTxDetails,
}

func startTransitionProcess(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	const op = errors.Op("Method.startTransitionProcess")
	if len(args) != 1 {
		return nil, errors.E(
			op,
			errors.CodeInvalidInput,
			fmt.Errorf("invalid number of input, require 1, but provided %s", args),
			errors.SeverityDebug,
		)
	}
	txID := args[0]
	raw, err := txState(stub, txID, true)
	if err != nil {
		return nil, errors.E(op, err)
	}
	return raw, nil
}

func endTransitionProcess(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	const op = errors.Op("Method.endTransitionProcess")
	if len(args) != 1 {
		return nil, errors.E(
			op,
			errors.CodeInvalidInput,
			fmt.Errorf("invalid number of input, require 1, but provided %s", args),
			errors.SeverityDebug,
		)
	}
	txID := args[0]
	_, err := txState(stub, txID, false)
	if err != nil {
		return nil, errors.E(op, err)
	}
	return nil, nil
}

func stageUpdate(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	const op = errors.Op("Method.stageUpdate")
	if len(args) != 1 {
		return nil, errors.E(
			op,
			errors.CodeInvalidInput,
			fmt.Errorf("invalid number of input, require 1, but provided %s", args),
			errors.SeverityDebug,
		)
	}
	var input model.StageUpdateInput
	err := json.Unmarshal([]byte(args[0]), &input)
	if err != nil {
		return nil, errors.E(
			op,
			errors.CodeInvalidInput,
			fmt.Errorf("invalid input object : %w", err),
			errors.SeverityDebug,
		)
	}

	raw, err := stub.GetState(input.TxID)
	if err != nil || len(raw) == 0 {
		return nil, errors.E(
			op,
			errors.CodeNotFound,
			fmt.Errorf("transition not found"),
			errors.SeverityDebug,
			errors.TxID(input.TxID),
		)
	}
	var tx model.Transaction
	json.Unmarshal(raw, &tx)
	if tx.State != model.TxStatePROCESSING {
		return nil, errors.E(
			op,
			errors.CodeNotFound,
			fmt.Errorf("transition is not at processing state, found at %s", tx.State),
			errors.SeverityDebug,
			errors.TxID(input.TxID),
		)
	}

	tx.CurrentStage = input.Name
	output := model.StageUpdateOutput{
		DataLocks: map[string]string{},
		DataFree:  map[string]string{},
	}
	stageData := model.TxStageData{
		Output: map[string]map[string]string{},
	}
	stageData.Storage = input.Storage

	for ccName, ccInput := range input.DataLocks {
		toStore, toClient, err := lock(stub, tx.TxID, ccName, ccInput)
		if err != nil {
			return nil, errors.E(
				op,
				err,
			)
		}
		if len(toClient) != 0 {
			output.DataLocks[ccName] = toClient
		}
		if len(toClient) != 0 {
			stageData.Output[ccName] = toStore
		}
	}
	for ccName, ccInput := range input.DataFree {
		toStore, toClient, err := unlock(stub, tx.TxID, ccName, ccInput)
		if err != nil {
			return nil, errors.E(
				op,
				err,
			)
		}
		if len(toClient) != 0 {
			output.DataFree[ccName] = toClient
		}
		if len(toClient) != 0 {
			stageData.Output[ccName] = toStore
		}
	}
	if len(stageData.Output) != 0 || len(stageData.Storage) != 0 {
		tx.StageData[input.Name] = &stageData
	}
	if input.IsLast {
		tx.State = model.TxStateFINISHED
	}
	raw, _ = json.Marshal(tx)
	err = stub.PutState(tx.TxID, raw)
	if err != nil {
		return nil, errors.E(
			op,
			errors.CodeUnexpected,
			fmt.Errorf("failed to put transaction state : %w", err),
			errors.SeverityError,
			errors.TxID(tx.TxID),
		)
	}
	raw, _ = json.Marshal(output)
	return raw, nil
}

func getTxDetails(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	const op = errors.Op("Method.getTxDetails")
	if len(args) != 1 {
		return nil, errors.E(
			op,
			errors.CodeInvalidInput,
			fmt.Errorf("invalid number of input, require 1, but provided %s", args),
			errors.SeverityDebug,
		)
	}
	txID := args[0]
	raw, err := stub.GetState(txID)
	if err != nil || len(raw) == 0 {
		return nil, errors.E(
			op,
			errors.CodeNotFound,
			fmt.Errorf("transition not found"),
			errors.SeverityDebug,
			errors.TxID(txID),
		)
	}
	return raw, nil
}
