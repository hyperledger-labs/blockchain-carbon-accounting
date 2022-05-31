# Getting Started Instructions

These are some general notes for developers to get started.  

You will need to run `npm install` in the following directories:
- data/
- supply-chain/
- net-emissions-tokens/api-server/
- net-emissions-tokens/interface/

Please also read the README.md documentations, net-emissions-tokens/docs/ directory, and installation instructions in each component.  

Run ipfs daemon --enable-pubsub-experiment

createdb blockchain-carbon-accounting

From ./net-emissions-token-network
npx hardhat node
npx hardhat setTestAccountRoles --network localhost --contract 0x610178dA211FEF7D417bC0e6FeD39F05609AD788

From ./data/postgres/

run loadData.sh

psql blockchain-carbon-accounting < seeds/*

From ./net-emissions-token-network/api-server/

npm run dev
psql blockchain-carbon-accounting < seedHardhatDemoWallets.sql

Emissions audit requests can be requested in the dApp by any wallet with the Consumer role, or from `supply-chain/` directory by running 

```
npm run cli -- -f input.json -queue
```

Emissions audit requests can be sent to auditors with `npm run cli -- -processrequests`

To get the documents for tokens from IPFS, `npm run cli -- -rsapk <auditor-private.pem> -fetch <content>`  Note this works even if the file is uploaded to IPFS on a remote server.

