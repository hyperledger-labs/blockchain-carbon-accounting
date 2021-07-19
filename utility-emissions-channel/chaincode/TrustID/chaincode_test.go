/*

Copyright 2020 Telefónica Digital España. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0

*/

package main

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	testcc "github.com/hyperledger/fabric-chaincode-go/shimtest"

	//testcc "github.com/s7techlab/cckit/testing"
	"github.com/stretchr/testify/assert"
)

func TestIdenity(t *testing.T) {
	stub := InitChaincode(t)

	t.Run("CreateUnverifiedIdentity", func(t *testing.T) {
		signedPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImNyZWF0ZVNlbGZJZGVudGl0eSIsInBhcmFtcyI6eyJkaWQiOiJkaWQ6dnRuOnRydXN0b3M6dGVsZWZvbmljYToyIiwicHVibGljS2V5IjoiLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1cbk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdTA0ZTlWTE5uMUpIZ1lOSU1SclVcblE0SkhoSG4wd1p4UENEOWtjUHo2M1NNQmlZbkN0Uk0yNHBLODZnQWFUdU00RDhWMkxqckE2ZHZCV3dCT2YydUZcbi80aXJJUlhNT2FJNTh1dFhFQ3NBMHI2Q3cyU3BDWVNWOEJLMXk4aHBuc3cwMi9UMHhZUkRiRnFmaHZxY3NCSjJcbjRMSTZGNHRDb2JQb2VnRXBiQ1RXb0xNdU1FVDNXWkZMeW1ZU2lHNDJObWJjWjBLVEdrd1R6aUx5bEwyMm41d0FcblpUbGZ1dnVCUURSYksvUzlmTld6WGpvbWhKbXFzeVFtbzJZQVIwRkExYVhuN1BlcW8vMHRDZnRKazhKaldvemRcblBnM25UZUdlbDVmeE51VjdybWxOMjZ4QlU2cDB4TmcxMnR6KzRnZ3JFZXE5OWR6Z2tmUCtLUXBZbHpaVkJMTmRcbm1RSURBUUFCXG4tLS0tLUVORCBQVUJMSUMgS0VZLS0tLS1cbiJ9fQ.Wylf4lFaJLLiTrs9IMrvs2-mD_4HiO1C6kq_FJRzeJJgWpoOCSZ-PeD5HbVkuc3H4lbGdbSbvmwF28NzjXVKhjT__x0eYSK4VEEMbFeZx7h3aOU985heKolzi9OGW3n9x-e0HuLiG8uI-nOovsU81d74TmMmlc-iTmsr8WWE8syMDDMuvQcXi7T8I3uxNsqXVKboHPB5eW-NfA1EfrooP2qb6E2doAqTdLf3UI8W1f3lsGebTK8ObLenq8MW--dzeA54xSyEFrwV6dVS_R8w4PqZQ-5ULUw-x20VcY9ZhGNknJnmhExl6kFn0ruDMHkadIsRslp6xShx4mQFOZEouQ"
		publicKey := "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu04e9VLNn1JHgYNIMRrU\nQ4JHhHn0wZxPCD9kcPz63SMBiYnCtRM24pK86gAaTuM4D8V2LjrA6dvBWwBOf2uF\n/4irIRXMOaI58utXECsA0r6Cw2SpCYSV8BK1y8hpnsw02/T0xYRDbFqfhvqcsBJ2\n4LI6F4tCobPoegEpbCTWoLMuMET3WZFLymYSiG42NmbcZ0KTGkwTziLylL22n5wA\nZTlfuvuBQDRbK/S9fNWzXjomhJmqsyQmo2YAR0FA1aXn7Peqo/0tCftJk8JjWozd\nPg3nTeGel5fxNuV7rmlN26xBU6p0xNg12tz+4ggrEeq99dzgkfP+KQpYlzZVBLNd\nmQIDAQAB\n-----END PUBLIC KEY-----"

		invokeReq := IdentityUnverifiedRequest{PublicKey: publicKey, Payload: signedPayload}
		CreateUnverifiedIdentity(t, stub, invokeReq)
	})
	t.Run("GetIdentity", func(t *testing.T) {
		verPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImdldElkZW50aXR5IiwicGFyYW1zIjp7ImRpZCI6ImRpZDp2dG46dHJ1c3Rvczp0ZWxlZm9uaWNhOjIifX0.Zs1qPx3f6pgeoYOJCzFo51MeBGlEXYPtPMTxVI-ACeGJbA6hu8iBz_wCV-dVlvkvFRyKavhuOrxeh9Qo1PlQqhxPdDtiPN1CjqGrzYSFQZElTJUAwU2c9Qckui440z9riwLcxF5XnSOurNelZ1Z6-CLr5WZ_DB80K4fcf6ngX00450oSZgMIvuveuQJtFyzmIK91arMCy-bp9aUj8cYb8b7hGn0ahk2u7l-bUUSvTzxtdhjilApKvGy6YGnNxZ6-S321FntudCgvOOKfzVMPVeE7138F3xNmMWcGoeqbX315_lKjA15P3t0naSXUWkQejPFhac5YivJMjARhDM_THg"
		invokeReq := Request{Did: "did:vtn:trustos:telefonica:2", Payload: verPayload}
		GetUnverifiedIdentity(t, stub, invokeReq)
	})
	t.Run("Verify Idenitity", func(t *testing.T) {
		verPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6InZlcmlmeUlkZW50aXR5IiwicGFyYW1zIjp7ImRpZCI6ImRpZDp2dG46dHJ1c3Rvczp0ZWxlZm9uaWNhOjIifX0.JfKl8qeO1nTPQaPS00Td3ksOtQBhzHQgaqmX2Ojz5Mvu45SiGT2KEOsR8SZheuHuFBPgdq7Mu8BRwjbUMmATIZugM-uZdmwZF0HPPMQB7GikW-EiTCOU_rwKCKAEgINLtanXsOEK75XJ_QPUewYe2Fwn7SVt-sDk9ufIJXIL2f5gw9Kjp3gNjGCAmc4bUSMNlUM7XENxo6oq6HuWzEOU9SnLLxIBMDO1fhD639q13xA4XDGW7QavaBcalFDBAvzhKjcmcDlh0c5vL66V168mAXWq0wx_Rja-Sgj8zkGTGgdzBuMVkY-DAvca2UQbGod38BVqMWMbsFM4SfpSFVCIYQ"
		invokeReq := Request{Did: "did:vtn:trustos:telefonica:0", Payload: verPayload}
		VerifyIdentity(t, stub, invokeReq)
	})
	t.Run("RevokeIdenitity", func(t *testing.T) {
		verPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6InJldm9rZUlkZW50aXR5IiwicGFyYW1zIjp7ImRpZCI6ImRpZDp2dG46dHJ1c3Rvczp0ZWxlZm9uaWNhOjIifX0.bfL2kO2n2CG41QHOHv2KOuniOoVmkggBt3h-sQsHq9xr6_qRKK7kgnNsyYvZmqB_WJhaFmHjTViKAQaWUVfIHMYehAaO7oCx7Upou9mwlm-8m1SNwjQxFYcn8EC5fa7_MX0i-YSMW3O5zHRTxbS8QG1u0crW05Fr4gu19V0c8pA_91HJQLEBMUSNIGrY3pMein2Ami9bmfHtLOYKx473mzg8PrQBwh3e0QZ47uTgGD6vZmf4LDcCLUyqjiPFCXJCk3-4Oykrzkgt8xZ5Z3Rg5l-h5iTUjvA1iVgLnKuyhqvyqT3CdQfDfzev-QPqqpxQufI_u7eFdhuOfMM_OdX7EA"
		invokeReq := Request{Did: "did:vtn:trustos:telefonica:0", Payload: verPayload}
		RevokeIdenitity(t, stub, invokeReq)
	})
}

