CHANNEL_NAME="emissions-data"

export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

# import utils
. scripts/envVar.sh true

fcn_call=$1
shift
parsePeerConnectionParameters $@
res=$?
verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

echo "===================== Query chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

./bin/peer lifecycle chaincode queryinstalled

### Examples
# sudo bash ./scripts/queryChaincode.sh 1 2

