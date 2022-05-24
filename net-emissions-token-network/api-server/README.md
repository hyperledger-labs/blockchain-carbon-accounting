# Database Layer and API Server 

This component contains a postgresql database layer and API server for searching for tokens and wallets.  It can be used to search for tokens by fields and json metadata of token and for wallets to get the user's identities, which are not published on the blockchain but may be known to the operator the dApp.

## Setting Up

Copy the file `.env.SAMPLE` to `.env` and fill in your database information.

To synchronize with public networks, we will need an API from Moralis:

* Sign up [Moralis](https://moralis.io/)
* Go to admin page and select `Speedy Nodes` tab.
* Select `Binance Network Endpoints` and switch into `WS`.
* You can find `wss://speedy-nodes-nyc.moralis.io/<API_KEY>/bsc/testnet/ws`.
* You can use this `API_KEY` as `MORALIS_API_KEY` in `.env`.

## Run server

Run `npm install`.

Run `npm run dev`.

If you are using Hardhat local development mode and have used the `npx hardhat setTestAccountRoles` to set up some test wallets with roles, then you can load them into the database with

`psql blockchain-carbon-accounting < seedHardhatDemoWallets.sql `

# Usage

* Issue some tokens by `emissions.js` or from the Issue Tokens screen. 
* Go to the Dashboard or Issue Tokens screens, and you'll be able to search for your tokens.  This search uses the database.
* Go to the Manage Roles screen, search for a wallet or a name, and you'll be able to see the wallet and its roles.  The search and the identities are both from the database.

## API Server

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
