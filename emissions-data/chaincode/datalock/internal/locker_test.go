package internal

import (
	"container/list"
	"datalock/mock"
	"datalock/model"
	"encoding/base64"
	"encoding/json"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/stretchr/testify/assert"
)

var (
	mockEmissions = []mock.Emissions{
		{
			UUID: "uuid-1",
		},
		{
			UUID: "uuid-2",
		},
		{
			UUID: "uuid-3",
		},
		{
			UUID: "uuid-4",
		},
		{
			UUID:    "uuid-5",
			TokenId: "tokenId-1",
			PartyId: "partyId-1",
		},
		{
			UUID:    "uuid-6",
			TokenId: "tokenId-2",
			PartyId: "partyId-2",
		},
	}
)

func loadMockEmissions(emStub *shimtest.MockStub) {
	emStub.MockTransactionStart("mock-load")
	for _, em := range mockEmissions {
		raw, _ := json.Marshal(em)
		emStub.PutState(em.UUID, raw)
	}
	emStub.MockTransactionEnd("mock-load")
}

func TestLockerLock(t *testing.T) {
	is := assert.New(t)

	emCCName := "EmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqStub := buildEmptyMockStub()
	reqStub.Invokables[emCCName] = emStub

	/////////////////////////////////////
	txID := "txID-1"
	reqStub.MockTransactionStart("mock-lock")
	toStore, toClient, err := lock(reqStub, txID, emCCName, model.DataChaincodeInput{
		Keys:   []string{"uuid-1", "uuid-3", "uuid-5"},
		Params: []string{"getValidEmissions", "uuid-1", "uuid-3", "uuid-5"},
	})
	reqStub.MockTransactionEnd("mock-lock")

	// test on return value
	is.NoError(err)

	raw, err := base64.StdEncoding.DecodeString(toClient)
	is.NoError(err)
	var emissions []mock.Emissions
	err = json.Unmarshal(raw, &emissions)
	is.NoError(err)
	is.Len(emissions, 2)

	rawString, ok := toStore["validUUIDs"]
	is.True(ok)
	raw, err = base64.StdEncoding.DecodeString(rawString)
	is.NoError(err)
	var validUUIDs []string
	err = json.Unmarshal(raw, &validUUIDs)
	is.NoError(err)
	is.Len(validUUIDs, 2)

	// test on state
	is.Len(reqStub.State, 4)
	raw, ok = reqStub.State["EmissionsCC::uuid-1"]
	is.True(ok)
	is.Equal(txID, string(raw))

	raw, ok = reqStub.State["EmissionsCC::uuid-3"]
	is.True(ok)
	is.Equal(txID, string(raw))

}

func TestLockerLockFail(t *testing.T) {
	is := assert.New(t)

	emCCName := "EmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	txStub := buildEmptyMockStub()
	txStub.Invokables[emCCName] = emStub

	txID := "txId-1"
	t.Run("OnLockerData", func(t *testing.T) {
		txStub.MockTransactionStart("setup")
		putLockState(txStub, txID, emCCName, "uuid-1")
		txStub.MockTransactionEnd("setup")
		toStore, toClient, err := lock(txStub, txID, emCCName, model.DataChaincodeInput{
			Keys:   []string{"uuid-1", "uuid-3", "uuid-5"},
			Params: []string{"getValidEmissions", "uuid-1", "uuid-3", "uuid-5"},
		})
		is.Error(err)
		is.Nil(toStore)
		is.Zero(toClient)
		txStub.State = map[string][]byte{} // make it empty
		txStub.Keys = list.New()           // make state empty
	})

	t.Run("BusinessLogicfail", func(t *testing.T) {
		toStore, toClient, err := lock(txStub, txID, emCCName, model.DataChaincodeInput{
			Keys:   []string{"uuid-1", "uuid-3", "uuid-5"},
			Params: []string{"method-not-found", "uuid-1", "uuid-3", "uuid-5"},
		})
		is.Error(err)
		is.Zero(toClient)
		is.Nil(toStore)
	})

	t.Run("InvalidResponse", func(t *testing.T) {
		toStore, toClient, err := lock(txStub, txID, emCCName, model.DataChaincodeInput{
			Keys:   []string{"uuid-1", "uuid-3", "uuid-5"},
			Params: []string{"method-invalid-response", "uuid-1", "uuid-3", "uuid-5"},
		})
		is.Error(err)
		is.Zero(toClient)
		is.Nil(toStore)
	})
}

func TestLockerUnlock(t *testing.T) {
	is := assert.New(t)

	emCCName := "EmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	txStub := buildEmptyMockStub()
	txStub.Invokables[emCCName] = emStub

	txID := "txId-1"

	txStub.MockTransactionStart("setup")
	putLockState(txStub, txID, emCCName, "uuid-1")
	putLockState(txStub, txID, emCCName, "uuid-2")
	txStub.MockTransactionEnd("setup")

	partyID := "partyID-1"
	tokenID := "tokenID-1"
	txStub.MockTransactionStart("tx")
	toStore, toClient, err := unlock(txStub, txID, emCCName, model.DataChaincodeInput{
		Keys:   []string{"uuid-1", "uuid-2"},
		Params: []string{"UpdateEmissionsWithToken", tokenID, partyID, "uuid-1", "uuid-2"},
	})
	txStub.MockTransactionEnd("tx")
	is.NoError(err)
	is.Nil(toStore)
	is.Zero(toClient)

	{
		for _, uuid := range []string{"uuid-1", "uuid-2"} {

			// tokenID and partyID should be updated
			raw, ok := emStub.State[uuid]
			is.True(ok)
			var record mock.Emissions

			json.Unmarshal(raw, &record)
			is.Equal(tokenID, record.TokenId)
			is.Equal(partyID, record.PartyId)

			// check should be unlocked
			ok, err = isLockStateExists(txStub, emCCName, "uuid-2")
			is.NoError(err)
			is.False(ok)
		}
	}
}

func TestLockerUnlockFail(t *testing.T) {
	is := assert.New(t)

	emCCName := "EmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	txStub := buildEmptyMockStub()
	txStub.Invokables[emCCName] = emStub

	txID := "txId-1"
	t.Run("notLocked", func(t *testing.T) {
		toStore, toClient, err := unlock(txStub, txID, emCCName, model.DataChaincodeInput{
			Keys:   []string{"uuid-1"},
			Params: []string{},
		})
		is.Error(err)
		is.Zero(toClient)
		is.Nil(toStore)
	})
	txStub.MockTransactionStart("setup")
	putLockState(txStub, txID, emCCName, "uuid-1")
	txStub.MockTransactionStart("setup")

	t.Run("BusinessLogicfail", func(t *testing.T) {
		toStore, toClient, err := unlock(txStub, txID, emCCName, model.DataChaincodeInput{
			Keys:   []string{"uuid-1"},
			Params: []string{"UpdateEmissionsWithToken"},
		})
		t.Log(err)
		is.Error(err)
		is.Zero(toClient)
		is.Nil(toStore)
	})

	t.Run("invlaidResponse", func(t *testing.T) {
		toStore, toClient, err := unlock(txStub, txID, emCCName, model.DataChaincodeInput{
			Keys:   []string{"uuid-1"},
			Params: []string{"method-invalid-response"},
		})
		t.Log(err)
		is.Error(err)
		is.Zero(toClient)
		is.Nil(toStore)
	})

}
