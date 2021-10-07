package internal

import (
	"container/list"

	"github.com/hyperledger/fabric-chaincode-go/shimtest"
)

func buildEmptyMockStub() *shimtest.MockStub {
	s := new(shimtest.MockStub)
	s.State = make(map[string][]byte)
	s.Invokables = make(map[string]*shimtest.MockStub)
	s.Keys = list.New()
	return s
}
