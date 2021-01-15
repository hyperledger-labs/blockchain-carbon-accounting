CHANNEL_NAME="utilityemissionchannel"
CC_NAME="trustidcc"
# CC_SRC_PATH=${3:-"NA"}
# CC_SRC_LANGUAGE=${4:-"javascript"}
 CC_VERSION=${5:-"1.0"}
# CC_SEQUENCE=${6:-"1"}
# CC_INIT_FCN=${7:-"NA"}
# CC_END_POLICY=${8:-"NA"}
# CC_COLL_CONFIG=${9:-"NA"}
# DELAY=${10:-"3"}
# MAX_RETRY=${11:-"5"}
# VERBOSE=${12:-"false"}

export FABRIC_CFG_PATH=$PWD/config/
export PATH=${PWD}/bin:$PATH

# import utils
. scripts/envVar.sh

fcn_call=$1
shift
parsePeerConnectionParameters $@
res=$?
verifyResult $res "Instantiate transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

set -x
echo invoke fcn call:${fcn_call}
peer chaincode instantiate -o localhost:7050 --ordererTLSHostnameOverride orderer1.auditor1.carbonAccounting.com --tls --cafile $ORDERER_AUDITOR1_CA -C $CHANNEL_NAME -n ${CC_NAME} -v ${CC_VERSION} $PEER_CONN_PARMS -c "${fcn_call}" -P "AND ('auditor1.peer','auditor2.peer')" >&log.txt
res=$?
set +x
cat log.txt
verifyResult $res "Instantiate execution on $PEERS failed "
echo "===================== Invoke transaction successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

### Examples

# ./scripts/instantiateTrustCC.sh '{"Args":["Init", “{\“did\”:\”did:vtn:trustid:6263d2d90a3688e5b2c260658ee905385ba898fb2492902682f350d6593410ca\”,\”controller\”:\”openclimate\”,\”publicKey\”:\”——BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtGuo+INa7VC6iflTbL8ciVhAe0A2hufHbZ0yEzTZtU+IA+gFdq0gyTJO/5+v/tPaCV54TmeOoPr75w7Q9B12+tsOCAVL2H0hCJI3pT3ShCSkrnYbUM8hzMGbxvmi2ykyUZNiGhYUzwfjF9fKbB93ya70GjvY6bNyUSCDfRZjhyC0YfFNGorcSlwpKKw39cny0SSdiLIgyPIhwFoOT5gvUghLg2ipp1cVEB3skAllg7TOgKzWYgG4zLa0EnRs4fRgImtSRqCrQeBwcloTn5n7va1kVRNtUwOOMWaSgidpu0tyh7qAhqRcfkRVwjscKQ8En2eltd57yeggQJoglssZwIDAQAB-----END PUBLIC KEY——\”}”]}’ 1