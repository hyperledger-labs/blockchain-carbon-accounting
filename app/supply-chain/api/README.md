# REST API


## Run server

To start the API server run following command in the repository root directory:
```
npm run supply-chain:api
```

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
--form 'issuedTo="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"' \
--form 'input=@"input.json"'
```

Python script examples for using the REST API is in the [`/example`](../example/README.md) directory.

