CHANNEL_NAME="emissions-data"
CC_NAME="emissions"

# set env
. setEnv.sh

fcn_call=$1

echo invoke fcn call:${fcn_call}

#./bin/peer chaincode invoke -o ${ORDERER_ADDRESS} --tls --cafile ${ORDERER_TLSCA} -C ${CHANNEL_NAME} -n ${CC_NAME} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} -c ${fcn_call} --waitForEvent

./bin/peer chaincode invoke -o ${ORDERER_ADDRESS} --tls --cafile ${ORDERER_TLSCA} -C ${CHANNEL_NAME} -n ${CC_NAME} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} --peerAddresses ${CORE_PEER_ADDRESS_2} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE_2} -c ${fcn_call} --waitForEvent
