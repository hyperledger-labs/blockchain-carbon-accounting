package internal

import (
	"datalock/mock"
	"datalock/model"
	"datalock/pkg/logger"
	"encoding/base64"
	"encoding/json"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/stretchr/testify/assert"
)

func TestE2E(t *testing.T) {
	is := assert.New(t)
	logger.NewAppLogger("DEBUG")
	emCCName := "EmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	txStub := shimtest.NewMockStub("dataLockCC", &DataLockChaincode{})
	txStub.Invokables[emCCName] = emStub

	// starting tx processing
	// getValidEmissionsRecord
	// put minted token
	// end processing

	// start processing
	// update tokenID of records
	// end tx processing
	const txID = "txID-1"
	const mockID = "mockID"
	// 1.
	resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"startTransitionProcess", txID}))
	is.Equal(shim.OK, int(resp.Status))

	// 2.
	input := model.StageUpdateInput{
		TxID: txID,
		Name: "GetValidEmissions",
		DataLocks: map[string]model.DataChaincodeInput{
			emCCName: {
				Keys:   []string{"uuid-1", "uuid-2", "uuid-5"},
				Params: []string{"getValidEmissions", "uuid-1", "uuid-2", "uuid-5"},
			},
		},
		IsLast: false,
	}
	raw, _ := json.Marshal(input)
	resp = txStub.MockInvoke(mockID, stringArgsToByte(
		[]string{"stageUpdate", string(raw)},
	))
	var output model.StageUpdateOutput
	err := json.Unmarshal(resp.Payload, &output)
	is.NoError(err)
	{
		// check output
		is.NotNil(resp.Payload)
		raw, err = base64.StdEncoding.DecodeString(output.DataLocks[emCCName])
		is.NoError(err)
		var dataCCOutput []mock.Emissions
		json.Unmarshal(raw, &dataCCOutput)
		is.Len(dataCCOutput, 2)
	}
	{
		// check tx details
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"getTxDetails", txID}))
		var tx model.Transaction
		err = json.Unmarshal(resp.Payload, &tx)
		is.NoError(err)
		is.Equal(tx.State, model.TxStatePROCESSING)
		is.Equal(input.Name, tx.CurrentStage)
		data, ok := tx.StageData[input.Name]
		is.True(ok)
		_, ok = data.Output[emCCName]["validUUIDs"]
		is.True(ok)
	}

	// minting token
	// update tokenID
	tokenId := "0xTokenId"
	input = model.StageUpdateInput{
		TxID: txID,
		Name: "MintedEmissionsToken",
		Storage: map[string]string{
			"tokenID": tokenId,
		},
		IsLast: false,
	}
	raw, _ = json.Marshal(input)
	resp = txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
	{
		// check tx details
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"getTxDetails", txID}))
		var tx model.Transaction
		json.Unmarshal(resp.Payload, &tx)
		is.Equal(tx.CurrentStage, "MintedEmissionsToken")
	}

	resp = txStub.MockInvoke(mockID, stringArgsToByte([]string{"endTransitionProcess", txID}))
	is.Equal(shim.OK, int(resp.Status))

	resp = txStub.MockInvoke(mockID, stringArgsToByte([]string{"startTransitionProcess", txID}))
	is.Equal(shim.OK, int(resp.Status))
	var tx model.Transaction
	{
		json.Unmarshal(resp.Payload, &tx)
		is.Equal(tx.CurrentStage, "MintedEmissionsToken")
	}
	validUUIDsraw := tx.StageData["GetValidEmissions"].Output["EmissionsCC"]["validUUIDs"]
	var uuids []string
	{
		raw, err := base64.StdEncoding.DecodeString(validUUIDsraw)
		is.NoError(err)
		json.Unmarshal(raw, &uuids)
	}

	input = model.StageUpdateInput{
		TxID:   txID,
		Name:   "UpdateMintedTokenRecords",
		IsLast: true,
		DataFree: map[string]model.DataChaincodeInput{
			emCCName: {
				Keys:   uuids,
				Params: append([]string{"UpdateEmissionsWithToken", tokenId, "partyID"}, uuids...),
			},
		},
	}
	raw, _ = json.Marshal(input)
	resp = txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
	is.Equal(shim.OK, int(resp.Status))
}

