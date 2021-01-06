#!/bin/bash

# Scipt sets the env variables of your organization so you can operate with the network and use the binary tools of the peer and orderer


export ORDERER_TLSCA=/Users/user1/Documents/GitHub/ca2sig/hyperledger-fabric-kubernetes/crypto-material/emissionsaccounting.yourdomain.de/tlsca/tlsca.emissionsaccounting.yourdomain.de-cert.pem
export ORDERER_ADDRESS=fabric-orderer1.emissionsaccounting.yourdomain.de:443
export CORE_PEER_LOCALMSPID=sampleorg
export CORE_PEER_TLS_ROOTCERT_FILE=/Users/user1/Documents/GitHub/ca2sig/hyperledger-fabric-kubernetes/crypto-material/emissionsaccounting.yourdomain.de/peers/fabric-peer1.emissionsaccounting.yourdomain.de/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/Users/user1/Documents/GitHub/ca2sig/hyperledger-fabric-kubernetes/crypto-material/emissionsaccounting.yourdomain.de/users/Admin@emissionsaccounting.yourdomain.de/msp
export CORE_PEER_ADDRESS=fabric-peer1.emissionsaccounting.yourdomain.de:443
export FABRIC_CFG_PATH=/Users/user1/Documents/GitHub/ca2sig/hyperledger-fabric-kubernetes/fabric-config
export CORE_PEER_TLS_ENABLED="true"

echo "+++++ENVs are set+++++" 