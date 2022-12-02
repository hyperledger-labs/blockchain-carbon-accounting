# blockchain-carbon-accounting

[![CI](https://github.com/hyperledger-labs/blockchain-carbon-accounting/actions/workflows/ci.yml/badge.svg)](https://github.com/hyperledger-labs/blockchain-carbon-accounting/actions/workflows/ci.yml)
[![Test Report](https://github.com/hyperledger-labs/blockchain-carbon-accounting/actions/workflows/test-report.yml/badge.svg)](https://github.com/hyperledger-labs/blockchain-carbon-accounting/actions/workflows/test-report.yml)

This project uses web3/blockchain/distributed ledger to solve several key challenges for climate change:

- Storing data from energy use, renewable energy production, carbon removal or reduction projects in a permissioned data ledger.
- Tokenizing emissions audits, carbon credits, and energy attribute certificates.
- Validating climate projects by voting through a Distributed Autonomous Organization (DAO).

With it you could implement a variety of use cases, such as developing and monetizing carbon emissions reductions projects; emissions calculations for individuals, companies, and supply chains; and using carbon credits to implement emissions reduction plans.

The code is divided into the following components:

- [lib](lib/README.md): Common library of code
- [fabric](fabric/README.md): [Emissions Data Channel](https://wiki.hyperledger.org/display/CASIG/Emissions+Data+Channel)
- [hardhat](hardhat/README.md): [Net Emissions Token Network](https://wiki.hyperledger.org/display/CASIG/Emissions+Tokens+Network) and [Climate DAO](https://wiki.hyperledger.org/display/CASIG/DAO)
- [app](app/README.md): Applications built on these components, including React user interface and supply chain emissions calculations.
- [open-offsets-directory](open-offsets-directory/README.md): [Voluntary Carbon Offsets Directory](https://wiki.hyperledger.org/display/CASIG/Completed+Research%3A+Voluntary+Carbon+Offsets+Directory+Research)
- [secure-identities](secure-identities/README.md): Support for signing transactions using Vault or web-socket
- [supply-chain](app/supply-chain/README.md): [Supply Chain Decarbonization](https://wiki.hyperledger.org/display/CASIG/Supply+Chain+Decarbonization)
- [data](data/README.md): Data for setting up the applications

To try it out, use the demo at [emissions-test.opentaps.org](https://emissions-test.opentaps.org/) or follow the steps in [Getting Started](Getting_Started.md) to set it up yourself.

For more details, see the

- [User's Guide](User_Guide.md)
- [Open Source Carbon Accounting video](https://www.youtube.com/watch?v=eNM7V8vQCg4)
- [Hyperledger Carbon Accounting and Neutrality Working Group](https://wiki.hyperledger.org/display/CASIG/Carbon+Accounting+and+Certification+Working+Group)
- [Setup Guide](Setup.md) and documentation in each component.

Get involved!  Please see [How to Contribute](https://wiki.hyperledger.org/display/CASIG/How+to+Contribute) to help us build this open source platform for climate action.

## Git Notes

Please sign off all your commits. This can be done with

    $ git commit -s -m "your message"

