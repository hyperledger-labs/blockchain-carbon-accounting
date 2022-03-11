#!/bin/bash

# Deploys chaincode to emissions-data following the chaincode lifecyle


# Change CC_PACKAGE_ID according to your output from `peer lifecycle chaincode queryinstalled`
echo "+++++Export chaincode package identifier+++++"
export CC_PACKAGE_ID=emissions:0ee431100d9b7ab740c0e72ec86db561b052fd1b9b1e47de198bbabd0954ee97
echo $CC_PACKAGE_ID

#export CHAINCODE_NAME=marbles
export CHAINCODE_NAME=emissions
echo $CHAINCODE_NAME

echo
echo "+++++Approve chaincode for my org+++++"
./bin/peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile ${ORDERER_TLSCA}

echo
echo "+++++Check commitreadiness of chaincode+++++"
./bin/peer lifecycle chaincode checkcommitreadiness --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --output json

echo
echo "+++++Commit chaincode+++++"
./bin/peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --channelID emissions-data --name ${CHAINCODE_NAME} --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE}

echo
echo "+++++Query commited chaincode+++++"
./bin/peer lifecycle chaincode querycommitted --channelID emissions-data --name ${CHAINCODE_NAME} --cafile ${ORDERER_ADDRESS}

