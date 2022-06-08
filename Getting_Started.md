# Getting Started Instructions

These are some general notes for developers to get started.  

Please also read the README.md documentations, net-emissions-tokens/docs/ directory, and installation instructions in each component.  

Create database:
```
createdb blockchain-carbon-accounting
```

Set parameters in the the repository root .env

Install ipfs and run:
```
ipfs daemon --enable-pubsub-experiment
```

In the repository root directory run:

```
npm install
npm run loadSeeds
```

Run hardhat:

```
npm run net-emissions-token-network:hardhat
```

Setup default roles and some demo issued tokens,
in other terminal run:
```
npm run net-emissions-token-network:hardhat-setup
```

Start api-server from repository root directory:
```
npm run api-server
```

Set demo hardhat seed wallets:
```
npm run api-server:loadDemoSeeds
```

Issue tokens using cli:
```
npm run supply-chain:cli -- -rsapubk supply-chain/demo1-public.pem -f supply-chain/input.json
```

Create emissions audit requests using cli:
```
npm run supply-chain:cli -- -f supply-chain/input.json -queue
```

Process requests (sent to auditors):
```
npm run supply-chain:cli -- -processrequests
```

Run interface app:
```
npm run frontend
```

Emissions audit requests can be requested in the dApp by any wallet with the Consumer role.


To get the documents for tokens from IPFS:
```
npm run supply-chain:cli -- -fetch <content> -rsapk supply-chain/<auditor-private.pem>
```

Note this works even if the file is uploaded to IPFS on a remote server.

