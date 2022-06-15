CHANNEL_NAME="emissions-data"
CC_NN=${2}
LOG_FILE_NAME=chaincode${2}_log.txt
LOCKDATA_LOG_FILE_NAME=datalock_chaincode${2}_log.txt

export CHAINCODE_NAME=emissions
export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

export ORDERER_ADDRESS=localhost:7050
export ORDERER_TLSCA=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca/tlsca.auditor1.carbonAccounting.com-cert.pem
export ORDERER_OVERRIDE=orderer1.auditor1.carbonAccounting.com

if [ $CC_NN -eq 2 ]; then
  export ORDERER_ADDRESS=localhost:8050
  export ORDERER_TLSCA=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/tlsca/tlsca.auditor2.carbonAccounting.com-cert.pem
  export ORDERER_OVERRIDE=orderer1.auditor2.carbonAccounting.com
fi

# import utils
# use 'true' when run script on local computer and comment out ORDERER_ADDRESS reset
# use 'false' when run script with docker exec cli
. scripts/envVar.sh false

export ORDERER_ADDRESS=orderer1.auditor1.carbonAccounting.com:7050
if [ $CC_NN -eq 2 ]; then
  export ORDERER_ADDRESS=orderer1.auditor2.carbonAccounting.com:8050
fi

#-------------------------------------------------------------------

fcn_call=$1
shift
parsePeerConnectionParameters $@
res=$?
verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

echo "===================== Query chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

echo $ORDERER_ADDRESS

echo $LOG_FILE_NAME
export CC_PACKAGE_ID=`cat ${LOG_FILE_NAME} | grep "Chaincode code package identifier:" | awk '{split($0,a,"Chaincode code package identifier: "); print a[2]}'`
echo $CC_PACKAGE_ID


echo $CHAINCODE_NAME
echo
echo "+++++Approve chaincode for my org+++++"
./bin/peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride ${ORDERER_OVERRIDE} --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile ${ORDERER_TLSCA}

echo
echo "+++++Check commitreadiness of chaincode+++++"
./bin/peer lifecycle chaincode checkcommitreadiness --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --output json

echo "===================== Query Request Manager chaincode on $PEERS on channel '$CHANNEL_NAME' ===================== "
echo

echo $ORDERER_ADDRESS

echo $REQ_LOG_FILE_NAME
export CC_PACKAGE_ID=`cat ${LOCKDATA_LOG_FILE_NAME} | grep "Chaincode code package identifier:" | awk '{split($0,a,"Chaincode code package identifier: "); print a[2]}'`
echo $CC_PACKAGE_ID

CHAINCODE_NAME=datalock
echo $CHAINCODE_NAME
echo
echo "+++++Approve chaincode for my org+++++"
./bin/peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride ${ORDERER_OVERRIDE} --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile ${ORDERER_TLSCA}

echo
echo "+++++Check commitreadiness of chaincode+++++"
./bin/peer lifecycle chaincode checkcommitreadiness --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --output json
### Examples
# sudo bash ./scripts/deployCCExt.sh 1 1
# sudo bash ./scripts/deployCCExt.sh 1 2