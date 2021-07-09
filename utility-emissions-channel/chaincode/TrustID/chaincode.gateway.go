/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "TrustID/fabric-chaincode/log"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

var proxyGateway = "ProxyGateway"

func toChaincodeArgs(args ...string) [][]byte {
	ccArgs := make([][]byte, len(args))
	for i, a := range args {
		ccArgs[i] = []byte(a)
	}
	return ccArgs
}

func (cc *Chaincode) invoke(stub shim.ChaincodeStubInterface, userDID string, args interface{}) (string, error) {
	log.Infof("[%s][%s][invoke] Invoke chaincode", CHANNEL_ENV, proxyGateway)

	interact := make(map[string]interface{})
	interact = args.(map[string]interface{})

	if interact["did"] == nil {
		log.Errorf("[%s][%s][invoke] %s", CHANNEL_ENV, ERRORDidMissing, proxyGateway)
		return "", errors.New(ERRORDidMissing)
	}

	log.Debugf("[%s][%s][invoke] Check access to interact for did: %s  and service: %s", CHANNEL_ENV, proxyGateway, userDID, interact["did"].(string))
	service, err := cc.getServiceRegistry(stub, interact["did"].(string))
	if err != nil {
		log.Errorf("[%s][%s][invoke] Error calling service: ", CHANNEL_ENV, err.Error())
		return "", err
	}
	ccName := service.Name
	channel := service.Channel

	log.Debugf("[%s][%s][invoke] Access for did: %s  and service: %s", CHANNEL_ENV, proxyGateway, userDID, interact["did"].(string))
	if err != nil {
		log.Errorf("[%s][%s][invoke] Error calling service, problem getting service %v", CHANNEL_ENV, proxyGateway, err.Error())
		return "", err
	}

	if cc.hasAccess(stub, service, userDID) {
		log.Debugf("[%s][%s][invoke] Did: %s has access to service %s, invoking cc", CHANNEL_ENV, proxyGateway, userDID, interact["did"].(string))
		log.Debugf("[%s][%s][invoke] Interact for chaincode %s args are  %v", CHANNEL_ENV, proxyGateway, ccName, interact["args"])
		s := make([]string, len(interact["args"].([]interface{})))
		for i, v := range interact["args"].([]interface{}) {
			s[i] = fmt.Sprint(v)
		}
		s = append(s, userDID)
		argBytes := toChaincodeArgs(s...)
		response := stub.InvokeChaincode(ccName, argBytes, channel)
		if response.Status != shim.OK {
			log.Debugf("[%s][%s][invoke] Error invoking chaincode %s", CHANNEL_ENV, proxyGateway, response.Message)
			return "", errors.New(response.Message)
		}
		log.Debugf("[%s][%s][invoke] Invoke OK, returning result", CHANNEL_ENV, proxyGateway)
		log.Infof("[%s][%s][invoke] Invoke received result: %v", CHANNEL_ENV, proxyGateway, string(response.Payload))
		event := Event{}
		payload := map[string]interface{}{}
		_ = json.Unmarshal(response.Payload, &payload)
		if payload["event"] != nil {
			eventBytes, _ := json.Marshal(payload["event"])
			err := json.Unmarshal(eventBytes, &event)
			log.Debugf("event: %v \n", event)

			// Here we insert the payload along with the serviceDID & transaction ID
			eventPayload := map[string]interface{}{}
			err = json.Unmarshal(event.Payload, &eventPayload)
			eventBis := map[string]interface{}{"message": eventPayload, "did": interact["did"], "txId": stub.GetTxID()}
			eventBytesBis, _ := json.Marshal(eventBis)

			// Emit the event
			err = stub.SetEvent(event.EventName, []byte(eventBytesBis))
			if err != nil {
				log.Errorf(" ERROR  Fail to set event" + err.Error())
			}

			responseBytes, _ := json.Marshal(payload["response"])
			return string(responseBytes), nil
		} else {
			return string(response.Payload), nil
		}
	}

	log.Errorf("[%s][%s][invoke] User %s has not access to this resources", CHANNEL_ENV, proxyGateway, userDID)
	err = errors.New(ERRORUserAccess)
	return "", err

}

// hasAccess implements the logic to determine if a user
// has access to a service
func (cc *Chaincode) hasAccess(stub shim.ChaincodeStubInterface, service *Service, userDid string) bool {
	idReturn, err := cc.getIDRegistry(stub, userDid)
	if err != nil {
		log.Errorf("[%s][%s][checkAccess] Error getting access policy %s ", CHANNEL_ENV, proxyGateway, userDid)
		return false
	}
	switch service.Access.Policy {
	case PublicPolicy:
		return true
	case SameControllerPolicy:
		if service.Controller == idReturn.Controller {
			return true
		}
	case FineGrainedPolicy:
		userLevel := service.Access.Registry[userDid]
		if userLevel >= service.Access.Threshold {
			return true
		}
	}
	return false
}
