# Supply Chain Emissions Application

## Installing

Following the steps from [data/postgres](../data/postgres/README.md) to install the emissions factors database.

Copy `.env.SAMPLE` to `.env`.  You will need to fill in:
- Your PostgreSQL username and password.
- The Google API key for the [Google DistanceMatrix API](https://developers.google.com/maps/documentation/distance-matrix/overview) and [Google Geocode API](https://developers.google.com/maps/documentation/geocoding/overview).
- If you have access to the [UPS Developer Kit](https://www.ups.com/upsdeveloperkit?loc=en_US), your UPS username, password, and access key.

Make sure you are using node version 16.

Install dependencies here, in `../emissions-data/chaincode/emissionscontract/typescript` and then in `../emissons-data/typescript_app` with

```
npm install
```

Build the application:
```
npm run build
```

## Trying it

First generate one or more key pairs for encrypting and decrypting files on IPFS.
```
node emissions.js -generatekeypair user1 -generatekeypair user2
```

Run by giving a JSON file of activities to process and one or more public key for encryption with:
```
node emissions.js -pubk user1-public.pem [-pubk user2-public.pem] -f input.json
```

To get a more complete output use the `-verbose` flag, this will output the grouped activities by type, while shipments
are further grouped by shipping mode.
```
node emissions.js -pubk user1-public.pem [-pubk user2-public.pem] -f input.json -verbose
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
node emissions.js -pk user1-private.pem -fetch <content_id>
```

## Sample JSON input

Here is an example of a `input.json`:
```json

{
  "activities": [
    {
      "id": "1",
      "type": "shipment",
      "carrier": "ups",
      "tracking": "xxxxxxxxxx"
    },
    {
      "id": "1a",
      "type": "shipment",
      "carrier": "ups",
      "tracking": "yyyyyyyy"
    },
    {
      "id": "2",
      "type": "shipment",
      "carrier": "fedex",
      "tracking": "zzzzzzzzz",
      "mode": "air",
      "from": {
        "country": "USA",
        "state_province": "CA",
        "city": "Los Angeles",
        "address": "123 Foxboro"
      },
      "to": {
        "country": "France",
        "city": "Paris",
        "address": "Grand Palais"
      }
    },
    {
      "id": "3",
      "type": "flight",
      "carrier": "Air France",
      "flight_number": "AF666",
      "from": {
        "country": "France",
        "city": "Paris",
        "address": "Charle de Gaulle"
      },
      "to": {
        "country": "Portugal",
        "city": "Lisbon"
      }
    },
    {
      "id": "4",
      "type": "unknown"
    }
  ]
}

```

## REST API

See [here](interface/README.md)