func TestServices(t *testing.T) {
	stub := InitChaincode(t)

	// 	/* Basic functionalities */
	t.Run("CreateUnverifiedIdentity", func(t *testing.T) {
		signedPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImNyZWF0ZVNlbGZJZGVudGl0eSIsInBhcmFtcyI6eyJkaWQiOiJkaWQ6dnRuOnRydXN0b3M6dGVsZWZvbmljYToyIiwicHVibGljS2V5IjoiLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1cbk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdTA0ZTlWTE5uMUpIZ1lOSU1SclVcblE0SkhoSG4wd1p4UENEOWtjUHo2M1NNQmlZbkN0Uk0yNHBLODZnQWFUdU00RDhWMkxqckE2ZHZCV3dCT2YydUZcbi80aXJJUlhNT2FJNTh1dFhFQ3NBMHI2Q3cyU3BDWVNWOEJLMXk4aHBuc3cwMi9UMHhZUkRiRnFmaHZxY3NCSjJcbjRMSTZGNHRDb2JQb2VnRXBiQ1RXb0xNdU1FVDNXWkZMeW1ZU2lHNDJObWJjWjBLVEdrd1R6aUx5bEwyMm41d0FcblpUbGZ1dnVCUURSYksvUzlmTld6WGpvbWhKbXFzeVFtbzJZQVIwRkExYVhuN1BlcW8vMHRDZnRKazhKaldvemRcblBnM25UZUdlbDVmeE51VjdybWxOMjZ4QlU2cDB4TmcxMnR6KzRnZ3JFZXE5OWR6Z2tmUCtLUXBZbHpaVkJMTmRcbm1RSURBUUFCXG4tLS0tLUVORCBQVUJMSUMgS0VZLS0tLS1cbiJ9fQ.Wylf4lFaJLLiTrs9IMrvs2-mD_4HiO1C6kq_FJRzeJJgWpoOCSZ-PeD5HbVkuc3H4lbGdbSbvmwF28NzjXVKhjT__x0eYSK4VEEMbFeZx7h3aOU985heKolzi9OGW3n9x-e0HuLiG8uI-nOovsU81d74TmMmlc-iTmsr8WWE8syMDDMuvQcXi7T8I3uxNsqXVKboHPB5eW-NfA1EfrooP2qb6E2doAqTdLf3UI8W1f3lsGebTK8ObLenq8MW--dzeA54xSyEFrwV6dVS_R8w4PqZQ-5ULUw-x20VcY9ZhGNknJnmhExl6kFn0ruDMHkadIsRslp6xShx4mQFOZEouQ"
		publicKey := "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu04e9VLNn1JHgYNIMRrU\nQ4JHhHn0wZxPCD9kcPz63SMBiYnCtRM24pK86gAaTuM4D8V2LjrA6dvBWwBOf2uF\n/4irIRXMOaI58utXECsA0r6Cw2SpCYSV8BK1y8hpnsw02/T0xYRDbFqfhvqcsBJ2\n4LI6F4tCobPoegEpbCTWoLMuMET3WZFLymYSiG42NmbcZ0KTGkwTziLylL22n5wA\nZTlfuvuBQDRbK/S9fNWzXjomhJmqsyQmo2YAR0FA1aXn7Peqo/0tCftJk8JjWozd\nPg3nTeGel5fxNuV7rmlN26xBU6p0xNg12tz+4ggrEeq99dzgkfP+KQpYlzZVBLNd\nmQIDAQAB\n-----END PUBLIC KEY-----"

		invokeReq := IdentityUnverifiedRequest{PublicKey: publicKey, Payload: signedPayload}
		CreateUnverifiedIdentity(t, stub, invokeReq)
	})

	t.Run("Verify Idenitity", func(t *testing.T) {
		verPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6InZlcmlmeUlkZW50aXR5IiwicGFyYW1zIjp7ImRpZCI6ImRpZDp2dG46dHJ1c3Rvczp0ZWxlZm9uaWNhOjIifX0.JfKl8qeO1nTPQaPS00Td3ksOtQBhzHQgaqmX2Ojz5Mvu45SiGT2KEOsR8SZheuHuFBPgdq7Mu8BRwjbUMmATIZugM-uZdmwZF0HPPMQB7GikW-EiTCOU_rwKCKAEgINLtanXsOEK75XJ_QPUewYe2Fwn7SVt-sDk9ufIJXIL2f5gw9Kjp3gNjGCAmc4bUSMNlUM7XENxo6oq6HuWzEOU9SnLLxIBMDO1fhD639q13xA4XDGW7QavaBcalFDBAvzhKjcmcDlh0c5vL66V168mAXWq0wx_Rja-Sgj8zkGTGgdzBuMVkY-DAvca2UQbGod38BVqMWMbsFM4SfpSFVCIYQ"
		invokeReq := Request{Did: "did:vtn:trustos:telefonica:0", Payload: verPayload}
		VerifyIdentity(t, stub, invokeReq)
	})

	t.Run("Create Service", func(t *testing.T) {
		servicePayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImNyZWF0ZVNlcnZpY2VJZGVudGl0eSIsInBhcmFtcyI6eyJkaWQiOiJ2dG46dHJ1c3RvczpzZXJ2aWNlOjEiLCJuYW1lIjoiY2hhaW5jb2RlX2V4YW1wbGUwMiIsImlzUHVibGljIjp0cnVlLCJjaGFubmVsIjoidGVsZWZvbmljYWNoYW5uZWwifX0.Zr-Vqp2hGRTmwzXdKAyzBe8MdiqUjpshwR_gtP931TEgwNYwX8jQdZlP_yEIbthepWUwgcP0wZSoMgsssamVJ-U9yf2Ts2TjMJkUOiehXz2gzkzJ-nKWYuDKhF-IAM1nadkejb3442R5iPetlb8IzpwiJkVuc1TorpcciE38fEO81hhI_iUsdWCWrcNSNMYEecFsEui12VbBJKy3Ab9u6h1q0jhMMxg3qutwNaJzoOD2kE2afQidzQ1vyze5xXlsciqd35xtL3bzVPNIxcjkVNx1L2ST0ugY1N1NQcET3tyfTpO8AtyHRrscPjC0IDyjFthkmcRsdPwun3v5scRtEw"
		service := Request{Did: "did:vtn:trustos:telefonica:2", Payload: servicePayload}
		CreateService(t, stub, service)
	})
	t.Run("Get Service", func(t *testing.T) {
		servicePayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImdldFNlcnZpY2VJZGVudGl0eSIsInBhcmFtcyI6eyJkaWQiOiJ2dG46dHJ1c3RvczpzZXJ2aWNlOjEifX0.tCStObDRrTF4aT6LOhOvOGhRDEpVl19VxMJLE1x76VIhqC_beq94WRm9Bg3QwWrXMNK2SVeabdMVqV5n1y-6xaaAAm-5FLGDbmALVPrjlOnactbzjaoL4NdktgJ_d7DDGSh4U1v2f36O1o6TlrjZGqHXMt_lm-02ZeWmcj8welhRDeKkDqP11GOYU2oYYgX4UElX0eKxMLGRlJfXHYFuqXRQ30epc4xtfNmq1wTu9pxcY3haXXWdkeTAKAb6t6sF_4nT5MO-3d2gZ8awzt71YhvM4YIHu5twO-Uatmns9z4EXRtdFJHBDGMhEvGEOOD1ZEZcb5anjg9hGBagdJxj6Q"
		service := Request{Did: "did:vtn:trustos:telefonica:2", Payload: servicePayload}
		GetService(t, stub, service)
	})
	t.Run("Update Service", func(t *testing.T) {
		updatePayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6InVwZGF0ZVNlcnZpY2VBY2Nlc3MiLCJwYXJhbXMiOnsiZGlkIjoidnRuOnRydXN0b3M6c2VydmljZToxIiwiYWNjZXNzIjp7ImRpZCI6ImRpZDp0ZWxlZm9uaWNhOjI5MjM5MjkzIiwidHlwZSI6MH0sImlzUHVibGljIjp0cnVlfX0.bQTxXnqOThPfVshlRTTQfm7dcLHGCTopSiF8tC5KjenyzXh-UI2AN5Grd-jJtpyHs1hq8xCdKrgDKynDlKUsWR3aSszQcrve8ZEge2yN4WzvPh3eqfpXSVhPMDuGAHdqoGmHUGCTQaZVwjatwlo9e-cQAlLcAqjakW8CWNtsVK5ABVnfly6_0-PhLXnrn6RJyjSPJ7C-nXpIoUFBpJ7YPWSK0HKwbCtQU6HqEpOW1iGv6gYMZLyQ8zxDp5HOlGuVPIdSKQNdrEfsDJhiIZb1P4jiZDqD_hAD_ct8LhDvH5_ogWt4RVGsNIswQSmeRj3Dw65ao_6j8DNwhQoCVPy0mA"
		service := Request{Did: "did:vtn:trustos:telefonica:2", Payload: updatePayload}
		UpdateService(t, stub, service)
	})
	t.Run("Get Service", func(t *testing.T) {
		servicePayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImdldFNlcnZpY2VJZGVudGl0eSIsInBhcmFtcyI6eyJkaWQiOiJ2dG46dHJ1c3RvczpzZXJ2aWNlOjEifX0.tCStObDRrTF4aT6LOhOvOGhRDEpVl19VxMJLE1x76VIhqC_beq94WRm9Bg3QwWrXMNK2SVeabdMVqV5n1y-6xaaAAm-5FLGDbmALVPrjlOnactbzjaoL4NdktgJ_d7DDGSh4U1v2f36O1o6TlrjZGqHXMt_lm-02ZeWmcj8welhRDeKkDqP11GOYU2oYYgX4UElX0eKxMLGRlJfXHYFuqXRQ30epc4xtfNmq1wTu9pxcY3haXXWdkeTAKAb6t6sF_4nT5MO-3d2gZ8awzt71YhvM4YIHu5twO-Uatmns9z4EXRtdFJHBDGMhEvGEOOD1ZEZcb5anjg9hGBagdJxj6Q"
		service := Request{Did: "did:vtn:trustos:telefonica:2", Payload: servicePayload}
		GetService(t, stub, service)
	})

}

