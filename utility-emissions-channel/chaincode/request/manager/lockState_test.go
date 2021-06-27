package manager

import (
	"container/list"
	"fmt"
	"reflect"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/stretchr/testify/assert"
)

func TestLockState(t *testing.T) {
	is := assert.New(t)
	stub := buildEmptyMockStub()

	reqId := "requestId-1"
	ccName := "UtilityEmissionsChaincode"
	key := "uuid-1"
	lockId := fmt.Sprintf(lockIdFormat, ccName, key)
	lockIndex, _ := shim.CreateCompositeKey(requestLockIndex, []string{reqId, lockId})

	t.Run("Put", func(t *testing.T) {
		stub.MockTransactionStart("tx-id")
		err := putLockState(stub, reqId, ccName, key)
		stub.MockTransactionEnd("tx-id")
		is.NoError(err)
		gotReqId, ok := stub.State[lockId]
		is.Equal(reqId, string(gotReqId))
		is.True(ok)
		_, ok = stub.State[lockIndex]
		is.True(ok)
	})

	t.Run("GetLockRequestId", func(t *testing.T) {
		gotReq, err := getLockReqId(stub, ccName, key)
		is.NoError(err)
		is.Equal(reqId, gotReq)
	})

	t.Run("Get::NotFound", func(t *testing.T) {
		stub.State = map[string][]byte{}
		ok, err := isLockStateExists(stub, ccName, key)
		is.NoError(err)
		is.False(ok)
	})

	t.Run("Get::Found", func(t *testing.T) {
		stub.State = map[string][]byte{
			lockId: []byte(reqId),
		}
		ok, err := isLockStateExists(stub, ccName, key)
		is.NoError(err)
		is.True(ok)
	})

	t.Run("Delete", func(t *testing.T) {
		stub.MockTransactionStart("tx-delete")
		stub.PutState(lockId, []byte(reqId))
		stub.MockTransactionEnd("tx-delete")
		err := deleteLockState(stub, reqId, lockId)
		is.NoError(err)
		_, ok := stub.State[lockId]
		is.False(ok)
	})
	t.Run("GetAll", func(t *testing.T) {
		stub.MockTransactionStart("tx-put")
		putLockState(stub, reqId, ccName, key+"-1")
		putLockState(stub, reqId, ccName, key+"-2")
		putLockState(stub, reqId+"-1", ccName, key+"-3")
		stub.MockTransactionEnd("tx-put")

		locks, err := getAllLockState(stub, reqId)
		is.NoError(err)
		is.Len(locks, 2)
		wantLocks := []string{"UtilityEmissionsChaincode::uuid-1-1", "UtilityEmissionsChaincode::uuid-1-2"}
		is.True(reflect.DeepEqual(wantLocks, locks))
	})
}

func buildEmptyMockStub() *shimtest.MockStub {
	s := new(shimtest.MockStub)
	s.State = make(map[string][]byte)
	s.Invokables = make(map[string]*shimtest.MockStub)
	s.Keys = list.New()
	return s
}
