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

var ccErrorCode = "CC-01"

func (cc *Chaincode) createIDRegistry(stub shim.ChaincodeStubInterface, did string, identity Identity) (string, error) {
	log.Infof("[%s][%s][createIDRegistry] Create Identity for did %s", CHANNEL_ENV, IDREGISTRY, did)
	bytes, err := stub.GetState(did)

	if bytes != nil {
		log.Errorf("[%s][%s][createIDRegistry] The identity already exists", CHANNEL_ENV, IDREGISTRY)
		log.Errorf("[%s][%s][createIDRegistry] Return error", CHANNEL_ENV, IDREGISTRY)
		return "", errors.New(ERRORIDExists)
	}
	idBytes, err := json.Marshal(identity)
	if err != nil {
		log.Errorf("[%s][%s][createIDRegistry] Error parsing: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return "", errors.New(ERRORParsingID + err.Error())
	}

	err = stub.PutState(did, idBytes)
	if err != nil {
		log.Errorf("[%s][%s][createIDRegistry] Error storing: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return "", errors.New(ERRORStoringIdentity + err.Error())
	}
	log.Infof("[%s][%s][createIDRegistry] Indentity stored for did %s", CHANNEL_ENV, IDREGISTRY, did)

	return "", nil
}

func (cc *Chaincode) getIDRegistry(stub shim.ChaincodeStubInterface, did string) (*Identity, error) {

	log.Infof("[%s][%s][getIDRegistry] Get Identity for did %s", CHANNEL_ENV, IDREGISTRY, did)
	idStored := Identity{}
	idBytes, err := stub.GetState(did)
	if err != nil {
		log.Errorf("[%s][%s][getIDRegistry] Error getting identity: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return nil, errors.New(ERRORGetID + err.Error())
	}
	if idBytes == nil {
		log.Errorf("[%s][%s][getIDRegistry] Error the identity does not exist", CHANNEL_ENV, IDREGISTRY)
		log.Errorf("[%s][%s][getIDRegistry] Return error", CHANNEL_ENV, IDREGISTRY)
		return nil, errors.New(ERRORnotID)
	}
	err = json.Unmarshal(idBytes, &idStored)
	if err != nil {
		log.Errorf("[%s][%s][getIDRegistry] Error parsing identity: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return nil, errors.New(ERRORParsingID + err.Error())
	}
	log.Infof("[%s][%s][getIDRegistry] Get PublicKey for did %s", CHANNEL_ENV, IDREGISTRY, did)

	return &idStored, nil
}

func (cc *Chaincode) updateIDRegistry(stub shim.ChaincodeStubInterface, did string, didController string, access int) (string, error) {
	var identity *Identity
	identity, err := cc.getIDRegistry(stub, did)
	if err != nil {
		log.Errorf("[%s][%s][updateIDRegistry] Problem getting identity: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return "", errors.New(ERRORGetID + err.Error())
	}

	identity.Controller = didController
	identity.Access = access
	idBytes, err := json.Marshal(*identity)
	if err != nil {
		log.Errorf("[%s][%s][updateIDRegistry] Error parsing: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return "", errors.New(ERRORParsingID + err.Error())
	}
	err = stub.PutState(did, idBytes)
	if err != nil {
		log.Errorf("[%s][%s][updateIDRegistry] Error updating identity in ledger: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return "", errors.New(ERRORUpdatingID + err.Error())
	}
	log.Infof("[%s][%s][updateIDRegistry] Identity updated", CHANNEL_ENV, IDREGISTRY)
	return "", nil
}

func (cc *Chaincode) revokeIDRegistry(stub shim.ChaincodeStubInterface, did string, didController string) (string, error) {
	identity, err := cc.getIDRegistry(stub, did)
	if err != nil {
		log.Errorf("[%s][%s][revokeIDRegistry] %s: %v", CHANNEL_ENV, IDREGISTRY, ERRORGetID, err.Error())
		return "", errors.New(ERRORGetID + err.Error())
	}
	fmt.Printf(didController)
	if identity.Controller != didController {
		log.Errorf("[%s][%s][revokeIDRegistry] Error revoking Unauthorized, the did provided cannot revoke the identity", CHANNEL_ENV, IDREGISTRY)
		return "", errors.New(ERRORRevoke)
	}

	err = stub.DelState(did)
	if err != nil {
		log.Errorf("[%s][%s][revokeIDRegistry] Error deleting from ledger: %v", CHANNEL_ENV, IDREGISTRY, err.Error())
		return "", errors.New(ERRORRevokeLedger + err.Error())
	}
	log.Infof("[%s][%s][revokeIDRegistry] Identity revoked successfully", CHANNEL_ENV, IDREGISTRY)
	return "Identity revoked successfully", nil
}
