package manager

import (
	"encoding/json"
	"fmt"
	"request/manager/log"
	"request/manager/model"
	"strings"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
)

func stageUpdate(stub shim.ChaincodeStubInterface, in []byte) peer.Response {
	var input model.StageUpdateInput
	err := json.Unmarshal(in, &input)
	if err != nil {
		log.Infof("%s :: error = %v", errBadRequest, err)
		return shim.Error("bad stageUpdate json input")
	}
	log.Debugf("input = %+v", input)

	//
	log.Debugf("get request with id = %s", input.RequestId)
	raw, err := stub.GetState(input.RequestId)
	if err != nil {
		log.Infof("%s :: key = %s", errGettingState, input.RequestId)
		return shim.Error(err.Error())
	}

	log.Debugf("validating input")
	err = stageUpdateInputCheck(&input, len(raw) != 0)
	if err != nil {
		log.Infof("%s :: error = %s", errValidatingInput, err.Error())
		return shim.Error(err.Error())
	}

	log.Debug("get caller's msp and commonName")
	mspId, commonName, err := getCaller(stub)
	if err != nil {
		log.Infof("%s :: error = %s", errGettingCaller, err.Error())
		return shim.Error(err.Error())
	}
	var request model.Request
	if len(raw) == 0 {
		log.Debugf("request not found, considering %s as first stage", input.Name)
		timestamp, err := stub.GetTxTimestamp()
		if err != nil {
			log.Info(err.Error())
			return shim.Error(err.Error())
		}
		request = model.Request{
			ID:         input.RequestId,
			State:      model.RequestStatePROCESSING,
			CallerType: input.CallerType,
			CreatedAt:  timestamp.Seconds,
			StageData:  map[string]*model.StageData{},
		}
		if input.CallerType == model.RequestCallerTypeCLIENT {
			request.CallerID = fmt.Sprintf("%s::%s", mspId, commonName)
		} else if input.CallerType == model.RequestCallerTypeMSP {
			request.CallerID = mspId
		} else {
			log.Info("only CLIENT and MSP as callerType are supported")
			return shim.Error("only CLIENT and MSP as callerType are supported")
		}
	} else {
		json.Unmarshal(raw, &request)
		if request.CallerType == model.RequestCallerTypeCLIENT && request.CallerID != fmt.Sprintf("%s::%s", mspId, commonName) {
			log.Infof("wrong caller, only client can update request")
			return shim.Error("wrong caller, only client can update request")
		} else if request.CallerType == model.RequestCallerTypeMSP && request.CallerID != mspId {
			log.Infof("wrong caller, only organization can update request")
			return shim.Error("wrong caller, only organization can update request")
		}

		if request.State == model.RequestStateFINISHED {
			log.Infof("%s is already in FINISHED state", input.RequestId)
			return shim.Error(fmt.Sprintf("%s is already in FINISHED state", input.RequestId))
		}
	}

	request.CurrentStageName = input.Name
	request.CurrentStageState = input.StageState
	//
	output := model.StageUpdateOutput{
		FabricDataLocks: map[string]string{},
		FabricDataFree:  map[string]string{},
	}
	log.Debug("executing data lock opeartion")
	for ccName, ccInput := range input.FabricDataLocks {
		log.Debugf("chaincode = %s", ccName)
		toStore, toClient, err := lock(stub, input.RequestId, ccName, ccInput.MethodName, ccInput.Input)
		if err != nil {
			log.Info(err.Error())
			return shim.Error(err.Error())
		}
		if len(toClient) != 0 {
			output.FabricDataLocks[ccName] = toClient
		}
		if len(toStore) != 0 {
			data, ok := request.StageData[input.Name]
			if !ok {
				data = &model.StageData{
					BlockchainData: []model.BlockchainData{},
					Outputs:        map[string]map[string]string{},
				}
				request.StageData[input.Name] = data
			}
			data.Outputs[ccName] = toStore
		}

	}
	log.Debug("executing data freeing opeartion")
	for ccName, ccInput := range input.FabricDataFree {
		log.Debugf("chaincode = %s", ccName)
		toStore, toClient, err := unlock(stub, input.RequestId, ccName, ccInput.MethodName, ccInput.Input)
		if err != nil {
			log.Info(err.Error())
			return shim.Error(err.Error())
		}
		if len(toClient) != 0 {
			output.FabricDataFree[ccName] = toClient
		}
		if len(toStore) != 0 {
			data, ok := request.StageData[input.Name]
			if !ok {
				data = &model.StageData{
					BlockchainData: []model.BlockchainData{},
					Outputs:        map[string]map[string]string{},
				}
				request.StageData[input.Name] = data
			}
			data.Outputs[ccName] = toStore
		}
	}
	for _, data := range input.BlockchainData {
		stageData, ok := request.StageData[input.Name]
		if !ok {
			stageData = &model.StageData{
				BlockchainData: []model.BlockchainData{},
				Outputs:        map[string]map[string]string{},
			}
			request.StageData[input.Name] = stageData
		}
		stageData.BlockchainData = append(stageData.BlockchainData, data)
	}

	if input.StageState == "FINISHED" && input.IsLast {
		request.State = model.RequestStateFINISHED
	}
	raw, _ = json.Marshal(request)
	err = stub.PutState(input.RequestId, raw)
	if err != nil {
		log.Infof("%s :: key = %s", errPuttingState, request.ID)
		return shim.Error(err.Error())
	}
	raw, _ = json.Marshal(output)
	return shim.Success(raw)
}

func getRequest(stub shim.ChaincodeStubInterface, in []byte) peer.Response {
	reqId := string(in)
	log.Debugf("fetching request having requestId = %s", reqId)
	raw, err := stub.GetState(reqId)
	if err != nil {
		log.Infof("%s :: key = %s , error = %s", errGettingState, reqId, err.Error())
		return shim.Error(err.Error())
	}
	if len(raw) == 0 {
		log.Debug("request not found")
		return shim.Error("request not found")
	}
	return shim.Success(raw)
}

func getAllLocksForReq(stub shim.ChaincodeStubInterface, in []byte) peer.Response {
	reqId := string(in)
	log.Debugf("featching all locks place by request %s", reqId)
	locks, err := getAllLockState(stub, reqId)
	if err != nil {
		log.Info(err.Error())
		return shim.Error(err.Error())
	}
	out := make([]model.FabricDataLocks, len(locks))
	for i, lockId := range locks {
		tmp := strings.Split(lockId, "::")
		out[i] = model.FabricDataLocks{
			Chaincode: tmp[0],
			Key:       tmp[1],
		}
	}
	raw, _ := json.Marshal(out)
	return shim.Success(raw)
}

func stageUpdateInputCheck(i *model.StageUpdateInput, exists bool) error {
	if len(strings.TrimSpace(i.RequestId)) == 0 {
		return fmt.Errorf("require non empty requestId")
	}
	if len(strings.TrimSpace(i.Name)) == 0 {
		return fmt.Errorf("require non empty stage name")
	}
	if len(strings.TrimSpace(i.StageState)) == 0 {
		return fmt.Errorf("require non empty stageState")
	}
	if !exists && len(strings.TrimSpace(string(i.CallerType))) == 0 {
		return fmt.Errorf("require non empty callerType for first stage")
	}
	return nil
}
