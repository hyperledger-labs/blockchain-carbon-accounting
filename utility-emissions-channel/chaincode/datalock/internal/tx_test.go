package internal

import (
	"datalock/model"
	"datalock/pkg/logger"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTxState(t *testing.T) {
	is := assert.New(t)
	stub := buildEmptyMockStub()
	logger.NewAppLogger("DEBUG")

	t.Run("end-non-existing", func(t *testing.T) {
		stub.MockTransactionStart("end-non-existing")
		raw, err := txState(stub, "non-existsing", false)
		stub.MockTransactionEnd("end-non-existing")
		is.Nil(raw)
		is.Error(err)
		is.Equal("transaction not found", err.Error())
	})
	txID := "uuid-1"
	t.Run("start-non-existing", func(t *testing.T) {
		stub.MockTransactionStart("start-non-existing")
		raw, err := txState(stub, txID, true)
		stub.MockTransactionEnd("start-non-existing")
		is.NoError(err)
		is.NotNil(raw)
		var tx model.Transaction
		err = json.Unmarshal(stub.State[txID], &tx)
		is.NoError(err)
		is.Equal(model.TxStatePROCESSING, tx.State)
	})

	t.Run("start-processing", func(t *testing.T) {
		stub.MockTransactionStart("start-processing")
		raw, err := txState(stub, txID, true)
		stub.MockTransactionEnd("start-processing")
		is.Equal("transaction is not at non-processing state, found at PROCESSING", err.Error())
		is.Nil(raw)
	})

	t.Run("end-processing", func(t *testing.T) {
		stub.MockTransactionStart("end-processing")
		raw, err := txState(stub, txID, false)
		stub.MockTransactionEnd("end-processing")
		is.NoError(err)
		is.NotNil(raw)
		var tx model.Transaction
		err = json.Unmarshal(stub.State[txID], &tx)
		is.NoError(err)
		is.Equal(model.TxStateNOTPROCESSING, tx.State)
	})

	t.Run("end-non-processing", func(t *testing.T) {
		stub.MockTransactionStart("end-non-processing")
		raw, err := txState(stub, txID, false)
		stub.MockTransactionEnd("end-non-processing")
		is.Equal(
			"transaction is not at processing state, found at NOT-PROCESSING",
			err.Error(),
		)
		is.Nil(raw)
	})

	t.Run("start-not-processing", func(t *testing.T) {
		stub.MockTransactionStart("start-not-processing")
		raw, err := txState(stub, txID, true)
		stub.MockTransactionEnd("start-not-processing")
		is.NoError(err)
		is.NotNil(raw)
		var tx model.Transaction
		err = json.Unmarshal(raw, &tx)
		is.NoError(err)
		is.Equal(model.TxStatePROCESSING, tx.State)
	})
}
