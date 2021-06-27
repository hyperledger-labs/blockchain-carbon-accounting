package manager

import (
	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/hyperledger/fabric-protos-go/msp"
)

type mockCaller struct {
	name    string
	certPem string
	mspId   string
}

var (
	user1 = mockCaller{
		name:  "user1",
		mspId: "auditor1",
		certPem: `-----BEGIN CERTIFICATE-----
MIICgzCCAimgAwIBAgIUUqD8w0a2/3P2N+zm1uvZfw8PUSMwCgYIKoZIzj0EAwIw
ZzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh
biBGcmFuY2lzY28xEzARBgNVBAoTCmRldm9yZy5jb20xFjAUBgNVBAMTDWNhLmRl
dm9yZy5jb20wHhcNMjEwNDI0MTEyMjAwWhcNMjIwNDI0MTEyNzAwWjBCMTAwDQYD
VQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMBIGA1UECxMLZGVwYXJ0bWVudDExDjAM
BgNVBAMTBXVzZXIxMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPtYJrextCxlB
Ot6ENC9BRFPPVD8OotBq0peo0cOg32GEnyUrg45KBIMNYibResW1M3WmoSFt67LI
nyQLFTfA6qOB1zCB1DAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNV
HQ4EFgQUMYaqrhJJ03f/LXWRkMSgGzlcOxYwKwYDVR0jBCQwIoAg7IbBCX1GeUPY
ATwsM/QGL+vfNXlu0sWLgrYk4IsDvHQwaAYIKgMEBQYHCAEEXHsiYXR0cnMiOnsi
aGYuQWZmaWxpYXRpb24iOiJvcmcxLmRlcGFydG1lbnQxIiwiaGYuRW5yb2xsbWVu
dElEIjoidXNlcjEiLCJoZi5UeXBlIjoiY2xpZW50In19MAoGCCqGSM49BAMCA0gA
MEUCIQDVhLKdIvu27RqjNHP099RzFNSHg404o9e2eF9pQSM+nAIgFQGNrKCHDGAU
jlHe30Y2CrQAH5b5FuX8uSadD6NGzgQ=
-----END CERTIFICATE-----`,
	}
	auditor2admin = mockCaller{
		name:  "auditor2admin",
		mspId: "auditor2",
		certPem: `-----BEGIN CERTIFICATE-----
MIICzTCCAnOgAwIBAgIUNi8JBDkBdnBa7EFlSeS4Lbh3vtMwCgYIKoZIzj0EAwIw
gYoxCzAJBgNVBAYTAlVTMRcwFQYDVQQIEw5Ob3J0aCBDYXJvbGluYTEmMCQGA1UE
ChMdYXVkaXRvcjIuY2FyYm9uQWNjb3VudGluZy5jb20xDzANBgNVBAsTBkZhYnJp
YzEpMCcGA1UEAxMgY2EuYXVkaXRvcjIuY2FyYm9uQWNjb3VudGluZy5jb20wHhcN
MjEwNjE0MTM1MjAwWhcNMjIwNjE0MTM1NzAwWjBkMQswCQYDVQQGEwJVUzEXMBUG
A1UECBMOTm9ydGggQ2Fyb2xpbmExFDASBgNVBAoTC0h5cGVybGVkZ2VyMQ4wDAYD
VQQLEwVhZG1pbjEWMBQGA1UEAxMNYXVkaXRvcjJhZG1pbjBZMBMGByqGSM49AgEG
CCqGSM49AwEHA0IABOYUPi+19wsM0zRBfkdUS5SKaYi+SO3RVM4v25t1qTI6g0C/
ga6pODsAbpqrKi7NaQVfVVU7VtES/Pgk8ib9WMCjgdswgdgwDgYDVR0PAQH/BAQD
AgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFLAPiLFYKAoxCmbFALskyJW5Q4z+
MB8GA1UdIwQYMBaAFOpYEF5ZX68gSxojoLRt5XHOKepxMBcGA1UdEQQQMA6CDDk2
ZmNjNjJmNmQwODBfBggqAwQFBgcIAQRTeyJhdHRycyI6eyJoZi5BZmZpbGlhdGlv
biI6IiIsImhmLkVucm9sbG1lbnRJRCI6ImF1ZGl0b3IyYWRtaW4iLCJoZi5UeXBl
IjoiYWRtaW4ifX0wCgYIKoZIzj0EAwIDSAAwRQIhAL+7PP8BCps9brauz/bRMbvr
mY6wQnsPzMINnDXD12S1AiA/ppTnfXT8W1uWTHHa/6/1DTWmon511ZjiMshmAqAD
Mg==
-----END CERTIFICATE-----`,
	}
)

func setCaller(stub *shimtest.MockStub, caller mockCaller) {
	identity := msp.SerializedIdentity{
		Mspid:   caller.mspId,
		IdBytes: []byte(caller.certPem),
	}
	d, _ := proto.Marshal(&identity)
	stub.Creator = d
}
