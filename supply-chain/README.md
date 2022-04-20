`# Supply Chain Emissions Application

## WARNING

'''The demo public/private keys in this directory should not be used for any real encryption, since they are all publicly known.''' 

## Installing

Following the steps from [data/postgres](../data/postgres/README.md) to install the emissions factors database.

Copy `.env.SAMPLE` to `.env`.  You will need to fill in:
- Your PostgreSQL host, port, username, and password.
- The Google API key for the [Google DistanceMatrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) and [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/overview).
- If you have access to the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US), your UPS username, password, and access key.

Make sure you are using node version 16.

Install dependencies here with

```
npm install
```

Install IPFS.  Then start the daemon in another window.

```
ipfs daemon
```

## Trying it

First generate one or more key pairs for encrypting and decrypting files on IPFS.
```
npm run cli -- -generatekeypair user1 -generatekeypair user2
```

Run by giving a JSON file of activities to process and one or more public key for encryption with:
```
npm run cli -- -pubk user1-public.pem [-pubk user2-public.pem] -f input.json
```

To create emissions requests instead of issue token with given input.json run:
```
npm run cli -- -pubk user1-public.pem -f input.json -queue
```

To randomly assign emission auditors for new emissions requests run:
```
npm run cli -- -processrequests
```

To get a more complete output use the `-verbose` flag, this will output the grouped activities by type, while shipments
are further grouped by shipping mode.
```
npm run cli -- -pubk user1-public.pem [-pubk user2-public.pem] -f input.json -verbose
```
In this case the IPFS content ID can be retrieved in the group "token.manifest" eg:
```
...
"token": {
    ...
    "manifest": "ipfs://<content_id>",
    ...
},
.....
```

Try fetching the encrypted content from IPFS by specifying the IPFS content ID and the private key of one of the associated public keys that were used above:
```
npm run cli -- -pk user1-private.pem -fetch <content_id>
```

## REST API

A REST API is provided for integration from another application, such as legacy shipping or ERP system, in the [`/api/`](api/README.md) directory.

Examples for using the REST API is in the [`/example`](example/README.md) directory.

To start the API server:
```
npm run api
```

