# API Server

This component contains a rest API server for searching emissions from external datastorage.  It can be used to search for co2emissions using either activity or ``uuid, thruDate, usage, usageUOM``.

![rest-api workflow](/rest-api.png)
## Run server

Start rest-api from repository root directory:
```
npm run api-oracle
```
# Usage

The api server can be accessed at  `http://127.0.0.1:3002`.  To use it, for example to get postgres data using activity:

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

POST `/postgres/uuid`

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
