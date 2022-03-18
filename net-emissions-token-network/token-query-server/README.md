# Setup

## preliminary

* Run `hardhat` on local
* Issue some tokens by `emissions.js` or `dapp`

## Run server

Run `npm install`.

Create `.env` file and fill the following 
```
LEDGER_ETH_JSON_RPC_URL="http://localhost:8545"
LEDGER_ETH_NETWORK="hardhat"
LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS="0x610178dA211FEF7D417bC0e6FeD39F05609AD788"

PG_HOST=127.0.0.1
PG_USER=
PG_PASSWORD=
PG_PORT=5432
```
You can set change `PG_USER` and `PG_PASSWORD` based on your postgres setting.

Run `npm run dev`.

# Usage

Base URL `http://127.0.0.1:8000`

## Get Total Number of Tokens
GET `/count`

Sample response
```
{
    "status": "success",
    "count": 3
}
```

## Get Tokens 
GET `/tokens`
```
{
    "status": "success",
    "tokens": [
        {
            "tokenId": 2,
            "tokenTypeId": 3,
            "issuee": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "issuer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "fromDate": 1647529200,
            "thruDate": 1648134000,
            "dateCreated": 1647736640,
            "automaticRetiredDate": null,
            "metaObj": {
                "Type": "ground",
                "Scope": "2"
            },
            "manifest": "",
            "description": "second issue token",
            "totalIssued": 1500000,
            "totalRetired": 1500000,
            "scope": 2,
            "type": "ground"
        },
        {
            "tokenId": 3,
          ...
            "type": "ground"
        }
    ]
}
```

Query Parameters:

* `offset`(default `0`) and limit(default `25`) for pagination
* query param list `bundles`

### `bundles` format

Each params are separated by `comma(,)`. 

[field],[fieldType],[operator]

You can use multiple query bundles. 

* fieldType: `number` and `string` (`date` format is included in `number`)
* operator type: `=`, `like` for `string`, `>`, `>`, `=` for `number` type.

Order is important.

for example, 

`issuee,string,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,=`

`issuee,string,ffFb92266,like`

`scope,number,2,>`

`totalRetired,number,10000,>`
