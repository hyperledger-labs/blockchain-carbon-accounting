`# Supply Chain Emissions Application

## WARNING

'''The demo public/private keys in this directory should not be used for any real encryption, since they are all publicly known.''' 

## Installing

Following the steps from [app/data-loader](../app/data-loader/README.md) to install the emissions factors database.

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
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
```

## Trying it

First generate one or more key pairs for encrypting and decrypting files on IPFS.
```
npm run cli -- -generatekeypair user1 -generatekeypair user2
```

Run by giving a JSON file of activities to process and RSA public keys
```
npm run cli -- -rsapubk user1-public.pem [-pubk user2-public.pem] -f input.json
```

To create emissions requests instead of issue token with given input.json run:
```
npm run cli -- -f input.json -queue
```

To randomly assign emission auditors for new emissions requests, first make sure that you have run `setTestAccountRoles` (see [Net Emissions Contracts Docs](../net-emissions-token-network/docs/using-the-contracts.md ).) 

Then load the emissions auditors with `seedHardhatDemoWallets.sql` from [Net Emissions Contract API Server](../net-emissions-token-network/api-server/README.md) 

Finally run:
```
npm run cli -- -processrequests
```

To get a more complete output use the `-verbose` flag, this will output the grouped activities by type, while shipments
are further grouped by shipping mode.
```
npm run cli -- -rsapubk user1-public.pem [-rsapubk user2-public.pem] -f input.json -verbose
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
npm run cli -- -rsapk user1-private.pem -fetch <content_id>/content.json
```

### Metamask Wallet Key

The script also supports encrypting and decrypting using Metamask's wallet.  This requires:
- Providing an encrypted public key from Metamask wallet
- Decrypting with the private key of your wallet

This feature is currently disabled in the dApp UI because Metamask decrypt can be very slow for large files.  You can however test it here by uncommenting the block for `ProvideMetamaskEncryptionKeyButton` in `update-my-wallet-form.tsx` in the `net-emissions-tokens/interface/` react app.  Then once you have the Metamask encrypted public key saved in Wallet.metamask_encrypted_public_key, you can use it to encrypt and decrypt files.

Run by giving a JSON file of activities to process and wallet address
```
npm run cli -- -walletaddr <wallet_address> -f input.json
```

for example, 
```
npm run cli -- -walletaddr 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 -f input.json
```

Try fetching the encrypted content from IPFS by specifying the IPFS content ID and the private key of wallet address that were used above:
```
npm run cli -- -walletpk priv.key -fetch <content_id>/content.json
```

## REST API

A REST API is provided for integration from another application, such as legacy shipping or ERP system, in the [`/api/`](api/README.md) directory.

Examples for using the REST API is in the [`/example`](example/README.md) directory.

To start the API server:
```
npm run api
```

