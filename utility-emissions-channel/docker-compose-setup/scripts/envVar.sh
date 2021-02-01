#!/bin/bash

export CORE_PEER_TLS_ENABLED=true
export ORDERER_AUDITOR1_CA=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp/tlscacerts/tlsca.auditor1.carbonAccounting.com-cert.pem
export PEER1_AUDITOR1_CA=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/ca.crt
export PEER1_AUDITOR2_CA=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/ca.crt
export PEER1_AUDITOR3_CA=${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/ca.crt

# # Set OrdererOrg.Admin globals
# setOrdererGlobals() {
#   export CORE_PEER_LOCALMSPID="OrdererMSP"
#   export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
#   export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp
# }

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  echo "Using organization ${USING_ORG}"
  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_LOCALMSPID="auditor1"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_AUDITOR1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/Admin@auditor1.carbonAccounting.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_LOCALMSPID="auditor2"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_AUDITOR2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/Admin@auditor2.carbonAccounting.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_LOCALMSPID="auditor3"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER1_AUDITOR3_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/Admin@auditor3.carbonAccounting.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {

  PEER_CONN_PARMS=""
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    PEER="peer1.auditor$1"
    ## Set peer adresses
    PEERS="$PEERS $PEER"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $CORE_PEER_ADDRESS"
    ## Set path to TLS certificate
    TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER1_AUDITOR$1_CA")
    PEER_CONN_PARMS="$PEER_CONN_PARMS $TLSINFO"
    # shift by one to get to the next organization
    shift
  done
  # remove leading space for output
  PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    echo $'\e[1;31m'!!!!!!!!!!!!!!! $2 !!!!!!!!!!!!!!!!$'\e[0m'
    echo
    exit 1
  fi
}
