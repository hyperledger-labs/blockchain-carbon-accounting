/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

import (
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"strings"

	jose "gopkg.in/square/go-jose.v2"
)

func parseMessage(message string) (*jose.JSONWebSignature, error) {
	jwsSignature, err := jose.ParseSigned(message)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	return jwsSignature, nil
}

func parsePublicKeyX509(publicKey string) (interface{}, error) {
	base64Data := []byte(publicKey)

	d := make([]byte, base64.StdEncoding.DecodedLen(len(base64Data)))
	n, err := base64.StdEncoding.Decode(d, base64Data)
	if err != nil {
		// Handle error
	}
	d = d[:n]

	publicKeyImported, err := x509.ParsePKIXPublicKey(d)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	return publicKeyImported, nil
}

func parseKey(publicKey string) string {

	begin := "-----BEGIN PUBLIC KEY-----"
	end := "-----END PRIVATE KEY-----"
	//pk := strings.ReplaceAll(publicKey, "\n", "")

	r := strings.NewReplacer("\n", "")

	// Replace all pairs.
	pk := r.Replace(publicKey)
	noBegin := strings.Split(pk, begin)
	parsed := strings.Split(noBegin[1], end)
	return parsed[0]
}

func verifySignature(message string, key string) ([]byte, error) {
	msg, err := parseMessage(message)
	pbkey, err := parsePublicKeyX509(key)
	result, err := jose.JSONWebSignature.Verify(*msg, pbkey)
	if err != nil {
		fmt.Printf("%v", err)
		return nil, err
	}
	return result, nil

}
