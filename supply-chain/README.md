# Supply Chain Emissions Application

## Installing

Sign up for the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US) to get the access key.  

Copy `.env.SAMPLE` to `.env` and fill in your UPS username and password and access key in `.env`.

Sign up for the [Google DistanceMatrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) and [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/overview) and get an access key for both API's.

Fill in the Google API key in `.env`.

Install dependencies here and in `utility-emissions-channel/typescript_app` with

```
npm install
```

## Trying it

First generate one or more key pairs for encrypting and decrypting files on IPFS.
```
node ups.ts -generatekeypair user1 -generatekeypair user2
```

Run by giving a list of tracking numbers and/or using a file containing one tracking number per line and one or more public key for encryption with:

```
node ups.js -pubk user1-public.pem [-pubk user2-public.pem] [-f file.txt] <tracking-number1> [tracking-number2] ...
```

Note the IPFS content ID from the response, which is in the "ipfs.path" object and the "token.metadata" eg:
```
...
"token": {
    ...
    "metadata": "ipfs://<content_id>",
    ...
},
...
"ipfs": {
    "path": "<content_id>",
    ...
}
...
```

Try fetching the encrypted content from IPFS by specifying the IPFS content ID and the private key of one of the associated public keys that were used above:
```
node ups.js -pk user1-private.pem -fetch <content_id>
```
