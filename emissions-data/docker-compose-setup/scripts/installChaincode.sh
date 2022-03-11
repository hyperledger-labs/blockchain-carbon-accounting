#!/bin/bash
CHANNEL_NAME="emissions-data"
# CC_NAME="emissionscontract"
LOG_FILE_NAME=chaincode${2}_log.txt
LOCKDATA_LOG_FILE_NAME=datalock_chaincode${2}_log.txt
CC_SUBDIR="one"
LOCKDATA_CC_SUBDIR="datalockOne"
NODE_SUBDIR="node-one"
CC_NN=${2}

if [ $CC_NN -eq 2 ]; then
  CC_SUBDIR="two"
  LOCKDATA_CC_SUBDIR="datalockTwo"
  NODE_SUBDIR="node-two"
fi

export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

# import utils
# use 'true' when run script on local computer
# use 'false' when run script with docker exec cli
. scripts/envVar.sh false

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

cd ./chaincode/${CC_SUBDIR}
# tar connection.json and metadata.json
tar cfz code.tar.gz connection.json
tar cfz emissions-chaincode.tgz code.tar.gz metadata.json

cd ../..

./bin/peer lifecycle chaincode install chaincode/${CC_SUBDIR}/emissions-chaincode.tgz >&$LOG_FILE_NAME

export CHAINCODE_CCID=`cat ${LOG_FILE_NAME} | grep "Chaincode code package identifier:" | awk '{split($0,a,"Chaincode code package identifier: "); print a[2]}'`

sed -i -e "s!CHAINCODE_CCID=.*!CHAINCODE_CCID=${CHAINCODE_CCID}!g" docker/nodes/${NODE_SUBDIR}/docker-compose-chaincode.yaml

# install data lock chaincode

cd ./chaincode/${LOCKDATA_CC_SUBDIR}
# tar connection.json and metadata.json
tar cfz code.tar.gz connection.json
tar cfz datalock-chaincode.tgz code.tar.gz metadata.json

cd ../..

./bin/peer lifecycle chaincode install chaincode/${LOCKDATA_CC_SUBDIR}/datalock-chaincode.tgz >&$LOCKDATA_LOG_FILE_NAME

export CHAINCODE_ID=`cat ${LOCKDATA_LOG_FILE_NAME} | grep "Chaincode code package identifier:" | awk '{split($0,a,"Chaincode code package identifier: "); print a[2]}'`

sed -i -e "s!CHAINCODE_ID=.*!CHAINCODE_ID=${CHAINCODE_ID}!g" docker/nodes/${NODE_SUBDIR}/docker-compose-chaincode.yaml
### Examples
# sudo bash ./scripts/installChaincode.sh 1 2
