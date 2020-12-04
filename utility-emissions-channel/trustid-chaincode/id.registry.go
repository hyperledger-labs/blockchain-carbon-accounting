/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "coren-identitycc/src/chaincode/log"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
)

var ccErrorCode = "CC-01"

func (cc *Chaincode) createIDRegistry(stub shim.ChaincodeStubInterface, did string, identity Identity) (string, error) {
	log.Infof("[%s][createIDRegistry] Create Identity for did %s", IDREGISTRY, did)
	bytes, err := stub.GetState(did)

	if bytes != nil {
		log.Errorf("[%s][createIDRegistry] The identity already exists", IDREGISTRY)
		log.Errorf("[%s][createIDRegistry] Return error", IDREGISTRY)
		return "", errors.New("Error creating ID in registry. The identity already exists")
	}
	idBytes, err := json.Marshal(identity)
	if err != nil {
		log.Errorf("[%s][createIDRegistry] Error parsing: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error parsing identity:" + err.Error())
	}

	err = stub.PutState(did, idBytes)
	if err != nil {
		log.Errorf("[%s][createIDRegistry] Error parsing: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error storing identity:" + err.Error())
	}
	log.Infof("[%s][createIDRegistry] Indentity stored for did %s", IDREGISTRY, did)

	return "", nil
}

func (cc *Chaincode) getIDRegistry(stub shim.ChaincodeStubInterface, did string) (*Identity, error) {

	log.Infof("[%s][getIDRegistry] Get Identity for did %s", IDREGISTRY, did)
	idStored := Identity{}
	idBytes, err := stub.GetState(did)
	if err != nil {
		log.Errorf("[%s][getIDRegistry] Error getting identity: %v", IDREGISTRY, err.Error())
		return nil, errors.New("Error getting identity:" + err.Error())
	}
	if idBytes == nil {
		log.Errorf("[%s][getIDRegistry] The identity doesn't exist", IDREGISTRY)
		log.Errorf("[%s][getIDRegistry] Return error", IDREGISTRY)
		return nil, errors.New("The identity doesn't exist")
	}
	err = json.Unmarshal(idBytes, &idStored)
	if err != nil {
		log.Errorf("[%s][getIDRegistry] Error parsing identity: %v", IDREGISTRY, err.Error())
		return nil, errors.New("Error parsing" + err.Error())
	}
	log.Infof("[%s][getIDRegistry] Get PublicKey for did %s", IDREGISTRY, did)

	return &idStored, nil
}

func (cc *Chaincode) updateIDRegistry(stub shim.ChaincodeStubInterface, did string, didController string, access int) (string, error) {
	var identity *Identity
	identity, err := cc.getIDRegistry(stub, did)
	if err != nil {
		log.Errorf("[%s][updateIDRegistry] Problem getting identity: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error getting identity: " + err.Error())
	}

	identity.Controller = didController
	identity.Access = access
	idBytes, err := json.Marshal(*identity)
	if err != nil {
		log.Errorf("[%s][updateIDRegistry] Error parsing: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error parsing when update" + err.Error())
	}
	err = stub.PutState(did, idBytes)
	if err != nil {
		log.Errorf("[%s][updateIDRegistry] Error parsing: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error updating in the ledger" + err.Error())
	}
	log.Infof("[%s][updateIDRegistry] Identity updated", IDREGISTRY)

	return "", nil
}

func (cc *Chaincode) revokeIDRegistry(stub shim.ChaincodeStubInterface, did string, didController string) (string, error) {
	identity, err := cc.getIDRegistry(stub, did)
	if err != nil {
		log.Errorf("[%s][revokeIDRegistry] Problem checking identity: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error in revoke: " + err.Error())
	}
	fmt.Printf(didController)
	if identity.Controller != didController {
		err := errors.New("Unauthorized: The did provided has not access to revoke the identity")
		log.Errorf("[%s][revokeIDRegistry] This is not the identity controller: %v", IDREGISTRY, err.Error())

		return "", errors.New("Error revoking the did provided cannot revoke the identity")
	}

	err = stub.DelState(did)
	if err != nil {
		log.Errorf("[%s][revokeIDRegistry] Error parsing: %v", IDREGISTRY, err.Error())
		return "", errors.New("Error deleting from ledger" + err.Error())
	}
	log.Infof("[%s][revokeIDRegistry] Identity revoked successfully", IDREGISTRY)

	return "Identity revoked successfully", nil
}
