CHANNEL_NAME="emissions-data"
CC_NN=${2}
LOG_FILE_NAME=chaincode${2}_log.txt

export CHAINCODE_NAME=emissions
export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

export ORDERER_ADDRESS=localhost:7050
export ORDERER_TLSCA=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca/tlsca.auditor1.carbonAccounting.com-cert.pem
#                    ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp/tlscacerts/tlsca.auditor1.carbonAccounting.com-cert.pem
export ORDERER_OVERRIDE=orderer1.auditor1.carbonAccounting.com

export CORE_PEER_ADDRESS_1=localhost:7051
export CORE_PEER_ADDRESS_2=localhost:8051

export PEER_ROOT_SERT_1=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/ca.crt
export PEER_ROOT_SERT_2=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/ca.crt

if [ $CC_NN -eq 2 ]; then
  export ORDERER_ADDRESS=localhost:8050
  export ORDERER_TLSCA=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/tlsca/tlsca.auditor2.carbonAccounting.com-cert.pem
  export ORDERER_OVERRIDE=orderer1.auditor2.carbonAccounting.com

  export CORE_PEER_ADDRESS_1=localhost:8051
  export CORE_PEER_ADDRESS_2=localhost:7051

  export PEER_ROOT_SERT_1=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/ca.crt
  export PEER_ROOT_SERT_2=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/ca.crt
fi

# import utils
# use 'true' when run script on local computer and comment out ORDERER_ADDRESS and CORE_PEER_ADDRESS reset
# use 'false' when run script with docker exec cli
. scripts/envVar.sh false

export ORDERER_ADDRESS=orderer1.auditor1.carbonAccounting.com:7050
export CORE_PEER_ADDRESS_1=peer1.auditor1.carbonAccounting.com:7051
export CORE_PEER_ADDRESS_2=peer1.auditor2.carbonAccounting.com:8051
if [ $CC_NN -eq 2 ]; then
  export ORDERER_ADDRESS=orderer1.auditor2.carbonAccounting.com:8050
  export CORE_PEER_ADDRESS_1=peer1.auditor2.carbonAccounting.com:8051
  export CORE_PEER_ADDRESS_2=peer1.auditor1.carbonAccounting.com:7051
fi

#-------------------------------------------------------------------

fcn_call=$1
shift
parsePeerConnectionParameters $@
res=$?
verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

echo "===================== Query chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

echo $CHAINCODE_NAME
echo
echo "+++++Commit chaincode+++++"
./bin/peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride ${ORDERER_OVERRIDE} --tls --cafile ${ORDERER_TLSCA} --channelID emissions-data --name ${CHAINCODE_NAME} --peerAddresses ${CORE_PEER_ADDRESS_1} --tlsRootCertFiles ${PEER_ROOT_SERT_1} --peerAddresses ${CORE_PEER_ADDRESS_2} --tlsRootCertFiles ${PEER_ROOT_SERT_2} --version 1.0 --sequence 1

sleep 10

echo
echo "+++++Query commited chaincode+++++"
./bin/peer lifecycle chaincode querycommitted --channelID emissions-data --name ${CHAINCODE_NAME} --cafile ${ORDERER_ADDRESS}


echo "===================== Query Data Lock chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

CHAINCODE_NAME=datalock
echo $CHAINCODE_NAME
echo
echo "+++++Commit chaincode+++++"
./bin/peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride ${ORDERER_OVERRIDE} --tls --cafile ${ORDERER_TLSCA} --channelID emissions-data --name ${CHAINCODE_NAME} --peerAddresses ${CORE_PEER_ADDRESS_1} --tlsRootCertFiles ${PEER_ROOT_SERT_1} --peerAddresses ${CORE_PEER_ADDRESS_2} --tlsRootCertFiles ${PEER_ROOT_SERT_2} --version 1.0 --sequence 1

sleep 10

echo
echo "+++++Query commited chaincode+++++"
./bin/peer lifecycle chaincode querycommitted --channelID emissions-data --name ${CHAINCODE_NAME} --cafile ${ORDERER_ADDRESS}
### Examples
# sudo bash ./scripts/commitCCExt.sh 1 1