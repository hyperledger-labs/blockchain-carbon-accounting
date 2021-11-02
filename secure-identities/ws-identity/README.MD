# Web Socket Identity Server

An express.js app to access cryptographic signing capabilities over web-socket.

## WS-X.509 identity provider
The ws-identity server supports X.509 certificates issued by a Certificate Authority (CA) where corresponding private keys are stored offline in an external wallet. The server connects identities with a distributed network (e.g., Hyperledger Fabric). This could include:
* an IoT device
* an auditor

[ws-identity-client](../ws-identity-client/README.md) setups the backend between ws-identity server and Fabric network. A WS-X.509 identity provider is setup within the [cactus-plugin-ledger-connector-fabric](https://github.com/hyperledger/cactus/pull/1333).

ws-identity server configuration:
```typescipt
export interface IWebSocketConfig {
  endpoint: string; // ws-identity server endpoint, e.g., http://[ip]:[port]
  pathPrefix: string; // a particular path for web-socket connections to the server
}
```
pathPrefix: 
* '/session/new': request new sessionId issued for the pubKeyHex of users of crypto identity. The ws-identity server will only open a new web-socket client for requests originating from the same IP address used to request the sessionId.
* '/identity/sign': request signature by an external crypto wallet
* '/identity/get-pub': request pub-key-pem from external crypto wallet
    
/identity paths require following key data submitted to backedn client for authentication.
```typescipt 
export interface WebSocketKey {
  sessionId: string;
  signature: string; //proves user owns the publicKey of the sessionId
} 
```
## WS Crypto Wallet
The prototype [ws-wallet](../ws-wallet/README.md) setups and stores private keys on clients external device and creates the client connection with the ws-identity server to interact with the Fabric network.

## build
Install dependencies
```
npm install
```
```
npm run build
```
## setup the docker image
```
npm run docker
```

## start server
A prebuilt docker image can be downloaded from docker hub
```docker
docker pull brioux/ws-identity:0.0.6
```
or run locally
```
npm run start
```
