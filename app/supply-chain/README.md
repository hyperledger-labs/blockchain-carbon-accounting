# Supply Chain Emissions Application

## WARNING

'''The demo public/private keys in this directory should not be used for any real encryption, since they are all publicly known.''' 

## Usage

All commands should be run in the repository root directory.

To generate one or more key pairs for encrypting and decrypting files on IPFS run:
```
npm run supply-chain:cli -- -generatekeypair user1
```

Run by giving a JSON file of activities to process and RSA public keys:
```
npm run supply-chain:cli -- -rsapubk app/supply-chain/demo1-public.pem -f app/supply-chain/input.json
```

To create emissions requests instead of issue token with given input.json run:
```
npm run supply-chain:cli -- -f app/supply-chain/input.json -queue
```

To randomly assign emission auditors for new emissions requests, first make sure that you have run `setTestAccountRoles` (see [Net Emissions Contracts Docs](../../hardhat/docs/using-the-contracts.md ).) 

Finally run:
```
npm run supply-chain:cli -- -processrequests
```

To get a more complete output use the `-verbose` flag, this will output the grouped activities by type, while shipments
are further grouped by shipping mode.
```
npm run supply-chain:cli -- -rsapubk app/supply-chain/demo1-public.pem -f app/supply-chain/input.json -verbose
```
In this case the IPFS content ID can be retrieved in the group "token.manifest" eg:
```
...
"token": {
    ...
    "manifest": "ipfs://<content_id>/content.json",
    ...
},
.....
```

Try fetching the encrypted content from IPFS by specifying the IPFS content ID and the private key of one of the associated public keys that were used above:
```
npm run supply-chain:cli -- -fetch <content_id>/content.json -rsapk app/supply-chain/demo1-private.pem
```

## REST API

A REST API is provided for integration from another application, such as legacy shipping or ERP system, in the [`/api`](./api/README.md) directory.

