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

func (cc *Chaincode) getIdentity(stub shim.ChaincodeStubInterface, did string, identity *Identity, args interface{}) (string, error) {
	log.Infof("[%s][getIdentity] Get Identity", IDGATEWAY)
	var idReturn *Identity
	var err error
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	log.Infof("[%s][verifyIdentity] Get Identity %v", IDGATEWAY, idReq["did"].(string))
	if idReq["did"].(string) != did {
		idReturn, err = cc.getIDRegistry(stub, idReq["did"].(string))
		if err != nil {
			log.Errorf("[%s][getIdentity] Problem getting identity: %v", IDGATEWAY, err.Error())
			return "nil", err

		}
	} else {
		idReturn = identity
	}

	identityReponse := make(map[string]string)
	identityReponse["did"] = idReq["did"].(string)
	identityReponse["publicKey"] = idReturn.PublicKey

	log.Infof("[%s][getIdentity] Get Identity", IDGATEWAY)

	idBytes, err := json.Marshal(identityReponse)

	return string(idBytes), nil
}

func (cc *Chaincode) createIdentity(stub shim.ChaincodeStubInterface, controller string, args interface{}) (string, error) {
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	log.Debugf("[%s][createIdentity] Calling to registry", IDGATEWAY)

	identityStore := Identity{PublicKey: idReq["publicKey"].(string), Controller: controller}
	_, err := cc.createIDRegistry(stub, idReq["did"].(string), identityStore)
	if err != nil {
		log.Errorf("[%s][createIdentity] Error creating Identity: %v", IDGATEWAY, err.Error())
		return "", err
	}

	return "", nil

}

func (cc *Chaincode) createSelfIdentity(stub shim.ChaincodeStubInterface, args interface{}) (string, error) {
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})
	log.Debugf("[%s][createSelfIdentity] Calling to registry", IDGATEWAY)
	identityStore := Identity{PublicKey: idReq["publicKey"].(string)}

	_, err := cc.createIDRegistry(stub, idReq["did"].(string), identityStore)
	if err != nil {
		log.Errorf("[%s][createSelfIdentity] Error creating Identity: %v", IDGATEWAY, err.Error())
		return "", err
	}

	return "", nil
}
func (cc *Chaincode) verifyIdentity(stub shim.ChaincodeStubInterface, did string, identity *Identity, args interface{}) (string, error) {
	log.Infof("[%s][verifyIdentity]Verifying identity", IDGATEWAY)
	idVerReq := make(map[string]interface{})
	idVerReq = args.(map[string]interface{})

	log.Infof("[%s][verifyIdentity] Idenitity has access %v", IDGATEWAY, identity.Access)

	if identity.Access != 4 {
		log.Errorf("[%s][verifyIdentity] Identity has not access to verify", IDGATEWAY)
		return "", errors.New("Verification unauthorized, the did provided has not access")
	}

	_, err := cc.updateIDRegistry(stub, idVerReq["did"].(string), did, 1)
	if err != nil {
		log.Errorf("[%s][verifyIdentity] Error verifying signature: %v", IDGATEWAY, err.Error())
		return "", err
	}
	log.Infof("[%s][verifyIdentity]Idenitity updated", IDGATEWAY)

	return "The Identity has been verified", nil

}

func (cc *Chaincode) revokeIdentity(stub shim.ChaincodeStubInterface, did string, identity *Identity, args interface{}) (string, error) {
	log.Infof("[%s][revokeIdentity]Verifying identity", IDGATEWAY)
	var err error
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	if identity.Access != 4 {
		log.Errorf("[%s][revokeIdentity] Identity has not access to revoke", IDGATEWAY)
		return "", errors.New("Identity has not access to revoke")
	}

	_, err = cc.revokeIDRegistry(stub, idReq["did"].(string), did)
	if err != nil {
		log.Errorf("[%s][revokeIdentity] Error revoking signature: %v", IDGATEWAY, err.Error())
		return "", err
	}
	log.Infof("[%s][revokeIdentity]Idenitity revoked", IDGATEWAY)

	return "Identity revoked successfully", nil

}
