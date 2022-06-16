package internal

import (
	"datalock/model"
	"datalock/pkg/errors"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

// before application can start locking/unlock using datalock
// process will have to set state of transaction to processing
// and when done, will again have to call datalock to change the
// state to not-processing
// id : identifier of tx
// processing : true, setting the state to process and not-processing otherwise
func txState(stub shim.ChaincodeStubInterface, txID string, processing bool) ([]byte, error) {
	const op = errors.Op("internal.txState")
	id := errors.TxID(txID)

	raw, err := stub.GetState(txID)
	if err != nil {
		errors.Wrap(err, "failed to fetch transaction")
		return nil, errors.E(op, errors.CodeUnexpected, err, errors.SeverityError, id)
	}
	if len(raw) == 0 && !processing {
		return nil, errors.E(op, errors.CodeNotFound, fmt.Errorf("transaction not found"), errors.SeverityDebug, id)
	}
	var tx model.Transaction
	if len(raw) == 0 {
		tx = model.Transaction{
			TxID:      txID,
			State:     model.TxStatePROCESSING,
			StageData: map[string]*model.TxStageData{},
		}
	} else {
		json.Unmarshal(raw, &tx)
		if processing && tx.State == model.TxStateFINISHED {
			return nil, errors.E(
				op,
				errors.CodeConflict,
				fmt.Errorf("transaction is already at finished state"),
				errors.SeverityDebug,
				id,
			)
		} else if processing && tx.State != model.TxStateNOTPROCESSING {
			return nil, errors.E(
				op,
				errors.CodeConflict,
				fmt.Errorf("transaction is not at non-processing state, found at %s", tx.State),
				errors.SeverityDebug,
				id,
			)
		} else if !processing && tx.State == model.TxStateFINISHED {
			return nil, nil
		} else if !processing && tx.State != model.TxStatePROCESSING {
			return nil, errors.E(
				op,
				errors.CodeConflict,
				fmt.Errorf("transaction is not at processing state, found at %s", tx.State),
				errors.SeverityDebug,
				id,
			)
		}
		if processing {
			tx.State = model.TxStatePROCESSING
		} else {
			tx.State = model.TxStateNOTPROCESSING
		}
	}
	raw, _ = json.Marshal(tx)
	err = stub.PutState(txID, raw)
	if err != nil {
		errors.Wrap(err, "putting transaction into worldstate")
		return nil, errors.E(op, errors.CodeUnexpected, err, errors.SeverityError, id)
	}
	return raw, nil
}
