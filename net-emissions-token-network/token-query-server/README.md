# API Server for searching for tokens by fields and json metadata of token

## preliminary

* Issue some tokens by `emissions.js` or `dapp`. 
* For synchronizing, we need moralis api_key.
### Getting Moralis API KEY

* Sign up [Moralis](https://moralis.io/)
* Go to admin page and select `Speedy Nodes` tab.
* Select `Binance Network Endpoints` and switch into `WS`.
* You can find `wss://speedy-nodes-nyc.moralis.io/<API_KEY>/bsc/testnet/ws`.
* You can use this `API_KEY` as `MORALIS_API_KEY` in `.env`.

## Run server

Run `npm install`.

Run `npm run dev`.

# Usage

Base URL `http://127.0.0.1:8000`

## Get Tokens 
GET `/tokens`
```
{
    "status": "success",
    "count" : 13,
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
Curl sample command

curl -H "Accept: application/json" -X GET http://localhost:8000/tokens?bundles=issuee,string,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,eq

Query Parameters:

* `offset`(default `0`) and limit(default `25`) for pagination
* query param list `bundles`

### `bundles` format

Each params are separated by `comma(,)`. 

[field],[fieldType],[operator]

You can use multiple query bundles. 

* fieldType: `number` and `string` (`date` format is included in `number`)
* operator type: `eq(equals)`, `like(contains)` for `string`, `gt(greater)`, `ls(less)`, `eq(equals)` for `number` type.

Order is important.

for example, 

`issuee,string,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,eq`

`issuee,string,ffFb92266,like`

`scope,number,2,gt`

`totalRetired,number,10000,ls`

curl -H "Accept: application/json" -X GET http://localhost:8000/tokens?bundles=issuee,string,ffFb92266,like

curl -H "Accept: application/json" -X GET http://localhost:8000/tokens?bundles=scope,number,2,gt&bundles=issuee,string,ffFb92265,like

## Get Balances

GET `/balances`
```
{
    "status": "success",
    "count": 12,
    "balances": [
        {
            "issuee": "0xA2D69B8B08FA9C5987544B6c27F69F848d746Ed6",
            "tokenId": 5,
            "available": 100000,
            "retired": 0,
            "transferred": 0
        },
        {
            "issuee": "0xA2D69B8B08FA9C5987544B6c27F69F848d746Ed6",
            "tokenId": 6,
            "available": 100000,
            "retired": 0,
            "transferred": 0
        }
    ]
}
```
Curl sample command

curl -H "Accept: application/json" -X GET http://localhost:8000/balances?bundles=issuee,string,0xA2D69B8B08FA9C5987544B6c27F69F848d746Ed6,eq

Query format is same as tokens.