CHANNEL_NAME="utilityemissionchannel"
CC_NN=${2}
LOG_FILE_NAME=chaincode${2}_log.txt

export CHAINCODE_NAME=utilityemissions
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
. scripts/envVar.sh true

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
./bin/peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer1.auditor1.carbonAccounting.com --tls --cafile ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp/tlscacerts/tlsca.auditor1.carbonAccounting.com-cert.pem --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/ca.crt --peerAddresses localhost:8051 --tlsRootCertFiles ./organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/ca.crt --version 1.0 --sequence 1

sleep 10

echo
echo "+++++Query commited chaincode+++++"
./bin/peer lifecycle chaincode querycommitted --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --cafile ${ORDERER_ADDRESS}


### Examples
# sudo bash ./scripts/commitCCExt.sh 1 1
