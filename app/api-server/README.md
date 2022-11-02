# API Server

This component contains API server for searching for tokens and wallets.  It can be used to search for tokens by fields and json metadata of token and for wallets to get the user's identities, which are not published on the blockchain but may be known to the operator the dApp.

## Run server

Start api-server from repository root directory:
```
npm run api-server
```

If you are using Hardhat local development mode, set demo hardhat seed wallets.
In another terminal run:
```
npm run api-server:loadDemoSeeds
```

## build docker container

Used by the fabric network. See `fabric/README.md`

```
npm run docker:build
```
To publish this to a contianer repository.
```
npm run docker:push
```
*Make sure to set accessibilty on the respository. Currently set to ghcr.io/net-zero-project/blockchain-carbon-accounting/api-server. TO-DO migrate this to hyperledger-labs.*


# Usage

* Issue some tokens by `npm run supply-chain:cli` or from the frontend Issue Tokens screen.
* Go to the Dashboard or Issue Tokens screens, and you'll be able to search for your tokens. This search uses the database.
* Go to the Manage Roles screen, search for a wallet or a name, and you'll be able to see the wallet and its roles. The search and the identities are both from the database.

The api server can be accessed at  `http://127.0.0.1:8000`.  To use it, for example to get Tokens data:

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


## Synchronization

The `firstBlock` should be configured in `.env` based on the contract creation which can be obtained from a chain explorer tool, for example on Binance testnet `https://testnet.bscscan.com/address/<CONTRACT_ADDRESS>`.
This allows setting a sane starting block for the event fetching.

The server will synchronize with the blockchain on startup based on the `Sync` entity that stores the last synced block number. This include:
 * token balances, by looking at `TransferSingle` events.
 * wallet roles, by looking at the role related events (`Registered` and `Unregistered`) to get a list of account addresses then by fetching the contract current roles for those addresses.

Tokens themselves are synced regardless of block numbers by checking the contract token IDs (which are sequential).

On the `hardhat` network (when `.env` has `LEDGER_ETH_NETWORK="hardhat"`) the startup sync will always start at block 0 since fetching events locally is cheap and the state resets whenever `hardhat` restarts.

For blockchain networks that support event subscription we listen to the same events that are parsed during startup.
