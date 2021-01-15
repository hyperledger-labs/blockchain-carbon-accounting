/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "coren-identitycc/src/chaincode/log"
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
	log.Infof("[%s][invoke] Invoke chaincode", proxyGateway)

	interact := make(map[string]interface{})
	interact = args.(map[string]interface{})

	if interact["did"] == nil {
		log.Errorf("[%s][invoke]*** Error calling service, no service DID Specified", proxyGateway)
		return "", errors.New("Error calling service, no service DID Specified")
	}

	log.Debugf("[%s][invoke] Check access to interact for did: %s  and service: %s", proxyGateway, userDID, interact["did"].(string))
	service, err := cc.getServiceRegistry(stub, interact["did"].(string))
	if err != nil {
		log.Errorf("[%s][invoke]*** Error calling service: ", err.Error())
		return "", err
	}
	ccName := service.Name
	channel := service.Channel

	log.Debugf("[%s][invoke] Access for did: %s  and service: %s", proxyGateway, userDID, interact["did"].(string))
	if err != nil {
		log.Errorf("[%s][invoke]*** Error calling service, problem getting service", err.Error())
		return "", err
	}

	if cc.hasAccess(stub, service, userDID) {
		log.Debugf("[%s][invoke] Did: %s has access to service %s, invoking cc", proxyGateway, userDID, interact["did"].(string))
		log.Debugf("[%s][invoke] Interact for chaincode %s args are  %v", proxyGateway, ccName, interact["args"])
		s := make([]string, len(interact["args"].([]interface{})))
		for i, v := range interact["args"].([]interface{}) {
			s[i] = fmt.Sprint(v)
		}
		s = append(s, userDID)
		argBytes := toChaincodeArgs(s...)
		response := stub.InvokeChaincode(ccName, argBytes, channel)
		if response.Status != shim.OK {
			log.Debugf("[%s][invoke] Error invoking chaincode %s", proxyGateway, response.Message)
			return "", errors.New(response.Message)
		}
		log.Debugf("[%s][invoke] Invoke OK, returning result", proxyGateway)
		log.Infof("%v", response.Payload)

		return string(response.Payload), nil
	}

	log.Errorf("[%s][invoke] User %s has not access to this resources", proxyGateway, userDID)
	err = errors.New("User has not access")
	return "", err

}

// hasAccess implements the logic to determine if a user
// has access to a service
func (cc *Chaincode) hasAccess(stub shim.ChaincodeStubInterface, service *Service, userDid string) bool {
	idReturn, err := cc.getIDRegistry(stub, userDid)
	if err != nil {
		log.Errorf("[%s][checkAccess] Error getting access policy %s ", proxyGateway, userDid)
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
