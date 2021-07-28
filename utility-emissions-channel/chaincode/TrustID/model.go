/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/
package main

// Request to serialize args
type Request struct {
	Did       string `json:"did,omitempty"`
	PublicKey string `json:"publicKey,omitempty"`
	Payload   string `json:"payload,omitempty"` // me pasa una firma // el controller lo meto yo
}

// Identity stored in bc
type Identity struct {
	PublicKey  string `json:"publicKey"`
	Controller string `json:"controller"` // issuer's DID
	Access     int    `json:"access,omitempty"`
}

// IdentityRequest to serialize args
type IdentityRequest struct {
	Did        string `json:"did"`
	Controller string `json:"controller,omitempty"`
	PublicKey  string `json:"publicKey"`
	Payload    string `json:"payload,omitempty"` // me pasa una firma // el controller lo meto yo
	Access     int    `json:"access,omitempty"`
}

// Service stored in bc
type Service struct {
	Name       string `json:"name"`
	Controller string `json:"controller,omitempty"` // issuer's DID
	// Access     map[string]int `json:"access,omitempty"`     // mapping did - access type
	Access AccessPolicy `json:"access,omitempty"` // issuer's DID
	// Access     map[string]int `json:"access,omit
	// TODO: Remove, it will be included in the access policy

	Channel string `json:"channel"`
}

// PolicyType ..
type PolicyType string

const (
	// PublicPolicy the service is public
	PublicPolicy PolicyType = "PUBLIC"
	// SameControllerPolicy the controller service must be equal to the did's controller that is invoking the service
	SameControllerPolicy = "SAME_CONTROLLER"
	// FineGrainedPolicy anyone with access can interact
	FineGrainedPolicy = "FINE_GRAINED"
	// TODO: You can add additional PolicyTypes. Remember to add verification
	// logic in hasAccess from chaincode.gateway.go.
)

// AccessPolicy policy
type AccessPolicy struct {
	Policy    PolicyType     `json:"policy"`
	Threshold int            `json:"threshold,omitempty"`
	Registry  map[string]int `json:"registry,omitempty"`
}

// ServiceRequest stored in bc
type ServiceRequest struct {
	Name   string       `json:"name"`
	Did    string       `json:"did"`
	Access AccessPolicy `json:"access,omitempty"`
}

// IdentityUnverifiedRequest to serialize args
type IdentityUnverifiedRequest struct {
	PublicKey string `json:"publicKey"`
	Payload   string `json:"payload,omitempty"` // me pasa una firma // el controller lo meto yo
}

// CcRequest payload from jws
type CcRequest struct {
	Name    string   `json:"name,omitempty"`
	Args    []string `json:"args"`
	Channel string   `json:"channel"`
	Did     string   `json:"did"`
}

// Event to handle events in HF
type Event struct {
	EventName string `json:"eventName"` // name for the event
	Payload   []byte `json:"payload"`   // payload for the
}

// Error responses
// ERROR_XXX occurs when XXX
const (
	ERRORWrongNumberArgs  = `Wrong number of arguments. Expecting a JSON with token information.`
	ERRORParsingData      = `Error parsing data `
	ERRORPutState         = `Failed to store data in the ledger.	`
	ERRORGetState         = `Failed to get data from the ledger. `
	ERRORDelState         = `Failed to delete data from the ledger. `
	ERRORChaincodeCall    = `Error calling chaincode`
	ERRORGetService       = `Error getting service`
	ERRORUpdService       = `Error updating service`
	ERRORServiceNotExists = `Error The service doesn't exist`
	ERRORCreatingService  = "Error storing service"
	ERRORParsingService   = `Error parsing service`
	ERRORServiceExists    = `The service already exists in registry`
	ERRORDidMissing       = `Error calling service, no service DID Specified`
	ERRORStoringIdentity  = `Error storing identity`
	ERRORUpdatingID       = `Error updating identity in ledger`
	ERRORGetID            = `Error getting identity`
	ERRORVerID            = `Error verification unauthorized, the did provided has not access`
	ERRORRevID            = `Error revocation unauthorized, the did provided has not access`
	ERRORVerSign          = `Error verifying signature`
	ERRORRevSign          = `Error revoking signature`
	ERRORRevoke           = `Error revoking Unauthorized, the did provided cannot revoke the identity`
	ERRORnotID            = `Error the identity does not exist`
	ERRORParsingID        = `Error parsing identity`
	ERRORRevokeLedger     = `Error deleting from ledger`
	ERRORIDExists         = `Error the identity already exists`
	ERRORUserAccess       = `Error user has not access`
	ERRORParseJWS         = `Error parsing into JWS`
	ERRORParseX509        = `Error parsing into X509`
	ERRORBase64           = `Error decoding into base64`
	ERRORVerifying        = `Error verifying signature `
	IDGATEWAY             = `ID Gateway`
	IDREGISTRY            = `ID Registry`
	ServiceGATEWAY        = `ID Service Gateway`
	ServiceREGISTRY       = `ID Service Registry`
	JoseUTIL              = `JOSE Util`
)
