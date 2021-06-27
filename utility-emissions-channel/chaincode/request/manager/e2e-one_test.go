package manager

import (
	"encoding/base64"
	"encoding/json"
	"reflect"
	"request/manager/model"
	"request/mock"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/stretchr/testify/assert"
)

func TestE2EOne(t *testing.T) {
	is := assert.New(t)

	emCCName := "UtilityEmissionsCC"
	emStub := shimtest.NewMockStub(emCCName, mock.MockEmissionsCC{})
	loadMockEmissions(emStub)

	reqCCName := "RequestManagerCC"
	cc := new(RequestManagerChaincode)
	cc.ConfigureChaincode()
	reqStub := shimtest.NewMockStub(reqCCName, cc)

	reqStub.Invokables[emCCName] = emStub
	////////////////////////////////////////////////////////////////////////////
	reqId := "reqId-1"

	t.Run("Stage-1::GET_VALID_EMISSIONS", func(t *testing.T) {
		setCaller(reqStub, user1)
		stageName := "GET_VALID_EMISSIONS"
		input := model.StageUpdateInput{
			RequestId:  reqId,
			Name:       stageName,
			StageState: "FINISHED",
			CallerType: model.RequestCallerTypeCLIENT,
			FabricDataLocks: map[string]model.RequestDataChaincodeInput{
				emCCName: {
					MethodName: "getValidEmissions",
					Input: model.DataChaincodeInput{
						Keys: []string{"uuid-1", "uuid-3", "uuid-5"},
					},
				},
			},
		}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.OK), resp.GetStatus())

		// check output
		var stageOutput model.StageUpdateOutput
		err := json.Unmarshal(resp.GetPayload(), &stageOutput)
		is.NoError(err)
		is.Len(stageOutput.FabricDataFree, 0)

		base64Raw, ok := stageOutput.FabricDataLocks[emCCName]
		is.True(ok)
		raw, err = base64.StdEncoding.DecodeString(base64Raw)
		is.NoError(err)
		var emissions []mock.Emissions
		err = json.Unmarshal(raw, &emissions)
		is.NoError(err)
		is.Len(emissions, 2)

		// worldstate check
		raw, ok = reqStub.State[reqId]
		is.True(ok)
		var request model.Request
		err = json.Unmarshal(raw, &request)
		is.NoError(err)

		is.Equal(reqId, request.ID)
		is.Equal("CLIENT", string(request.CallerType))
		is.Equal("auditor1::user1", request.CallerID)
		is.Equal("PROCESSING", string(request.State))
		is.Equal(stageName, request.CurrentStageName)
		is.Equal("FINISHED", request.CurrentStageState)
		stageData, ok := request.StageData[stageName]
		is.True(ok)
		is.Len(stageData.BlockchainData, 0)
		data, ok := stageData.Outputs[emCCName]
		is.True(ok)
		validUUIdsBase64, ok := data["validUUIDs"]
		is.True(ok)
		raw, err = base64.StdEncoding.DecodeString(validUUIdsBase64)
		is.NoError(err)
		var validUUIDs []string
		err = json.Unmarshal(raw, &validUUIDs)
		is.NoError(err)
		is.True(reflect.DeepEqual([]string{"uuid-1", "uuid-3"}, validUUIDs))
	})

	t.Run("BadRequestObject", func(t *testing.T) {
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), {0x00}})
		is.Equal(int32(shim.ERROR), resp.GetStatus())
		is.Equal("bad stageUpdate json input", resp.GetMessage())
	})

	t.Run("InvalidInput", func(t *testing.T) {
		input := model.StageUpdateInput{}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.ERROR), resp.GetStatus())
	})

	t.Run("InvalidCaller", func(t *testing.T) {
		reqStub.Creator = []byte{0x00}
		input := model.StageUpdateInput{
			RequestId:  reqId,
			Name:       "stageName",
			StageState: "FINISHED",
		}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.ERROR), resp.GetStatus())
	})

	t.Run("DiffCaller", func(t *testing.T) {
		setCaller(reqStub, auditor2admin)
		input := model.StageUpdateInput{
			RequestId:  reqId,
			Name:       "stageName",
			StageState: "FINISHED",
		}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.ERROR), resp.GetStatus())
		is.Equal("wrong caller, only client can update request", resp.GetMessage())
	})

	t.Run("Stage-2:STORE_MINTED_TOKEN", func(t *testing.T) {
		stageName := "STORE_MINTED_TOKEN"
		setCaller(reqStub, user1)
		input := model.StageUpdateInput{
			RequestId:  reqId,
			Name:       stageName,
			StageState: "FINISHED",
			BlockchainData: []model.BlockchainData{
				{
					Network:         "Ethereum",
					ContractAddress: "0x123456789",
					KeysCreated: map[string]string{
						"MintedTokenId": "1",
					},
				},
			},
		}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.OK), resp.GetStatus())

		// output check
		var output model.StageUpdateOutput
		err := json.Unmarshal(resp.GetPayload(), &output)
		is.NoError(err)
		is.Len(output.FabricDataLocks, 0)
		is.Len(output.FabricDataFree, 0)

		// worldstate check
		raw, ok := reqStub.State[reqId]
		is.True(ok)
		var request model.Request
		err = json.Unmarshal(raw, &request)
		is.NoError(err)

		is.Equal(stageName, request.CurrentStageName)
		is.Equal("FINISHED", request.CurrentStageState)
		stageData, ok := request.StageData[stageName]
		is.True(ok)
		is.Len(stageData.BlockchainData, 1)
		bcData := stageData.BlockchainData[0]
		is.Equal("Ethereum", bcData.Network)
		is.Equal("0x123456789", bcData.ContractAddress)
		is.Equal("1", bcData.KeysCreated["MintedTokenId"])
	})

	t.Run("Stage-3:UPDATE_EMISSIONS_WITH_TOKEN", func(t *testing.T) {
		stageName := "UPDATE_EMISSIONS_WITH_TOKEN"
		setCaller(reqStub, user1)
		rawParams, _ := json.Marshal(mock.UpdateEmissionsMintedTokenParams{
			TokenId: "tokenId",
			PartyId: "partyid",
		})
		input := model.StageUpdateInput{
			RequestId:  reqId,
			Name:       stageName,
			StageState: "FINISHED",
			IsLast:     true,
			FabricDataFree: map[string]model.RequestDataChaincodeInput{
				emCCName: {
					MethodName: "UpdateEmissionsWithToken",
					Input: model.DataChaincodeInput{
						Keys:   []string{"uuid-3", "uuid-1"},
						Params: base64.StdEncoding.EncodeToString(rawParams),
					},
				},
			},
		}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.OK), resp.GetStatus())

		// output check
		var output model.StageUpdateOutput
		err := json.Unmarshal(resp.GetPayload(), &output)
		is.NoError(err)
		is.Len(output.FabricDataLocks, 0)
		is.Len(output.FabricDataFree, 0)

		// worldstate check
		raw, ok := reqStub.State[reqId]
		is.True(ok)
		var request model.Request
		err = json.Unmarshal(raw, &request)
		is.NoError(err)

		is.Equal(stageName, request.CurrentStageName)
		is.Equal("FINISHED", request.CurrentStageState)
		is.Equal(model.RequestStateFINISHED, request.State)
		_, ok = reqStub.State["UtilityEmissionsCC::uuid-1"]
		is.False(ok)
		_, ok = reqStub.State["UtilityEmissionsCC::uuid-3"]
		is.False(ok)

	})

	t.Run("FinishedRequest", func(t *testing.T) {
		input := model.StageUpdateInput{
			RequestId:  reqId,
			Name:       "stageName",
			StageState: "FINISHED",
			IsLast:     true,
		}
		raw, _ := json.Marshal(input)
		resp := reqStub.MockInvoke("stage-1", [][]byte{[]byte("stageUpdate"), raw})
		is.Equal(int32(shim.ERROR), resp.GetStatus())
		is.Equal("reqId-1 is already in FINISHED state", resp.GetMessage())
	})
}

