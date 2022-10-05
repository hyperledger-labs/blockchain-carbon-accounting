# Getting Started Instructions

These are some general notes for developers to get started. 

*See sub-heading [Methane](#methane) for running the Methane app*
*Developers can use the same hardhat network as run below* 

Please also read the [Setup.md](./Setup.md), [README.md](./README.md) and instructions in each component.  After you have set up the database according to [data/README.md](data/README.md), proceed with the steps below.

Run IPFS.
```
ipfs daemon --enable-pubsub-experiment
```

In the repository root directory run hardhat:
```
npm run hardhat
```

In another terminal, setup default roles and some demo issued tokens by running:
```
npm run hardhat-setup
```

Start api-server from repository root directory:
```
npm run api-server
```

In another terminal, set demo hardhat seed wallets:
```
npm run api-server:loadDemoSeeds
```

Run interface app:
```
npm run frontend
```

You can now use the dApp at localhost:3000 to request emissions audits, issue audits, and issue, transfer, and retire carbon offsets.  

You can also issue emissions audit tokens using cli:
```
npm run supply-chain:cli -- -rsapubk app/supply-chain/demo1-public.pem -f app/supply-chain/input.json
```

These audited emissions tokens will be issued by the `ETH_ISSUE_BY_ACCT` in your `.env` configuration file.

You can also create emissions audit requests using cli:
```
npm run supply-chain:cli -- -f app/supply-chain/input.json -queue
```

These requests can be processed and sent to auditors:
```
npm run supply-chain:cli -- -processrequests
```

To get the documents for tokens from IPFS:
```
npm run supply-chain:cli -- -fetch <content> -rsapk app/supply-chain/<auditor-private.pem>
```

Note this works even if the file is uploaded to IPFS on a remote server.

## Methane

This app uses methane emission data for oil and gas assets.
It is designed to analyze industry emissions and issue certificates within the Carbon Tracker sub contract of NET.

Files can be downloaded as follows:
``
cd data/oil_and_gas
sh download.sh
``

To load the data into postgres:
```
npm run loadSeeds:OG
```
Note, the data loading can take some time as there are 1 million plus assets, 100k's of emission data points, and relation tables that need to be built.

start up the methane client app and server
``` 
npm run methane:dev
```

This runs the client and server concurrently.
They can be run separately using the following scripts from app/methane 

``` 
npm run methane:client
```
``` 
npm run methane:server
```

