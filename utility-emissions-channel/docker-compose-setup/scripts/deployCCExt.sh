CHANNEL_NAME="utilityemissionchannel"
LOG_FILE_NAME=chaincode${2}_log.txt

export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

export ORDERER_ADDRESS=localhost:7050
export ORDERER_TLSCA=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca/tlsca.auditor1.carbonAccounting.com-cert.pem

# import utils
. scripts/envVar.sh true

fcn_call=$1
shift
parsePeerConnectionParameters $@
res=$?
verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

echo "===================== Query chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

echo $ORDERER_ADDRESS

echo $LOG_FILE_NAME
export CC_PACKAGE_ID=`cat ${LOG_FILE_NAME} | grep "Chaincode code package identifier:" | awk '{split($0,a,"Chaincode code package identifier:"); print a[2]}'`
echo $CC_PACKAGE_ID

export CHAINCODE_NAME=utilityemissions
echo $CHAINCODE_NAME

echo
echo "+++++Approve chaincode for my org+++++"
./bin/peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride orderer1.auditor1.carbonAccounting.com --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile ${ORDERER_TLSCA}

echo
echo "+++++Check commitreadiness of chaincode+++++"
./bin/peer lifecycle chaincode checkcommitreadiness --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --output json

echo
echo "+++++Commit chaincode+++++"
./bin/peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride orderer1.auditor1.carbonAccounting.com --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} 

echo
echo "+++++Query commited chaincode+++++"
./bin/peer lifecycle chaincode querycommitted --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --cafile ${ORDERER_TLSCA}


### Examples
# sudo bash ./scripts/deployCCExt.sh 1 1

