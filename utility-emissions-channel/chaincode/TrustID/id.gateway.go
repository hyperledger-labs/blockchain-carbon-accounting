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

func (cc *Chaincode) getIdentity(stub shim.ChaincodeStubInterface, did string, identity *Identity, args interface{}) (string, error) {
	log.Infof("[%s][getIdentity] Get Identity", IDGATEWAY)
	var idReturn *Identity
	var err error
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	if idReq["did"] == nil {
		log.Errorf("[%s][%s][getIdentity] Problem getting identity: %v", CHANNEL_ENV, IDGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	log.Infof("[%s][%s][getIdentity] Get Identity %v", CHANNEL_ENV, IDGATEWAY, idReq["did"].(string))
	if idReq["did"].(string) != did {
		idReturn, err = cc.getIDRegistry(stub, idReq["did"].(string))
		if err != nil {
			log.Errorf("[%s][%s][getIdentity] Problem getting identity: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
			return "nil", err

		}
	} else {
		idReturn = identity
	}

	identityReponse := make(map[string]string)
	identityReponse["did"] = idReq["did"].(string)
	identityReponse["publicKey"] = idReturn.PublicKey

	log.Infof("[%s][%s][getIdentity] Get Identity", CHANNEL_ENV, IDGATEWAY)

	idBytes, err := json.Marshal(identityReponse)

	return string(idBytes), nil
}

func (cc *Chaincode) createIdentity(stub shim.ChaincodeStubInterface, controller string, args interface{}) (string, error) {
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	log.Debugf("[%s][%s][createIdentity] Calling to registry", CHANNEL_ENV, IDGATEWAY)

	if idReq["did"] == nil {
		log.Errorf("[%s][%s][createIdentity] rror creating Identity: %v", CHANNEL_ENV, IDGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	identityStore := Identity{PublicKey: idReq["publicKey"].(string), Controller: controller}
	_, err := cc.createIDRegistry(stub, idReq["did"].(string), identityStore)
	if err != nil {
		log.Errorf("[%s][%s][createIdentity] Error creating Identity: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return "", err
	}

	return "", nil

}

func (cc *Chaincode) createSelfIdentity(stub shim.ChaincodeStubInterface, args interface{}) (string, error) {
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})
	log.Debugf("[%s][%s][createSelfIdentity] Calling to registry", CHANNEL_ENV, IDGATEWAY)
	identityStore := Identity{PublicKey: idReq["publicKey"].(string)}

	if idReq["did"] == nil {
		log.Errorf("[%s][%s][createSelfIdentity] Error creating Identity: %v", CHANNEL_ENV, IDGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	_, err := cc.createIDRegistry(stub, idReq["did"].(string), identityStore)
	if err != nil {
		log.Errorf("[%s][%s][createSelfIdentity] Error creating Identity: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return "", err
	}

	return "The identity has been stored in DLT successfully", nil
}
func (cc *Chaincode) verifyIdentity(stub shim.ChaincodeStubInterface, did string, identity *Identity, args interface{}) (string, error) {
	log.Infof("[%s][%s][verifyIdentity]Verifying identity", CHANNEL_ENV, IDGATEWAY)
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	log.Infof("[%s][%s][verifyIdentity] Idenitity has access %v", CHANNEL_ENV, IDGATEWAY, identity.Access)

	if identity.Access != 4 {
		log.Errorf("[%s][%s][verifyIdentity] Error verification unauthorized, the did provided has not access", CHANNEL_ENV, IDGATEWAY)
		return "", errors.New(ERRORVerID)
	}

	if idReq["did"] == nil {
		log.Errorf("[%s][%s][verifyIdentity] Error verifying signature: %v", CHANNEL_ENV, IDGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	_, err := cc.updateIDRegistry(stub, idReq["did"].(string), did, 1)
	if err != nil {
		log.Errorf("[%s][%s][verifyIdentity] Error verifying signature: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return "", errors.New(ERRORVerSign)
	}
	log.Infof("[%s][%s][verifyIdentity]Idenitity updated", CHANNEL_ENV, IDGATEWAY)

	return "The Identity has been verified", nil

}

func (cc *Chaincode) revokeIdentity(stub shim.ChaincodeStubInterface, did string, identity *Identity, args interface{}) (string, error) {
	log.Infof("[%s][%s][revokeIdentity]Verifying identity", CHANNEL_ENV, IDGATEWAY)
	var err error
	idReq := make(map[string]interface{})
	idReq = args.(map[string]interface{})

	if identity.Access != 4 {
		log.Errorf("[%s][%s][revokeIdentity]Error revocation unauthorized, the did provided has not access", CHANNEL_ENV, IDGATEWAY)
		return "", errors.New(ERRORRevID)
	}

	if idReq["did"] == nil {
		log.Errorf("[%s][%s][revokeIdentity] Error revoking signature: %v", CHANNEL_ENV, IDGATEWAY, "DID input param is undefined")
		return "", errors.New("DID input param is undefined")
	}

	_, err = cc.revokeIDRegistry(stub, idReq["did"].(string), did)
	if err != nil {
		log.Errorf("[%s][%s][revokeIdentity] Error revoking signature: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return "", errors.New(ERRORRevSign)
	}
	log.Infof("[%s][%s][revokeIdentity]Idenitity revoked", CHANNEL_ENV, IDGATEWAY)

	return "Identity revoked successfully", nil

}
