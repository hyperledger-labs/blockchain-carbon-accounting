#!/bin/bash

# Deploys chaincode to emissions-data following the chaincode lifecyle


# Change CC_PACKAGE_ID according to your output from `peer lifecycle chaincode queryinstalled`
echo "+++++Export chaincode package identifier+++++"
export CC_PACKAGE_ID=marbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649

echo
echo "+++++Approve chaincode for my org+++++"
peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDRESS} --channelID emissions-data --name marbles --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile ${ORDERER_TLSCA}

echo
echo "+++++Check commitreadiness of chaincode+++++"
peer lifecycle chaincode checkcommitreadiness --channelID emissions-data --name marbles --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --output json

echo
echo "+++++Commit chaincode+++++"
peer lifecycle chaincode commit -o ${ORDERER_ADDRESS} --channelID emissions-data --name marbles --version 1.0 --sequence 1 --tls --cafile ${ORDERER_TLSCA} --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE}

echo
echo "+++++Query commited chaincode+++++"
peer lifecycle chaincode querycommitted --channelID emissions-data --name marbles --cafile ${ORDERER_ADDRESS}

