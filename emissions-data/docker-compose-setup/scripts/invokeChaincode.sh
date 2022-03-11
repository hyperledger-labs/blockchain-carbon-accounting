#!/bin/bash
CHANNEL_NAME="emissions-data"
#CC_NAME="emissionscontract"
CC_NAME="emissions"
# CC_SRC_PATH=${3:-"NA"}
# CC_SRC_LANGUAGE=${4:-"javascript"}
# CC_VERSION=${5:-"1.0"}
# CC_SEQUENCE=${6:-"1"}
# CC_INIT_FCN=${7:-"NA"}
# CC_END_POLICY=${8:-"NA"}
# CC_COLL_CONFIG=${9:-"NA"}
# DELAY=${10:-"3"}
# MAX_RETRY=${11:-"5"}
# VERBOSE=${12:-"false"}

export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

# import utils
. scripts/envVar.sh true

fcn_call=$1
shift
parsePeerConnectionParameters $@
res=$?
verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

set -x

# IMPORTANT: For this script to run, you must go back to scripts/envVar.sh and change all the CORE_PEER_ADDRESS to localhost

echo $PEER_CONN_PARMS
echo invoke fcn call:${fcn_call}
# Use this one if you're using the Mac, otherwise keep the other peer
#./bin_mac/peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer1.auditor1.carbonAccounting.com --tls --cafile $ORDERER_AUDITOR1_CA -C $CHANNEL_NAME -n ${CC_NAME} $PEER_CONN_PARMS -c ${fcn_call} >&log.txt
./bin/peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer1.auditor1.carbonAccounting.com --tls --cafile $ORDERER_AUDITOR1_CA -C $CHANNEL_NAME -n ${CC_NAME} $PEER_CONN_PARMS -c ${fcn_call}
res=$?

set +x
cat log.txt
verifyResult $res "Invoke execution on $PEERS failed "
echo "===================== Invoke transaction successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

### Examples
# ./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["SmallUtility","MyCompany","2020-06-01","2020-06-30","150","KWH"]}' 1 2 3

# ./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["SmallUtility","MyCompany","2020-06-01","2020-06-30"]}' 1