// ######################### Identity Functions   ########################

func InitChaincode(t *testing.T) *testcc.MockStub {
	cc := new(Chaincode)

	stub := testcc.NewMockStub("chaincode", cc)
	pkRoot := "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7NBDzVMESXU/yuARe7YU\nGrkgNMZh5eA5w3PgxgYZf/isDLPHvmSM2Q9cTauDroriGInikQxtZ/CI4+9Qi4Rd\nJCHjeWhzw0hTIXhHoohyo9QTbUVetb4RBDJEcNqFrpztAojn8Ib5EF2soBFtBLyT\nguxlizcWwTZvv+KxHGBg/tUE7JIqw3YzmEK31faR2HhkPPqxTQ9F+h4SOnY9e6Cf\nh75PpjouzarpntSVkAqv/Ot5kV3O4TcWhB0vUr/HZwx2iX+LEyYock8Sx4Op20/g\n7k3J3rYhMGTHfkKMhZjX9QoZ8uBRiSxieAaia0yZSIcycgE6Aqu6KT+WaQn4bCnh\nwQIDAQAB\n-----END PUBLIC KEY-----"
	invokeReq := IdentityRequest{Did: "did:vtn:trustos:telefonica:0", Controller: "did:vtn:trustos:telefonica:0", PublicKey: pkRoot}
	input, _ := json.Marshal(invokeReq)
	res := stub.MockInit("1", [][]byte{[]byte("initFunc"), input})
	if res.Status != shim.OK {
		t.Error("Init failed", res.Status, res.Message)
	}
	return stub
}

