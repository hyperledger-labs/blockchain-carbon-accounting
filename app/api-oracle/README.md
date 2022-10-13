# Oracle API Server

A proxy REST API server to query an emissions object from an external data source and relay the reponse to the peers running Fabric emissions_data channels.

I is used by Fabric peers to acces external data sources, emission calculators, and devices that organizations (e.g., auditors) use to issue emissionRecords 

- Interpret different emisson queries, and relay to the peers if the request (i.e., external data source) is valid. Currently only supports the native api-server trpc router to query DB (uses API_SERVER_TRPC .env variable)

- Provides a secure connection for Peers between the Oracle and each data source. Handles CORS policy for all the peers (rather than individaully)

- Handles multiple querie by peers. First request is cached (unique hash of request sent to orace) and response relayed to each peer to avoid multiple calls to external databse, and ensure all peers receive mathcing query responses.


![rest-api workflow](/rest-api.png)
## Run server

Start rest-api from repository root directory:
```
npm run api-oracle
```

The development oracle api deafults to  `http://127.0.0.1:3002`

## Usage
  
All external data service called by this oracle API should return a `CO2EmissionFactorInterface` object as deined in @blockchain-carbon-accounting/emissions_data_lib

To use it, for example to get data from postgres DB, pass ``endpoint, query, queryParams`` body arguments to `/recordEmissions`.

POST `/recordEmissions`
will return a `CO2EmissionFactorInterface` object
```
{
    "emission": {
        "value": 2.607667092612959e-9,
        "uom": "tons"
    },
    "division_type": "STATE",
    "division_id": "SC",
    "renewable_energy_use_amount": 70.85070059849463,
    "nonrenewable_energy_use_amount": 929.1492994015053,
    "year": 2020
}
```

TO-DO: setup connection to get emission by activity using the `emissionsFactors.getEmissions` /app/api-server trpc AppRouter 

POST `/postgres/activity`
```
{
    "emission": {
        "value": 102,
        "uom": "kg"
    },
    "year": 2021
}
```
Query parameters:
* Activity:
``
scope, level1, level2, level3, level4, text, amount, uom
``

Query parameters:
* uuid
* usageUOM
* usage
* thruDate

# Test

From the app/api-oracle directory Run
```
npm Test
```

This will run a test for the api's endpoints

## Create Docker image

From the app/api-oracle directory Run
```
npm run docker:build
```

This will build the image to be published to:
ghcr.io/net-zero-project/blockchain-carbon-accounting/oracle-api
```
npm run docker:push
```
*All packages should eventually be published to official repository the hyperledger-labs project*
