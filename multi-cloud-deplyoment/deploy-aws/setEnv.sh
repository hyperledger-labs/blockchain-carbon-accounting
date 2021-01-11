#!/bin/bash

# Scipt sets the env variables of your organization so you can operate with the network and use the binary tools of the peer and orderer


export ORDERER_TLSCA=/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deplyoment/deploy-aws/crypto-material/opensolarx.com/tlsca/tlsca.opensolarx.com-cert.pem
export ORDERER_ADDRESS=fabric-orderer.opensolarx.com:443
export CORE_PEER_LOCALMSPID=opensolarx
export CORE_PEER_TLS_ROOTCERT_FILE=/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deplyoment/deploy-aws/crypto-material/opensolarx.com/peers/fabric-peer.opensolarx.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deplyoment/deploy-aws/crypto-material/opensolarx.com/users/Admin@opensolarx.com/msp
export CORE_PEER_ADDRESS=fabric-peer.opensolarx.com:443
export FABRIC_CFG_PATH=/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deplyoment/deploy-aws/fabric-config
export CORE_PEER_TLS_ENABLED="true"

echo "ENVs are set"