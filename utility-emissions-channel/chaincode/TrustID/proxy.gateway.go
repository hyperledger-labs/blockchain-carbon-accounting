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

func (cc *Chaincode) checkArgs(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	log.Infof("[%s][%s][checkArgs] Get Identity", CHANNEL_ENV, IDGATEWAY)
	var result string

	idReq := Request{}
	err := json.Unmarshal([]byte(args[0]), &idReq)

	var identity *Identity
	var publicKey string

	if idReq.PublicKey != "" {
		publicKey = parseKey(idReq.PublicKey)
		params, err := checkSignature(idReq.Payload, publicKey)

		if params["function"].(string) == "createSelfIdentity" {
			result, err = cc.createSelfIdentity(stub, params["params"])

		}
		return result, err

	}
	identity, err = cc.getIDRegistry(stub, idReq.Did)
	if err != nil {
		log.Errorf("[%s][%s][checkArgs] Error verifying signature: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return "", err
	}

	publicKey = parseKey(identity.PublicKey)
	params, err := checkSignature(idReq.Payload, publicKey)

	if params["function"].(string) == "getIdentity" {
		result, err = cc.getIdentity(stub, idReq.Did, identity, params["params"])

	}
	if params["function"].(string) == "verifyIdentity" {
		result, err = cc.verifyIdentity(stub, idReq.Did, identity, params["params"])

	}
	if params["function"].(string) == "revokeIdentity" {
		result, err = cc.revokeIdentity(stub, idReq.Did, identity, params["params"])

	}
	if params["function"].(string) == "createServiceIdentity" {
		result, err = cc.createServiceIdentity(stub, idReq.Did, params["params"])

	}
	if params["function"].(string) == "createIdentity" {
		result, err = cc.createIdentity(stub, idReq.Did, params["params"])

	}
	if params["function"].(string) == "getServiceIdentity" {
		result, err = cc.getServiceIdentity(stub, params["params"])

	}
	if params["function"].(string) == "updateServiceAccess" {
		result, err = cc.updateServiceAccess(stub, idReq.Did, params["params"])

	}
	if params["function"].(string) == "updateService" {
		result, err = cc.updateService(stub, idReq.Did, params["params"])

	}
	if params["function"].(string) == "invoke" {
		result, err = cc.invoke(stub, idReq.Did, params["params"])

	}
	return result, err

}

func checkSignature(payload string, key string) (map[string]interface{}, error) {
	log.Errorf("[%s][%s][checkSignature] Verifying signature", CHANNEL_ENV, IDGATEWAY)

	message, err := verifySignature(payload, key)
	if err != nil {
		log.Errorf("[%s][%s][checkSignature] Error verifying signature: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return nil, errors.New(ERRORVerSign)
	}
	params := make(map[string]interface{})

	err = json.Unmarshal(message, &params)
	if err != nil {
		log.Errorf("[%s][%s][checkSignature] Error parsing: %v", CHANNEL_ENV, IDGATEWAY, err.Error())
		return nil, errors.New(ERRORParsingData)
	}
	return params, nil
}