func CreateUnverifiedIdentity(t *testing.T, stub *testcc.MockStub, invokeReq IdentityUnverifiedRequest) {
	input, _ := json.Marshal(invokeReq)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}
	expectedRes := "The identity has been stored in DLT successfully"
	assert.Equal(t, expectedRes, string(res.Payload), "Should be the same")

}
func GetUnverifiedIdentity(t *testing.T, stub *testcc.MockStub, invokeReq Request) {

	input, _ := json.Marshal(invokeReq)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}
	fmt.Printf(string(res.Payload))

}

func VerifyIdentity(t *testing.T, stub *testcc.MockStub, invokeReq Request) {

	input, _ := json.Marshal(invokeReq)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}

}

func RevokeIdenitity(t *testing.T, stub *testcc.MockStub, invokeReq Request) {

	input, _ := json.Marshal(invokeReq)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}

}

// func TestBadVerifyIdentity(t *testing.T) {
// 	cc := new(Chaincode)
// 	pkRoot := "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7NBDzVMESXU/yuARe7YU\nGrkgNMZh5eA5w3PgxgYZf/isDLPHvmSM2Q9cTauDroriGInikQxtZ/CI4+9Qi4Rd\nJCHjeWhzw0hTIXhHoohyo9QTbUVetb4RBDJEcNqFrpztAojn8Ib5EF2soBFtBLyT\nguxlizcWwTZvv+KxHGBg/tUE7JIqw3YzmEK31faR2HhkPPqxTQ9F+h4SOnY9e6Cf\nh75PpjouzarpntSVkAqv/Ot5kV3O4TcWhB0vUr/HZwx2iX+LEyYock8Sx4Op20/g\n7k3J3rYhMGTHfkKMhZjX9QoZ8uBRiSxieAaia0yZSIcycgE6Aqu6KT+WaQn4bCnh\nwQIDAQAB\n-----END PUBLIC KEY-----"
// 	invokeReq := IdentityRequest{Did: "did:vtn:trustos:telefonica:0", Controller: "did:vtn:trustos:telefonica:0", PublicKey: pkRoot}
// 	input, _ := json.Marshal(invokeReq)
// 	stub := shim.NewMockStub("chaincode", cc)
// 	res := stub.MockInit("1", [][]byte{[]byte("initFunc"), input})
// 	if res.Status != shim.OK {
// 		t.Error("Init failed", res.Status, res.Message)
// 	}
// 	signedPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJkaWQiOiJkaWQ6dnRuOnRydXN0b3M6dGVsZWZvbmljYToxIiwicHVibGljS2V5IjoiLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1cbk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdTA0ZTlWTE5uMUpIZ1lOSU1SclVcblE0SkhoSG4wd1p4UENEOWtjUHo2M1NNQmlZbkN0Uk0yNHBLODZnQWFUdU00RDhWMkxqckE2ZHZCV3dCT2YydUZcbi80aXJJUlhNT2FJNTh1dFhFQ3NBMHI2Q3cyU3BDWVNWOEJLMXk4aHBuc3cwMi9UMHhZUkRiRnFmaHZxY3NCSjJcbjRMSTZGNHRDb2JQb2VnRXBiQ1RXb0xNdU1FVDNXWkZMeW1ZU2lHNDJObWJjWjBLVEdrd1R6aUx5bEwyMm41d0FcblpUbGZ1dnVCUURSYksvUzlmTld6WGpvbWhKbXFzeVFtbzJZQVIwRkExYVhuN1BlcW8vMHRDZnRKazhKaldvemRcblBnM25UZUdlbDVmeE51VjdybWxOMjZ4QlU2cDB4TmcxMnR6KzRnZ3JFZXE5OWR6Z2tmUCtLUXBZbHpaVkJMTmRcbm1RSURBUUFCXG4tLS0tLUVORCBQVUJMSUMgS0VZLS0tLS1cbiIsImFjY2VzcyI6MX0.XYaCvgrLuT8dO2rq4-ktAN6IvR2tDNOx3EtHBlrEYy7JIPGwaccQHsmlsrsV17aIgPHBAlnA1UAUfHb7jAY7-xhgqKn98XNLAghftERFS50yVH-PZAfeBDx9jvMR4cnYh4niK2fWu5Z-cT5R-bq2CJwELnF2dUr4WIYiXaTsmBpbupje6_EUwVAvN7QMQ0a7nlZ64eoOuzVOhWfFBpJP6jjnSfERwujpSDGHMYCQw-wBL6pEKzjMahd_8VyReEMzeQwpnyGJzmqdiC8zaCJqz0DcugLgWGNzkRtnnRaIZF4N1dvX9Ld6vs2tDMCcZACHRBQBJ774vZPP7ZH2rTm-lg"

