#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=1
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca/tlsca.auditor1.carbonAccounting.com-cert.pem
CAPEM=organizations/peerOrganizations/auditor1.carbonAccounting.com/ca/ca.auditor1.carbonAccounting.com-cert.pem

echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"
echo $(one_line_pem $PEERPEM)
echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"
echo "+++++++++++++++++++++++++++++++"

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/auditor1.carbonAccounting.com/connection-auditor1.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/auditor1.carbonAccounting.com/connection-auditor1.yaml

ORG=2
P0PORT=8051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/auditor2.carbonAccounting.com/tlsca/tlsca.auditor2.carbonAccounting.com-cert.pem
CAPEM=organizations/peerOrganizations/auditor2.carbonAccounting.com/ca/ca.auditor2.carbonAccounting.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/auditor2.carbonAccounting.com/connection-auditor2.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/auditor2.carbonAccounting.com/connection-auditor2.yaml


ORG=3
P0PORT=9051
CAPORT=9054
PEERPEM=organizations/peerOrganizations/auditor3.carbonAccounting.com/tlsca/tlsca.auditor3.carbonAccounting.com-cert.pem
CAPEM=organizations/peerOrganizations/auditor3.carbonAccounting.com/ca/ca.auditor3.carbonAccounting.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/auditor3.carbonAccounting.com/connection-auditor3.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/auditor3.carbonAccounting.com/connection-auditor3.yaml
