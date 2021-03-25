CHANNEL_NAME="utilityemissionchannel"
# CC_NAME="emissionscontract"
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
LOG_FILE_NAME=chaincode${2}_log.txt

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

set +x
cat log.txt
#verifyResult $res "Invoke execution on $PEERS failed "
echo "===================== Query chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

cd ./chaincode/one
# tar connection.json and metadata.json
tar cfz code.tar.gz connection.json
tar cfz utilityemissions-chaincode.tgz code.tar.gz metadata.json

cd ../..

./bin/peer lifecycle chaincode install chaincode/one/utilityemissions-chaincode.tgz >&$LOG_FILE_NAME

CHAINCODE_CCID=`cat ${LOG_FILE_NAME} | grep "Chaincode code package identifier:" | awk '{split($0,a,"Chaincode code package identifier:"); print a[2]}'`

### Examples
# sudo bash ./scripts/installChaincode.sh 1 2

