# Network artifacts

This directory contains the initial configuration of the Hyperledger Fabric network which is operated by the Carbon Accounting Consortium under the umbrella project of the Hyperledger Climate Action and Accounting SIG. The consortium consists of three organizations emitras, opentaps, and opensolarx.

The following data is stored:
- MSP configuration of each organization in `./organizations/ORG_NAME/msp`
- TLS certificates of the orderer nodes in `./organization/ORG_NAME/orderers/ORDEREr_ADDRESS/TLS/server.cert`
- configtx.yaml file containing the initial configuration of the network
- genesis-files
--- orderer.genesis.block
--- emissions-data.tx

### Create config maps of channel articats
1. Orderer
```bash
# create configmap of orderer.genesis.block
kubectl create cm system-genesis-block  --from-file=./network-artifacts/genesis-files/orderer.genesis.block -n yournamespce
```

2. Peer
```bash
# Create configmap of channel tx
kubectl create cm emissions-data  --from-file=./network-artifacts/genesis-files/emissions-data.tx -n yournamespace
```