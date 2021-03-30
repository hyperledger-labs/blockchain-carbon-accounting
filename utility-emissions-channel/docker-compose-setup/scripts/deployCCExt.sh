CHANNEL_NAME="utilityemissionchannel"

export FABRIC_CFG_PATH=$PWD/fabric-config/
export PATH=${PWD}/bin:$PATH

export ORDERER_ADDRESS=orderer1.auditor1.carbonAccounting.com:7050
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

./bin/peer lifecycle chaincode queryinstalled

export CC_PACKAGE_ID=utilityemissions:cfd74148636671a1b7879c2acd33d721d82ee9c53abd7a178817644399234483
echo $CC_PACKAGE_ID

export CHAINCODE_NAME=utilityemissions
echo $CHAINCODE_NAME

echo
echo "+++++Approve chaincode for my org+++++"
./bin/peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --channelID utilityemissionchannel --name ${CHAINCODE_NAME} --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile ${ORDERER_TLSCA}


### Examples
# sudo bash ./scripts/deployCCExt.sh 1 1

