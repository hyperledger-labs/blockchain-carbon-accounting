# Network artifacts

This directory contains the initial configuration of the Hyperledger Fabric network which is operated by the Carbon Accounting Consortium under the umbrella project of the Hyperledger Climate Action and Accounting SIG. The consortium consists of three organizations emitras, opentaps, and opensolarx.

The following data is stored:
- MSP configuration of each organization in `./organizations/ORG_NAME/msp`
- TLS certificates of the orderer nodes in `./organization/ORG_NAME/orderers/ORDEREr_ADDRESS/TLS/server.cert`
- configtx.yaml file containing the initial configuration of the network
- genesis-files
--- orderer.genesis.block 
--- utilityemissionchannel.tx
