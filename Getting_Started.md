# Getting Started Instructions

These are some general notes for developers to get started.  

Please also read the README.md and installation instructions in each component.  

Create database:
```
createdb blockchain-carbon-accounting
```

Set parameters in the the repository root .env

Install ipfs and run:
```
ipfs daemon --enable-pubsub-experiment
```

Make sure you're using node version 16.  Check it with this command in every terminal:
```
node -v
```

If it's not switch to node version 16
```
nvm use 16
```

In the repository root directory run:

```
npm install
npm run loadSeeds
```

Run hardhat:

```
npm run hardhat
```

In another terminal, setup default roles and some demo issued tokens by running:
```
npm run hardhat-setup
```

Copy `.env.SAMPLE` to `.env` and fill in the configuraiton set up.

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