func TestStageUpdateInputCheck(t *testing.T) {
	is := assert.New(t)

	t.Run("RequestId", func(t *testing.T) {
		input := model.StageUpdateInput{
			Name:       "StageName",
			StageState: "StageState",
			CallerType: "CallerType",
		}
		err := stageUpdateInputCheck(&input, true)
		is.Error(err)
		is.Equal("require non empty requestId", err.Error())
	})

	t.Run("Name", func(t *testing.T) {
		input := model.StageUpdateInput{
			RequestId:  "RequestId",
			StageState: "StageState",
			CallerType: "CallerType",
		}
		err := stageUpdateInputCheck(&input, true)
		is.Error(err)
		is.Equal("require non empty stage name", err.Error())
	})

	t.Run("StageState", func(t *testing.T) {
		input := model.StageUpdateInput{
			RequestId:  "RequestId",
			Name:       "StageName",
			CallerType: "CallerType",
		}
		err := stageUpdateInputCheck(&input, true)
		is.Error(err)
		is.Equal("require non empty stageState", err.Error())
	})

	t.Run("CallerType", func(t *testing.T) {
		input := model.StageUpdateInput{
			RequestId:  "RequestId",
			Name:       "StageName",
			StageState: "StageState",
		}
		err := stageUpdateInputCheck(&input, false)
		is.Error(err)
		is.Equal("require non empty callerType for first stage", err.Error())
	})
}
