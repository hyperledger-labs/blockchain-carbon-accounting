# web-socket wallet

This project provides a simple CLI to establish web-socket connection with the [ws-identity](https://github.com/brioux/ws-identity) to receive, sign and return digests.

## Key-types

The wallet issues ECDSA keypairs of type p256 and p384 (secp256r1/secp384r1)

## Development setup
* Download dependencies
```
npm install
```

* Run in dev mode
```
npm run build
```

* Expose CLI command (see ws-wallet --help)
```
npm run local
```

## commands
### create a new key
```bash
ws-wallet new-key [keyname] [curve type: p256 | p384]
```
### get pub-key-hex
```bash
ws-wallet get-pkh [keyname]
```
### Open connection to ws-identity server
```bash
ws-wallet connect [url] [key-name] ([strict-ssl])
```
requires:
* [url] of the ws-identity host (e.g., 'http://localhost:8700')
* [key-name] of local keyfile with pub-key-hex addresss used to request new session ID
* [strict-ssl] can be set to false when testing ssl/tls enabled ws-identity server

Requests a new session Id from the ws-idenity. 
Outputs the session Id and signature as API keys to access the ws-identity server and open connction to ws-wallet from the desired application
