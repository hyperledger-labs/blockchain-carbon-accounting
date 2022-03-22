# Setup

## preliminary

* Run `ipfs daemon` on local computer.
* Emissions contract is running on a network, either local hardhat or a public testnet or livenet.
* Configure `supply-chain/.env` with issuer wallet and private key and API keys.
* The `REST_API_PORT` key in that `.env` is to setup the API server port, by default it will use port 5000.
* Create public/private key pair for encrypting your file base on instructions in [`supply-chain/README.md`](../supply-chain/README.md)

## Run server

Run `npm install`.

Run `npm run dev`.

## Usage

API endpoint is by default `http://127.0.0.1:5000/issue` and accepts POST methods only.

Parameters:

* input: required FILE, the JSON file that describes the activities to process.
* issuee: required TEXT, the address of the account to issue the tokens to.
* keys: FILE, the public key to use when encrypting the IPFS metadata (can give multiple keys).
* verbose: optional TEXT, set to 'true' to have a more verbose response when issuing tokens.
* pretend: optional TEXT, set to 'true' if you do not wish to actually issue tokens but see the whole calculated values for each activity.

## Example

```
curl --location --request POST 'http://127.0.0.1:5000/issue' \
--form 'keys=@"test-public.pem"' \
--form 'issuee="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"' \
--form 'input=@"input.json"'
```

## Decrypting the data file

This must be done with the public/private key you created using `emissions.js`.  See instructions from [`supply-chain/README.md`](../supply-chain/README.md)