// 	invokeReq2 := Request{Did: "did:vtn:trustos:telefonica:0", Payload: signedPayload}
// 	input, _ = json.Marshal(invokeReq2)
// 	res = stub.MockInvoke("1", [][]byte{[]byte("createVerifiedIdentity"), input})
// 	if res.Status != shim.OK {
// 		t.Error("Invoke failed", res.Status, res.Message)
// 	}

// 	verPayload := "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJkaWQiOiJkaWQ6dnRuOnRydXN0b3M6dGVsZWZvbmljYToxIn0.FOjwHYfctNpWxBR5cMAYIn3M-Tp8Ml1GMTw0aLzCSO3IjFfGEXz-vOmXvduvPCPJIvSkETbZO8ywlx5aR0tLmpNtY_mfy6b-MzZXLl8lkA0-MP_NcZvSh-lFhIxY9kMF6yIwg7pwZxK1x3G4N4vUbT5SbeNq6K1v6sE0m2TKdW_IhiMvvET_k8a8BP03U4LREp9JHqLyz8_OJlMp1Na4ABjPitZ2wQP0DBXuCnRX3xJSguJSd4w2PdYAEwMSUZBaviiTrJwoyZE2Ktmgc7929X2weYQgy5_KU_Mqz_NWRo-SNJzdIVnAYMXDfhgQyHTpjENQtgS6-oRZhqA2OaDxPQ"
// 	invokeReq3 := Request{Did: "did:vtn:trustos:telefonica:0", Payload: verPayload}
// 	input, _ = json.Marshal(invokeReq3)
// 	res = stub.MockInvoke("1", [][]byte{[]byte("verifyIdentity"), input})
// 	if res.Status == shim.OK {
// 		t.Error("Invoke failed", res.Status, res.Message)
// 	}

// }

// ######################### Service Functions   ########################

func CreateService(t *testing.T, stub *testcc.MockStub, service Request) {

	input, _ := json.Marshal(service)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}

}

func GetService(t *testing.T, stub *testcc.MockStub, service Request) {

	input, _ := json.Marshal(service)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}
	fmt.Printf("%s", string(res.Payload))
}

func UpdateService(t *testing.T, stub *testcc.MockStub, service Request) {

	//   const access = {  "did": "did:telefonica:29239293", "type": 0 }
	// { did: "vtn:trustos:service:1", acess: access, isPublic: true }
	input, _ := json.Marshal(service)
	res := stub.MockInvoke("1", [][]byte{[]byte("proxy"), input})
	if res.Status != shim.OK {
		t.Error("Invoke failed", res.Status, res.Message)
	}

}
