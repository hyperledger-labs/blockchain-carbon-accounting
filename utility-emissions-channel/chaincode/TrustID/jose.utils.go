/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	log "TrustID/fabric-chaincode/log"
	"crypto/x509"
	"encoding/base64"
	"errors"

	"strings"

	jose "gopkg.in/square/go-jose.v2"
)

func parseMessage(message string) (*jose.JSONWebSignature, error) {
	jwsSignature, err := jose.ParseSigned(message)
	if err != nil {
		log.Infof("[%s][%s][parseMessage] Error parsing into JWS %s", CHANNEL_ENV, JoseUTIL, err.Error())
		return nil, errors.New(ERRORParseJWS)
	}
	return jwsSignature, nil
}

func parsePublicKeyX509(publicKey string) (interface{}, error) {
	base64Data := []byte(publicKey)

	d := make([]byte, base64.StdEncoding.DecodedLen(len(base64Data)))
	n, err := base64.StdEncoding.Decode(d, base64Data)
	if err != nil {
		log.Infof("[%s][%s][parsePublicKeyX509] Error decoding into base64 %s", CHANNEL_ENV, JoseUTIL, err.Error())
		return nil, errors.New(ERRORBase64)
	}
	d = d[:n]

	publicKeyImported, err := x509.ParsePKIXPublicKey(d)
	if err != nil {
		log.Infof("[%s][%s][parsePublicKeyX509] Error parsing into X509 %s", CHANNEL_ENV, JoseUTIL, err.Error())
		return nil, errors.New(ERRORParseX509)
	}
	return publicKeyImported, nil
}

func parseKey(publicKey string) string {

	begin := "-----BEGIN PUBLIC KEY-----"
	end := "-----END PUBLIC KEY-----"

	// Replace all pairs.
	noBegin := strings.Split(publicKey, begin)
	parsed := strings.Split(noBegin[1], end)
	return parsed[0]
}

func verifySignature(message string, key string) ([]byte, error) {
	msg, err := parseMessage(message)
	pbkey, err := parsePublicKeyX509(key)
	result, err := jose.JSONWebSignature.Verify(*msg, pbkey)
	if err != nil {
		log.Infof("[%s][%s][verifySignature] Error verifying signature %s", CHANNEL_ENV, JoseUTIL, err.Error())
		return nil, errors.New(ERRORVerifying)
	}
	return result, nil

}