func TestMethodFail(t *testing.T) {
	is := assert.New(t)
	logger.NewAppLogger("DEBUG")
	emCCName := "EmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	txStub := shimtest.NewMockStub("dataLockCC", &DataLockChaincode{})
	txStub.Invokables[emCCName] = emStub

	const txID = "txID-1"
	const mockID = "mockID"
	t.Run("init", func(t *testing.T) {
		resp := txStub.MockInit(mockID, stringArgsToByte([]string{"init"}))
		is.Equal(shim.OK, int(resp.Status))
	})
	t.Run("methodNotSupported", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"methodNotSupported"}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("endTxInvalidInput", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"endTransitionProcess"}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("txNotFound", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"endTransitionProcess", txID}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("startTxInvalidInput", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"startTransitionProcess"}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("startRunningProcess", func(t *testing.T) {
		txStub.MockTransactionStart(mockID)
		txState(txStub, txID, true)
		txStub.MockTransactionEnd(mockID)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"startTransitionProcess", txID}))
		is.Equal(shim.ERROR, int(resp.Status))
		// clear out state
	})
	t.Run("stageUpdateInvalidNumberOfInput", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate"}))
		is.Equal(shim.ERROR, int(resp.Status))
	})
	t.Run("stageUpdateInvalidInput", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", "not-a-json"}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("stageUpdate:txNotFound", func(t *testing.T) {
		input := model.StageUpdateInput{
			TxID: "not-found",
		}
		raw, _ := json.Marshal(input)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("stageUpdate:notProcessing", func(t *testing.T) {
		txStub.MockTransactionStart(mockID)
		txState(txStub, txID, false)
		txStub.MockTransactionEnd(mockID)
		input := model.StageUpdateInput{
			TxID: txID,
		}
		raw, _ := json.Marshal(input)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("stageUpdate:ccLockDataInput", func(t *testing.T) {
		txStub.MockTransactionStart(mockID)
		txState(txStub, txID, true)
		txStub.MockTransactionEnd(mockID)
		input := model.StageUpdateInput{
			TxID: txID,
			DataLocks: map[string]model.DataChaincodeInput{
				emCCName: {
					Keys:   []string{"uuid-1"},
					Params: []string{"methodNotFound"},
				},
			},
		}
		raw, _ := json.Marshal(input)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("stageUpdate:ccFreeDataInput", func(t *testing.T) {
		txStub.MockTransactionStart(mockID)
		txState(txStub, txID, true)
		txStub.MockTransactionEnd(mockID)
		input := model.StageUpdateInput{
			TxID: txID,
			DataFree: map[string]model.DataChaincodeInput{
				emCCName: {
					Keys:   []string{"uuid-1"},
					Params: []string{"methodNotFound"},
				},
			},
		}
		raw, _ := json.Marshal(input)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("stageUpdate:ccFreeDataInput-2", func(t *testing.T) {
		txStub.MockTransactionStart(mockID)
		putLockState(txStub, txID, emCCName, "uuid-1")
		txStub.MockTransactionEnd(mockID)
		input := model.StageUpdateInput{
			TxID: txID,
			Name: "stageUpdate:ccFreeDataInput-2",
			DataFree: map[string]model.DataChaincodeInput{
				emCCName: {
					Keys:   []string{"uuid-1"},
					Params: []string{"getValidEmissions", "uuid-1"},
				},
			},
			IsLast: true,
		}
		raw, _ := json.Marshal(input)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
		is.Equal(shim.OK, int(resp.Status))
	})

	t.Run("stageUpdate:Fineshed", func(t *testing.T) {
		input := model.StageUpdateInput{
			TxID: txID,
		}
		raw, _ := json.Marshal(input)
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"stageUpdate", string(raw)}))
		is.Equal(shim.ERROR, int(resp.Status))
	})

	t.Run("startFineshTx", func(t *testing.T) {
		resp := txStub.MockInvoke(mockID, stringArgsToByte([]string{"startTransitionProcess", txID}))
		is.Equal(shim.ERROR, int(resp.Status))

	})
}
