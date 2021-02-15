#!/bin/bash

# Deploys chaincode to utilityemissionchannel following the chaincode lifecyle


# Change CC_PACKAGE_ID according to your output from `peer lifecycle chaincode queryinstalled`
echo "+++++Export chaincode package identifier+++++"
export CC_PACKAGE_ID=marbles:23b1cc9ddef0cee9758f75d4f3cf45831ca13b6fed601dc9a496764873b46917
echo $CC_PACKAGE_ID

echo
echo "+++++Approve chaincode for my org+++++"
./bin/peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --channelID utilityemissionchannel --name marbles --version 1.0 --package-id ${CC_PACKAGE_ID} --sequence 1 --tls --cafile ${ORDERER_TLSCA}

echo
echo "+++++Check commitreadiness of chaincode+++++"
./bin/peer lifecycle chaincode checkcommitreadiness --channelID utilityemissionchannel --name marbles --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --output json

echo
echo "+++++Commit chaincode+++++"
./bin/peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --channelID utilityemissionchannel --name marbles --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} 

echo
echo "+++++Query commited chaincode+++++"
./bin/peer lifecycle chaincode querycommitted --channelID utilityemissionchannel --name marbles --cafile ${ORDERER_ADDRESS}

