# TRUSTID CHAINCODE 

A chaincode or smart contract, with all the functionalities allowing developers to create, manage, and export digital assets on the Hyperledger Fabric network

## Identity 

There are two types of identities. Identities for individuals and identities for services.

Identity for individual is represented with the following structure:

- `DID` :  `<string>` Unique decentralized identifier of the identity. It's stored as the key in the KV storage
- `PublicKey` :  `<string>` Public Key in x509 format 
- `Controller`    :  `<string>`   Issuer of the identity represented with its own DID
- `Access` :  `<int>` Type of permission in order to create other identities. 0 is super admin, 1 can create identities, 2 cannot create idenitites


Identity for services is represented with the following structure:

- `DID` :  `<string>` Unique decentralized identifier of the service. It's stored as the key in the KV storage
- `Name` :  `<string>` Name of the chaincode deployed in the network
- `Public`    :  `<bool>` Determines if the chaincode is public for all users or only for users that has access
- `Access` :  `<map[string]int>` Mapp of users that have access to the service
- `Controller` :  `<string>` DID of the controller of the service
 


## Chaincode internal functionalities

### Init
Initializes the chaincode with the first controller identity that will be the issuer of identities. This identity is created with the following args:

```js
{
		did: "did:vtn:trustos:company:0",
		controller: "did:vtn:trustos:company:0",
		publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7NBDzVMESXU/yuARe7YU\nGrkgNMZh5eA5w3PgxgYZf/isDLPHvmSM2Q9cTauDroriGInikQxtZ/CI4+9Qi4Rd\nJCHjeWhzw0hTIXhHoohyo9QTbUVetb4RBDJEcNqFrpztAojn8Ib5EF2soBFtBLyT\nguxlizcWwTZvv+KxHGBg/tUE7JIqw3YzmEK31faR2HhkPPqxTQ9F+h4SOnY9e6Cf\nh75PpjouzarpntSVkAqv/Ot5kV3O4TcWhB0vUr/HZwx2iX+LEyYock8Sx4Op20/g\n7k3J3rYhMGTHfkKMhZjX9QoZ8uBRiSxieAaia0yZSIcycgE6Aqu6KT+WaQn4bCnh\nwQIDAQAB\n-----END PUBLIC KEY-----"
} 

```

---

### Invoke

All invokes are called via the proxy function. The proxy function args are: 

- `DID` :  `<string>` DID of the identity that is calling any function in the chaincode
- `Payload` :  `<string>` Arguments signed with its private key

```js
{
		did: "did:vtn:trustos:company:0",
		payload: "eyJhbGdvcml0aG0iOiJQUzI1NiIsImFsZyI6IlBTMjU2In0.eyJmdW5jdGlvbiI6ImNyZWF0ZVNlbGZJZGVudGl0eSIsInBhcmFtcyI6eyJkaWQiOiJkaWQ6dnRuOnRydXN0b3M6dGVsZWZvbmljYToyIiwicHVibGljS2V5IjoiLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1cbk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdTA0ZTlWTE5uMUpIZ1lOSU1SclVcblE0SkhoSG4wd1p4UENEOWtjUHo2M1NNQmlZbkN0Uk0yNHBLODZnQWFUdU00RDhWMkxqckE2ZHZCV3dCT2YydUZcbi80aXJJUlhNT2FJNTh1dFhFQ3NBMHI2Q3cyU3BDWVNWOEJLMXk4aHBuc3cwMi9UMHhZUkRiRnFmaHZxYQ",
		
} 

```

The payload is signed in jws format. The content of the payload has the following form: 

- `Function` :  `<string>` Name of the internal function of the chaincode
- `Params` :  `<string>` Specific params of the function. This params will be specified in the different functions listed below.

```js
{            
        function: "createSelfIdentity",
        params: {
                 did: "did:vtn:trustos:company:2",
                 publicKey: publick.toString() 

        }		
} 

```


- **`createSelfIdentity()`** <br>
Creates an identity without a controller's verification. In this case, instead of sending DID in the args, it's necessary to send the publicKey to check the signature. This is because this identities isn't in the ledger yet.

```js
{
      publicKey:"{{publicKey}}",
      payload:"{{payload}}"
}

```

The params in the payload has the following form:

```js
{ 
    did: "did:vtn:trustos:company:2", 
    publicKey: publick.toString() 
}

```


- **`getIdentity()`** <br>
Gets an identity using the DID.The params to sign in the payload are:
```js
{ 
    did: "did:vtn:trustos:company:2", 
}

```

- **`verifyIdentity()`** <br>
The controller verifies the identity. The params in the signed payload are
```js
{ 
    did: "did:vtn:trustos:company:2", 
}

```

- **`revokeIdentity()`** <br>
Revokes an identity. THhe params in the signed payload are:
```js
{ 
    did: "did:vtn:trustos:company:2", 
}

```

- **`createServiceIdentity()`** <br>
Creates a service identity. 
```js
{
  "serviceID":  "coren-trackscc",
  "name": "coren-trackscc",
  "access": {
  	"policy": "SAME_CONTROLLER"
  },
  "channel": "channel1"
}
```

- **`updateServiceAccess()`** <br>
Update the service access.
```js
{ 
    did: "vtn:trustos:service:1",
    access: {
  	    policy: "FINE_GRAINED",
  	    threshold: 0,
  	    access: {
  		"did:vtn:trustid:c0fd6b4749329c4acec7f4ac273d46c2b755736e9f5cae6fc62acec8d04549c6": 2
      }
    }
 
}
```
- **`updateService()`** <br>
Update the information from a Service.
```js
{ 
    did: "vtn:trustos:service:1",
    name: "chaincodeName",
    channel: "channelName"
}
```

- **`getServiceIdentity()`** <br>
Gets the information for a service, searching by DID.
```js
{ 
    did: "vtn:trustos:service:1"
}
```

- **`invoke()`** <br>
Invokes a chaincode deployed as a service in the vtn platform. Args are the function of the chaincode to call and it's args. 
```js
{ 
    did: "vtn:trustos:service:1",
     args: ["invoke", "a", "b", "1"], 
     channel: "companychannel" 
}
```


<details>
  <summary><em><strong>Errors management</strong></em> (Click to expand)</summary><br>
  
  Track chaincode errors are managed through the following nomenclature **CC-XX** which corresponds to:<br>


  | Code 	| Description 	|
|:-----:	|-----------------------------------------------------------------------	|
| CC-01 	| Error parsing any data structure 	|
| CC-02 	| Wrong number of function arguments 	|
| CC-03 	| Error managing data in Hyperledger Fabric 	|
| CC-04 	| Error invoking trust chaincode or error of some kind of functionality 	|
  

</details>




## Project configuration
This project has to be stored in the following route
```
$GOPATH/src/name_of_the_project
```

## Build vendor for chaincode
Building a vendor is necessary to import all the external dependencies needed for the basic functionality of the chaincode into a local vendor directory

If the chaincode does not run because of the vendor, it can be built from scratch:

```
cd   $GOPATH/src/name_of_the_project/src/chaincode
dep  init
```

Also if it already exists, the missing packages can be imported using the update option:
```
cd   $GOPATH/src/name_of_the_project/src/chaincode
dep  ensure -v
```

## Init the chaincode
To initialize the chaincode first is necessary to install and instantiate the chaincode on one peer of the HF network. For that action, it can be used the coren-hfservice module, abstracting the complexity of using the command-line interface


## Testing the chaincode
In postman folder there are the collection and environment to interact and test with the chaincode methods. It is only needed to import them into postman application and know to use the coren-hfservice module

You can also run the unit test executing the following commmand:

````
go test
````


