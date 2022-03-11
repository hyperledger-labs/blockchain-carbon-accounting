package internal

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLockState(t *testing.T) {
	is := assert.New(t)
	stub := buildEmptyMockStub()

	txID := "txID-1"
	ccName := "EmissionsChaincode"
	key := "uuid-1"
	lockId := lockStateID(ccName, key)
	lockIndex := lockStateIndex(txID, lockId)

	t.Run("Put", func(t *testing.T) {
		stub.MockTransactionStart("put")
		err := putLockState(stub, txID, ccName, key)
		stub.MockTransactionEnd("put")
		is.NoError(err)
		gotTxID, ok := stub.State[lockId]
		is.True(ok)
		is.Equal(txID, string(gotTxID))
		_, ok = stub.State[lockIndex]
		is.True(ok)
	})

	t.Run("getLockStateTxID", func(t *testing.T) {
		getTxID, err := getLockStateTxID(stub, ccName, key)
		is.NoError(err)
		is.Equal(txID, getTxID)
	})

	t.Run("Get::NotFound", func(t *testing.T) {
		stub.State = map[string][]byte{}
		ok, err := isLockStateExists(stub, ccName, key)
		is.NoError(err)
		is.False(ok)
	})

	t.Run("Get::Found", func(t *testing.T) {
		stub.State = map[string][]byte{
			lockId: []byte(txID),
		}
		ok, err := isLockStateExists(stub, ccName, key)
		is.NoError(err)
		is.True(ok)
	})

	t.Run("Delete", func(t *testing.T) {
		stub.MockTransactionStart("Delete")
		stub.PutState(lockId, []byte(txID))
		stub.MockTransactionEnd("Delete")

		err := deleteLockState(stub, txID, lockId)
		is.NoError(err)
		_, ok := stub.State[lockId]
		is.False(ok)
	})
	t.Run("GetAll", func(t *testing.T) {
		stub.MockTransactionStart("Allput")
		putLockState(stub, txID, ccName, key+"-1")
		putLockState(stub, txID, ccName, key+"-2")
		putLockState(stub, txID+"-1", ccName, key+"-3")
		stub.MockTransactionEnd("Allput")

		locks, err := getAllLockState(stub, txID)
		is.NoError(err)
		is.Len(locks, 2)
		wantLocks := []string{"EmissionsChaincode::uuid-1-1", "EmissionsChaincode::uuid-1-2"}
		is.True(reflect.DeepEqual(wantLocks, locks))
	})
}
