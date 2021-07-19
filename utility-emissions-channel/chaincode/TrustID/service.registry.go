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

func (cc *Chaincode) createServiceRegistry(stub shim.ChaincodeStubInterface, did string, service Service) (string, error) {
	log.Infof("[%s][%s][createIDRegistry] Create Service for did %s", CHANNEL_ENV, ServiceREGISTRY, did)
	bytes, err := stub.GetState(did)

	if bytes != nil {
		log.Errorf("[%s][%s][createServiceRegistry] The service already exists in registry", CHANNEL_ENV, ServiceREGISTRY)
		return "", errors.New(ERRORServiceExists)
	}
	idBytes, err := json.Marshal(service)

	if err != nil {
		log.Errorf("[%s][%s][createIDRegistry] Error parsing: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORParsingService + err.Error())
	}
	err = stub.PutState(did, idBytes)
	if err != nil {
		log.Errorf("[%s][%s][createIDRegistry] Error creating service: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORCreatingService + err.Error())
	}
	log.Infof("[%s][%s][createIDRegistry] Service created", CHANNEL_ENV, ServiceREGISTRY)

	return "Service created successfully", nil
}

func (cc *Chaincode) getServiceRegistry(stub shim.ChaincodeStubInterface, didService string) (*Service, error) {

	log.Infof("[%s][%s][getIDRegistry] Get Service for did %s", CHANNEL_ENV, ServiceREGISTRY, didService)
	idStored := Service{}
	idBytes, err := stub.GetState(didService)

	if len(idBytes) == 0 {
		log.Errorf("[%s][%s][getIDRegistry] The service doesn't exist", CHANNEL_ENV, ServiceREGISTRY)
		return nil, errors.New(ERRORServiceNotExists)
	}
	if err != nil {
		log.Errorf("[%s][%s][getIDRegistry] Error getting service: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return nil, errors.New(ERRORGetService + err.Error())
	}
	err = json.Unmarshal(idBytes, &idStored)
	log.Infof("[%s][%s][getIDRegistry] The service info is  %v", CHANNEL_ENV, ServiceREGISTRY, idStored)

	return &idStored, nil
}

// func (cc *Chaincode) getServiceRegistryNameAndAcess(stub shim.ChaincodeStubInterface, did string, didService string) (string, int, error) {

// 	log.Infof("[%s][%s][getServiceRegistryAcess] Get Service for did %s", ServiceREGISTRY, did)
// 	service, err := cc.getServiceRegistry(stub, didService)
// 	if err != nil {
// 		log.Errorf("[%s][%s][getServiceRegistryAcess] Error getting service: %v", ServiceREGISTRY, err.Error())

// 		return "", 0, errors.New("Error getting service" + err.Error())
// 	}
// 	access := service.Access[did]
// 	return service.Name, access, nil
// }

func (cc *Chaincode) updateRegistryAccess(stub shim.ChaincodeStubInterface, didController string, didService string, accessPolicy AccessPolicy) (string, error) {

	log.Infof("[%s][%s][updateRegistryAccess] Get Service for did %s", CHANNEL_ENV, ServiceREGISTRY, didService)
	service, err := cc.getServiceRegistry(stub, didService)
	if err != nil {
		log.Errorf("[%s][%s][updateRegistryAccess] Error getting service: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORGetService + err.Error())
	}
	if didController != service.Controller {
		log.Errorf("[%s][%s][updateRegistryAccess] User has not access to update Registry", CHANNEL_ENV, ServiceREGISTRY)
		return "", errors.New(ERRORUserAccess)
	}

	// service.Access[didAccess] = accessType
	service.updateAccess(accessPolicy)

	idBytes, err := json.Marshal(service)
	if err != nil {
		log.Errorf("[%s][%s][updateRegistryAccess] Error parsing: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORParsingData + err.Error())
	}
	err = stub.PutState(didService, idBytes)
	if err != nil {
		log.Errorf("[%s][%s][updateRegistryAccess] Error updating service: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORUpdService + err.Error())
	}
	return "Registry updated sucessfully", nil
}

func (cc *Chaincode) updateRegistry(stub shim.ChaincodeStubInterface, didController string, didService string, name string, channel string) (string, error) {

	log.Infof("[%s][%s][updateRegistry] Get Service for did %s", CHANNEL_ENV, ServiceREGISTRY, didService)
	service, err := cc.getServiceRegistry(stub, didService)
	if err != nil {
		log.Errorf("[%s][%s][updateRegistry] Error getting service: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORGetService + err.Error())
	}
	if didController != service.Controller {
		log.Errorf("[%s][%s][updateRegistry] User has not access to update Registry", CHANNEL_ENV, ServiceREGISTRY)
		return "", errors.New(ERRORUserAccess)
	}

	if name != "" {
		service.Name = name
	}
	if channel != "" {
		service.Channel = channel
	}

	idBytes, err := json.Marshal(service)
	if err != nil {
		log.Errorf("[%s][%s][updateRegistryAccess] Error parsing: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORParsingData + err.Error())
	}
	err = stub.PutState(didService, idBytes)
	if err != nil {
		log.Errorf("[%s][%s][updateRegistryAccess] Error updating service: %v", CHANNEL_ENV, ServiceREGISTRY, err.Error())
		return "", errors.New(ERRORUpdService + err.Error())
	}
	return "Registry updated sucessfully", nil
}

func (s *Service) updateAccess(newAccess AccessPolicy) {
	if newAccess.Policy == "" {
		s.Access = AccessPolicy{Policy: PublicPolicy}
		return
	}

	//TODO: Update a bit smarter.
	// If
	switch newAccess.Policy {
	case SameControllerPolicy:
		s.Access = newAccess
	case FineGrainedPolicy:
		// Update threshold if present
		s.Access.Threshold = newAccess.Threshold
		s.Access.Policy = newAccess.Policy
		// Update in service the keys that are present.
		for k, v := range newAccess.Registry {
			s.Access.Registry[k] = v
		}
	default:
		s.Access = AccessPolicy{Policy: PublicPolicy}
	}
}
