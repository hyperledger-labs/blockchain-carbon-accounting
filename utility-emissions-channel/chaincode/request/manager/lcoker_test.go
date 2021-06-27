package manager

import (
	"encoding/base64"
	"encoding/json"
	"request/manager/log"
	"request/manager/model"
	"request/mock"
	"sync"
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

func TestLock(t *testing.T) {
	is := assert.New(t)

	emCCName := "UtilityEmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqStub := buildEmptyMockStub()
	reqStub.Invokables[emCCName] = emStub
	log.InitLogger(true)

	/////////////////////////////////////
	reqId := "req-1"
	reqStub.MockTransactionStart("mock-lock")
	toStore, toClient, err := lock(reqStub, reqId, emCCName, "getValidEmissions", model.DataChaincodeInput{
		Keys: []string{"uuid-1", "uuid-3", "uuid-5"},
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
	raw, ok = reqStub.State["UtilityEmissionsCC::uuid-1"]
	is.True(ok)
	is.Equal(reqId, string(raw))

	raw, ok = reqStub.State["UtilityEmissionsCC::uuid-3"]
	is.True(ok)
	is.Equal(reqId, string(raw))
}

func TestLockFail(t *testing.T) {
	is := assert.New(t)

	emCCName := "UtilityEmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqStub := buildEmptyMockStub()
	reqStub.Invokables[emCCName] = emStub
	log.InitLogger(true)

	/////////////////////////////////////
	reqId := "req-id-1"
	t.Run("OnLockedData", func(t *testing.T) {
		reqStub.MockTransactionStart("mock-lock-locked")
		reqStub.PutState("UtilityEmissionsCC::uuid-1", []byte(reqId))
		reqStub.MockTransactionEnd("mock-lock-locked")
		toStore, toClient, err := lock(reqStub, reqId, emCCName, "getValidEmissions", model.DataChaincodeInput{
			Keys: []string{"uuid-1", "uuid-3", "uuid-5"},
		})

		is.Error(err)
		is.Nil(toStore)
		is.Zero(toClient)
	})

	t.Run("BusinessLogicfail", func(t *testing.T) {
		toStore, toClient, err := lock(reqStub, reqId, emCCName, "getValidEmissions", model.DataChaincodeInput{
			Keys: []string{"uuid-not-found"},
		})
		is.Error(err)
		is.Nil(toStore)
		is.Zero(toClient)
	})
}

func TestLockConcurrentClient(t *testing.T) {
	is := assert.New(t)

	emCCName := "UtilityEmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqStub := buildEmptyMockStub()
	reqStub.Invokables[emCCName] = emStub
	log.InitLogger(true)

	/////////////////////////////////////
	reqId1 := "req-id-1"
	reqId2 := "req-id-2"

	var err1 error
	var err2 error

	var toStore1 map[string]string
	var toClient1 string

	var toStore2 map[string]string
	var toClient2 string

	wg := sync.WaitGroup{}
	wg.Add(2)
	// mutex is used here for simulating blockchain nature of preventing writting as key with same version
	// in fabric it will return either return MVCC error or simple error saying "key is locked"
	// but in this test one of the client will return error saying "key is locked"
	// by using mutex this no longer remain a concurnet client call
	mu := sync.Mutex{}
	go func() {
		defer wg.Done()
		mu.Lock()
		defer mu.Unlock()
		reqStub.MockTransactionStart("mock-lock-client-1")
		toStore1, toClient1, err1 = lock(reqStub, reqId1, emCCName, "getValidEmissions", model.DataChaincodeInput{
			Keys: []string{"uuid-1", "uuid-3", "uuid-5"},
		})
		reqStub.MockTransactionEnd("mock-lock-client-1")
	}()

	go func() {
		defer wg.Done()
		mu.Lock()
		defer mu.Unlock()
		reqStub.MockTransactionStart("mock-lock-client-2")
		toStore2, toClient2, err2 = lock(reqStub, reqId2, emCCName, "getValidEmissions", model.DataChaincodeInput{
			Keys: []string{"uuid-1", "uuid-5"},
		})
		reqStub.MockTransactionEnd("mock-lock-client-2")
	}()

	wg.Wait()

	is.True((err1 == nil && err2 != nil) || (err1 != nil && err2 == nil))

	if err1 == nil {
		t.Log("Client::1 successfully locked uuid-1 and uuid-3")
		is.Len(reqStub.State, 4)
	} else if err2 == nil {
		t.Log("Client::2 successfully locked uuid-1")

		is.Len(reqStub.State, 2)
	}
	_ = toStore1
	_ = toClient1
	_ = toStore2
	_ = toClient2

}

func TestUnlock(t *testing.T) {
	is := assert.New(t)

	emCCName := "UtilityEmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqStub := buildEmptyMockStub()
	reqStub.Invokables[emCCName] = emStub
	log.InitLogger(true)

	/////////////////////////////////////
	reqId := "req-1"
	//
	{
		reqStub.MockTransactionStart("mock-unlock-setup")
		putLockState(reqStub, reqId, emCCName, "uuid-1")
		putLockState(reqStub, reqId, emCCName, "uuid-2")
		reqStub.MockTransactionStart("mock-unlock-setup")
	}
	//
	ccInputRaw, _ := json.Marshal(mock.UpdateEmissionsMintedTokenParams{
		TokenId: "tokenId",
		PartyId: "partyId",
	})

	reqStub.MockTransactionStart("mock-unlock")
	toStore, toClient, err := unlock(reqStub, reqId, emCCName, "UpdateEmissionsWithToken", model.DataChaincodeInput{
		Keys:   []string{"uuid-1", "uuid-2"},
		Params: base64.StdEncoding.EncodeToString(ccInputRaw),
	})
	reqStub.MockTransactionEnd("mock-unlock")
	is.NoError(err)
	is.Nil(toStore)
	is.Zero(toClient)
	is.Len(reqStub.State, 0)

	raw, ok := emStub.State["uuid-1"]
	is.True(ok)
	var emissions mock.Emissions
	err = json.Unmarshal(raw, &emissions)
	is.NoError(err)
	is.Equal(emissions.PartyId, "partyId")
	is.Equal(emissions.TokenId, "tokenId")

	raw, ok = emStub.State["uuid-2"]
	is.True(ok)
	emissions = mock.Emissions{}
	err = json.Unmarshal(raw, &emissions)
	is.NoError(err)
	is.Equal(emissions.PartyId, "partyId")
	is.Equal(emissions.TokenId, "tokenId")

}

func TestUnlockFail(t *testing.T) {
	is := assert.New(t)

	emCCName := "UtilityEmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqStub := buildEmptyMockStub()
	reqStub.Invokables[emCCName] = emStub
	log.InitLogger(true)

	/////////////////////////////////////
	reqId := "req-1"
	//
	{
		reqStub.MockTransactionStart("mock-unlock-setup")
		putLockState(reqStub, reqId, emCCName, "uuid-1")
		putLockState(reqStub, reqId, emCCName, "uuid-2")
		putLockState(reqStub, reqId, emCCName, "uuid-7")
		reqStub.MockTransactionStart("mock-unlock-setup")
	}
	ccInputRaw, _ := json.Marshal(mock.UpdateEmissionsMintedTokenParams{
		TokenId: "tokenId",
		PartyId: "partyId",
	})
	params := base64.StdEncoding.EncodeToString(ccInputRaw)
	t.Run("WithDiffReqId", func(t *testing.T) {
		reqStub.MockTransactionStart("mock-unlock")
		_, _, err := unlock(reqStub, "diffReqId", emCCName, "UpdateEmissionsWithToken", model.DataChaincodeInput{
			Keys:   []string{"uuid-1", "uuid-2"},
			Params: params,
		})
		reqStub.MockTransactionEnd("mock-unlock")
		is.Error(err)
	})

	t.Run("NotLocked", func(t *testing.T) {
		reqStub.MockTransactionStart("mock-unlock")
		_, _, err := unlock(reqStub, reqId, emCCName, "UpdateEmissionsWithToken", model.DataChaincodeInput{
			Keys:   []string{"uuid-3"},
			Params: params,
		})
		reqStub.MockTransactionEnd("mock-unlock")
		is.Error(err)
	})

	t.Run("InvalidResponseFromDataCC", func(t *testing.T) {
		reqStub.MockTransactionStart("mock-unlock")
		_, _, err := unlock(reqStub, reqId, emCCName, "UpdateEmissionsWithToken", model.DataChaincodeInput{
			Keys:   []string{"uuid-7"},
			Params: params,
		})
		reqStub.MockTransactionEnd("mock-unlock")
		is.Error(err)
	})
}
