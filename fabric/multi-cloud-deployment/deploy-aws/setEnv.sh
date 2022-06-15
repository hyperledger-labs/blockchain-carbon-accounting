#!/bin/bash

# Scipt sets the env variables of your organization so you can operate with the network and use the binary tools of the peer and orderer

ROOT_DIR="/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deployment/deploy-aws"

export ORDERER_TLSCA=${ROOT_DIR}/crypto-material/opensolarx.com/tlsca/tlsca.opensolarx.com-cert.pem
export ORDERER_ADDRESS=fabric-orderer.opensolarx.com:443
export CORE_PEER_LOCALMSPID=opensolarx
export CORE_PEER_TLS_ROOTCERT_FILE=${ROOT_DIR}/crypto-material/opensolarx.com/peers/fabric-peer.opensolarx.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${ROOT_DIR}/crypto-material/opensolarx.com/users/Admin@opensolarx.com/msp
export CORE_PEER_ADDRESS=fabric-peer.opensolarx.com:443
export FABRIC_CFG_PATH=${ROOT_DIR}/fabric-config
export CORE_PEER_TLS_ENABLED="true"

export CORE_PEER_ADDRESS_2=fabric-peer1.org2.com:443
export CORE_PEER_TLS_ROOTCERT_FILE_2=../network-artifacts/organizations/emitras/msp/tlscacerts/ca.crt

echo "ENVs are set"
