/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "TrustID/fabric-chaincode/log"
	"encoding/json"
	"errors"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

func (cc *Chaincode) createServiceIdentity(stub shim.ChaincodeStubInterface, did string, args interface{}) (string, error) {
	var err error
	service := make(map[string]interface{})
	service = args.(map[string]interface{})

	log.Debugf("[%s][%s][createServiceIdentity] Calling to registry", CHANNEL_ENV, ServiceGATEWAY)
	log.Debugf("[%s][%s][createServiceIdentity] ****The service store is %v", CHANNEL_ENV, ServiceGATEWAY, args)

	if service["name"] == nil {
		log.Errorf("[%s][%s][getIdencreateServiceIdentitytity] Error creating service in registry: %v", CHANNEL_ENV, ServiceGATEWAY, "Name input param is undefined")
		return "", errors.New("Name input param is undefined")
	}
	if service["channel"] == nil {
		log.Errorf("[%s][%s][createServiceIdentity] Error creating service in registry: %v", CHANNEL_ENV, ServiceGATEWAY, "Channel input param is undefined")
		return "", errors.New("Channel input param is undefined")
	}
	if service["did"] == nil {
		log.Errorf("[%s][%s][createServiceIdentity] Error creating service in registry: %v", CHANNEL_ENV, ServiceGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	serviceStore := Service{Name: service["name"].(string), Controller: did, Channel: service["channel"].(string)}
	access := AccessPolicy{}
	accessBt, _ := json.Marshal(service["accessPolicy"])
	json.Unmarshal(accessBt, &access)
	serviceStore.updateAccess(access)

	res, err := cc.createServiceRegistry(stub, service["did"].(string), serviceStore)
	if err != nil {
		log.Errorf("[%s][%s][createServiceIdentity] Error creating service in registry: %v", CHANNEL_ENV, ServiceGATEWAY, err.Error())
		return "", err
	}

	log.Infof("[%s][%s][createServiceIdentity] Everything went ok", CHANNEL_ENV, ServiceGATEWAY)
	return res, nil

}
func (cc *Chaincode) updateServiceAccess(stub shim.ChaincodeStubInterface, did string, args interface{}) (string, error) {
	log.Infof("[%s][%s][updateServiceAccess] Entry in updateServiceAccess", CHANNEL_ENV, ServiceGATEWAY)

	service := make(map[string]interface{})
	service = args.(map[string]interface{})

	if service["did"] == nil {
		log.Errorf("[%s][%s][updateServiceAccess] Error creating service in registry: %v", CHANNEL_ENV, ServiceGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	// m := make(map[string]interface{}) // parse access to interact
	access := AccessPolicy{}
	accessBt, _ := json.Marshal(service["access"])
	json.Unmarshal(accessBt, &access)
	// m = service["access"].(AccessPolicy)

	result, err := cc.updateRegistryAccess(stub, did, service["did"].(string), access)
	if err != nil {
		log.Errorf("[%s][%s][updateServiceAccess] Error updating registry access: %v", CHANNEL_ENV, ServiceGATEWAY, err.Error())
		log.Errorf("[%s][%s][updateServiceAccess] Return error", CHANNEL_ENV, ServiceGATEWAY)
		return "", err

	}
	log.Infof("[%s][%s][updateServiceAccess] Update registry Ok", CHANNEL_ENV, ServiceGATEWAY)
	return result, nil

}

func (cc *Chaincode) updateService(stub shim.ChaincodeStubInterface, did string, args interface{}) (string, error) {
	log.Infof("[%s][%s][updateService] Entry in updateService", CHANNEL_ENV, ServiceGATEWAY)

	service := make(map[string]interface{})
	service = args.(map[string]interface{})

	if service["did"] == nil {
		log.Errorf("[%s][%s][updateService] Error updating service : %v", CHANNEL_ENV, ServiceGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	// m := make(map[string]interface{}) // parse access to interact
	channel := ""
	name := ""
	if service["channel"] != nil {
		channel = service["channel"].(string)
	}
	if service["name"] != nil {
		name = service["name"].(string)
	}

	result, err := cc.updateRegistry(stub, did, service["did"].(string), name, channel)
	if err != nil {
		log.Errorf("[%s][%s][updateService] Error updating registry access: %v", CHANNEL_ENV, ServiceGATEWAY, err.Error())
		log.Errorf("[%s][%s][updateService] Return error", CHANNEL_ENV, ServiceGATEWAY)
		return "", err

	}
	log.Infof("[%s][%s][updateService] Update registry Ok", CHANNEL_ENV, ServiceGATEWAY)
	return result, nil

}

func (cc *Chaincode) getServiceIdentity(stub shim.ChaincodeStubInterface, args interface{}) (string, error) {
	var err error
	service := make(map[string]interface{})
	service = args.(map[string]interface{})

	if service["did"] == nil {
		log.Errorf("[%s][%s][getServiceIdentity] Error creating service in registry: %v", CHANNEL_ENV, ServiceGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	result, err := cc.getServiceRegistry(stub, service["did"].(string))

	if err != nil {
		log.Errorf("[%s][%s][getServiceIdentity] Error getting registry access: %v", CHANNEL_ENV, ServiceGATEWAY, err.Error())
		log.Errorf("[%s][%s][getServiceIdentity] Return error", CHANNEL_ENV, ServiceGATEWAY)
		return "", err

	}

	log.Infof("[%s][%s][getServiceIdentity]Service to return Name: %s, Controller: %s, Access: %v", CHANNEL_ENV, ServiceGATEWAY, result.Name, result.Controller, result.Access)
	serviceBytes, err := json.Marshal(*result)
	return string(serviceBytes), nil

}
