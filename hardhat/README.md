# Net Emissions Tokens Network

The (net) emissions tokens network is a blockchain network for recording and trading the emissions from different channels such as the [utility emissions channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel+Project), plus offsetting Renewable Energy Certificates and carbon offsets. Each token represents either an emissions debt, which you incur through activities that emit greenhouse gases, or an emissions credit, which offset the debt by removing emissions from the atmosphere.

Read more on the [Hyperledger Emissions Tokens Network Wiki page](https://wiki.hyperledger.org/display/CASIG/Emissions+Tokens+Network+Project).

To see a demo of how it works, check out [this video](https://youtu.be/C-cUjQLDGJw).

See the documentation for more information and instructions: 

- [`docs/using-the-contracts.md`](docs/using-the-contracts.md) for a broad overview of the contracts and how to compile, test, and deploy with Hardhat
- [`../app/frontend/README.md`](../app/frontend/README.md) for running the React interface that connects to the contracts either locally with Hardhat Network or to a public chain
- [`docs/verifying-contracts-with-etherscan.md`](docs/verifying-contracts-with-etherscan.md) for verifying with Etherscan to be able to format and make contract calls from their interface
- [`docs/testing-with-remix.md`](docs/testing-with-remix.md) for testing with the web-based Remix IDE with the remixd daemon
- [`docs/deployment.md`](docs/deployment.md) for deploying the contracts to different networks
- [`docs/setting-up-multisig.md`](docs/setting-up-multisig.md) for setting up MultiSig signing for contract admin 
- [`docs/carbon-tracker.md`](docs/carbon-tracker.md) for the CarbonTracker contract from the [Oil & Gas Methane Emissions Reduction Project](https://wiki.hyperledger.org/pages/viewpage.action?pageId=62241904) 

## Running tests

To run the contract and integration tests, while hardhat is not otherwise running run:
`npx hardhat test`

NOTE about DB: the tests expect a Postgres DB named `blockchain-carbon-accounting-test` to exist (any data there will be wiped at the beginning of the tests).
If you need to set credentials for it, pass them as environment variables to the test runner: `POSTGRES_USER=xxx POSTGRES_PASSWORD=xxx npx hardhat test`
