package manager

import (
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/stretchr/testify/assert"
)

func TestInvalidInvoke(t *testing.T) {
	is := assert.New(t)
	cc := new(RequestManagerChaincode)
	cc.ConfigureChaincode()
	stub := shimtest.NewMockStub("RequestManager", cc)

	t.Run("MethodNotSupported", func(t *testing.T) {
		resp := stub.MockInvoke("tx-id", [][]byte{[]byte("MethodNotSupported"), []byte("dummy")})

		is.Nil(resp.GetPayload())
		is.Equal(int32(404), resp.GetStatus())
	})
	t.Run("InvalidNumberArguments", func(t *testing.T) {
		resp := stub.MockInvoke("tx-id", [][]byte{[]byte("MethodNotSupported")})

		is.Nil(resp.GetPayload())
		is.Equal(int32(400), resp.GetStatus())
	})
}
