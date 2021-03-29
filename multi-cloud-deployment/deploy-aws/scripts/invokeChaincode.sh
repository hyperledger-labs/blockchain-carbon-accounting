CHANNEL_NAME="utilityemissionchannel"
CC_NAME="utilityemissions"

# set env
. setEnv.sh

fcn_call=$1

echo invoke fcn call:${fcn_call}

./bin/peer chaincode invoke -o ${ORDERER_ADDRESS} --tls --cafile ${ORDERER_TLSCA} -C ${CHANNEL_NAME} -n ${CC_NAME} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} -c ${fcn_call} --waitForEvent
