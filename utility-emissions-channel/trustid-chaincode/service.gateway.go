/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "coren-identitycc/src/chaincode/log"
	"encoding/json"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

func (cc *Chaincode) createServiceIdentity(stub shim.ChaincodeStubInterface, did string, args interface{}) (string, error) {
	var err error
	service := make(map[string]interface{})
	service = args.(map[string]interface{})

	log.Debugf("[%s][createServiceIdentity] Calling to registry", ServiceGATEWAY)
	log.Debugf("[%s][createServiceIdentity] ****The service store is %v", ServiceGATEWAY, args)

	serviceStore := Service{Name: service["name"].(string), Controller: did, Channel: service["channel"].(string)}
	access := AccessPolicy{}
	accessBt, _ := json.Marshal(service["access"])
	json.Unmarshal(accessBt, &access)
	serviceStore.updateAccess(access)

	res, err := cc.createServiceRegistry(stub, service["did"].(string), serviceStore)
	if err != nil {
		log.Errorf("[%s][createServiceIdentity] Error creating service in registry: %v", ServiceGATEWAY, err.Error())
		return "", err
	}

	log.Infof("[%s][createServiceIdentity] Everything went ok", ServiceGATEWAY)
	return res, nil

}
func (cc *Chaincode) updateServiceAccess(stub shim.ChaincodeStubInterface, did string, args interface{}) (string, error) {
	log.Infof("[%s][updateServiceAccess] Entry in updateServiceAccess", ServiceGATEWAY)

	service := make(map[string]interface{})
	service = args.(map[string]interface{})

	// m := make(map[string]interface{}) // parse access to interact
	access := AccessPolicy{}
	accessBt, _ := json.Marshal(service["access"])
	json.Unmarshal(accessBt, &access)
	// m = service["access"].(AccessPolicy)

	result, err := cc.updateRegistryAccess(stub, did, service["did"].(string), access)
	if err != nil {
		log.Errorf("[%s][updateServiceAccess] Error updating registry access: %v", ServiceGATEWAY, err.Error())
		log.Errorf("[%s][updateServiceAccess] Return error", ServiceGATEWAY)
		return "", err

	}
	log.Infof("[%s][updateServiceAccess] Update registry Ok", ServiceGATEWAY)

	return result, nil

}

func (cc *Chaincode) getServiceIdentity(stub shim.ChaincodeStubInterface, args interface{}) (string, error) {
	var err error
	servReq := make(map[string]interface{})
	servReq = args.(map[string]interface{})

	result, err := cc.getServiceRegistry(stub, servReq["did"].(string))

	if err != nil {
		log.Errorf("[%s][getServiceIdentity] Error getting registry access: %v", ServiceGATEWAY, err.Error())
		log.Errorf("[%s][getServiceIdentity] Return error", ServiceGATEWAY)
		return "", err

	}

	log.Infof("[%s][getServiceIdentity]Service to return Name: %s, Controller: %s, Access: %v", ServiceGATEWAY, result.Name, result.Controller, result.Access)
	serviceBytes, err := json.Marshal(*result)
	return string(serviceBytes), nil

}
