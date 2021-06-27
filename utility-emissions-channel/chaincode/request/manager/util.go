package manager

import (
	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/shim"
)

// returns : msp , username
func getCaller(stub shim.ChaincodeStubInterface) (string, string, error) {
	identity, err := cid.New(stub)
	if err != nil {
		return "", "", err
	}
	mspID, err := identity.GetMSPID()
	if err != nil {
		return "", "", err
	}
	cert, err := identity.GetX509Certificate()
	if err != nil {
		return "", "", err
	}
	return mspID, cert.Subject.CommonName, nil
}
