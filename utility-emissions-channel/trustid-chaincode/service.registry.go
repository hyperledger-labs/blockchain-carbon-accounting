/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "coren-identitycc/src/chaincode/log"
	"encoding/json"
	"errors"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

func (cc *Chaincode) createServiceRegistry(stub shim.ChaincodeStubInterface, did string, service Service) (string, error) {
	log.Infof("[%s][createIDRegistry] Create Service for did %s", ServiceREGISTRY, did)
	bytes, err := stub.GetState(did)

	if bytes != nil {
		log.Errorf("[%s][createServiceRegistry] The service already exists", ServiceREGISTRY)
		return "", errors.New("The service already exists in registry")
	}
	idBytes, err := json.Marshal(service)

	if err != nil {
		log.Errorf("[%s][createIDRegistry] Error parsing: %v", ServiceREGISTRY, err.Error())
		return "", errors.New("Error parsing when create ID Registry:" + err.Error())
	}
	err = stub.PutState(did, idBytes)
	if err != nil {
		log.Errorf("[%s][createIDRegistry] Error parsing: %v", ServiceREGISTRY, err.Error())
		return "", errors.New("Error storing in create ID Registry:" + err.Error())
	}
	log.Infof("[%s][createIDRegistry] Service created", ServiceREGISTRY)

	return "Service created successfully", nil
}

func (cc *Chaincode) getServiceRegistry(stub shim.ChaincodeStubInterface, didService string) (*Service, error) {

	log.Infof("[%s][getIDRegistry] Get Service for did %s", ServiceREGISTRY, didService)
	idStored := Service{}
	idBytes, err := stub.GetState(didService)

	if len(idBytes) == 0 {
		log.Errorf("[%s][getIDRegistry] The service doesn't exist", ServiceREGISTRY)
		return nil, errors.New("The service doesn't exist")
	}
	if err != nil {
		log.Errorf("[%s][getIDRegistry] Error getting service: %v", ServiceREGISTRY, err.Error())
		return nil, errors.New("Error getting service:" + err.Error())
	}
	err = json.Unmarshal(idBytes, &idStored)
	log.Infof("[%s][getIDRegistry] The service info is  %v", ServiceREGISTRY, idStored)

	return &idStored, nil
}

// func (cc *Chaincode) getServiceRegistryNameAndAcess(stub shim.ChaincodeStubInterface, did string, didService string) (string, int, error) {

// 	log.Infof("[%s][getServiceRegistryAcess] Get Service for did %s", ServiceREGISTRY, did)
// 	service, err := cc.getServiceRegistry(stub, didService)
// 	if err != nil {
// 		log.Errorf("[%s][getServiceRegistryAcess] Error getting service: %v", ServiceREGISTRY, err.Error())

// 		return "", 0, errors.New("Error getting service" + err.Error())
// 	}
// 	access := service.Access[did]
// 	return service.Name, access, nil
// }

func (cc *Chaincode) updateRegistryAccess(stub shim.ChaincodeStubInterface, didController string, didService string, accessPolicy AccessPolicy) (string, error) {

	log.Infof("[%s][updateRegistryAccess] Get Service for did %s", ServiceREGISTRY, didService)
	service, err := cc.getServiceRegistry(stub, didService)
	if err != nil {
		log.Errorf("[%s][updateRegistryAccess] Error getting service: %v", ServiceREGISTRY, err.Error())
		return "", errors.New("Error getting service in update" + err.Error())
	}
	if didController != service.Controller {
		log.Errorf("[%s][updateRegistryAccess] User has not access to update Registry")
		return "", errors.New("User has not access to update de service")
	}

	// service.Access[didAccess] = accessType
	service.updateAccess(accessPolicy)

	idBytes, err := json.Marshal(service)
	if err != nil {
		log.Errorf("[%s][updateRegistryAccess] Error parsing: %v", ServiceREGISTRY, err.Error())
		return "", errors.New("Error parsing" + err.Error())
	}
	err = stub.PutState(didService, idBytes)
	if err != nil {
		log.Errorf("[%s][updateRegistryAccess] Error updating service: %v", ServiceREGISTRY, err.Error())
		return "", errors.New("Error updating service" + err.Error())
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
