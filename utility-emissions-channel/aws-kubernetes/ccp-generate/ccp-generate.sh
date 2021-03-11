#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    local OP=$(one_line_pem $7)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s/\${ORDPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        -e "s#\${ORDERERPEM}#$OP#" \
        ./ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    local OP=$(one_line_pem $7)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s/\${ORDPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        -e "s#\${ORDERERPEM}#$OP#" \
        ./ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=opentaps

P0PORT=443
CAPORT=443
ORDPORT=443

#PEERPEM=organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca/tlsca.auditor1.carbonAccounting.com-cert.pem
PEERPEM=../../../multi-cloud-deployment/deploy-aws/crypto-material/${ORG}.net/tlsca/tlsca.${ORG}.net-cert.pem

#CAPEM=organizations/peerOrganizations/auditor1.carbonAccounting.com/ca/ca.auditor1.carbonAccounting.com-cert.pem
CAPEM=../../../multi-cloud-deployment/deploy-aws/crypto-material/${ORG}.net/ca/ca.${ORG}.net-cert.pem

#ORDERERPEM=organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/tlscacerts/tls-auditor1-carbonAccounting-com-7054-auditor1-carbonAccounting-com.pem
ORDERERPEM=../../../multi-cloud-deployment/deploy-aws/crypto-material/opentaps.net/orderers/fabric-orderer.${ORG}.net/tls/tlscacerts/tls-fabric-ca-${ORG}-net-443-fabric-ca-${ORG}-net.pem

echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"
echo $(one_line_pem $PEERPEM)
echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"

echo "$(json_ccp $ORG $P0PORT $CAPORT $ORDPORT $PEERPEM $CAPEM $ORDERERPEM)" > connection-${ORG}.json

