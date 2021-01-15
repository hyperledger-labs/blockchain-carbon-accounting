function createAuditor1() {

  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p organizations/peerOrganizations/auditor1.carbonAccounting.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/
  #  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
  #  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-auditor1 --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-auditor1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-auditor1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-auditor1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-auditor1.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/config.yaml

  echo
  echo "Register peer1"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor1 --id.name peer1 --id.secret peer1pw --id.type peer --id.attrs "hf.Registrar.Roles=peer" --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  echo
  echo "Register user"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor1 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  echo
  echo "Register the org admin"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor1 --id.name auditor1admin --id.secret auditor1adminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  mkdir -p organizations/peerOrganizations/auditor1.carbonAccounting.com/peers
  mkdir -p organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com

  echo
  echo "## Generate the peer1 msp"
  echo
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-auditor1 -M ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/msp --csr.hosts peer1.auditor1.carbonAccounting.com --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/msp/config.yaml

  echo
  echo "## Generate the peer1-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-auditor1 -M ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls --enrollment.profile tls --csr.hosts peer1.auditor1.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/server.key

  mkdir ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/tlsca/tlsca.auditor1.carbonAccounting.com-cert.pem

  mkdir ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/ca
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/peers/peer1.auditor1.carbonAccounting.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/ca/ca.auditor1.carbonAccounting.com-cert.pem

  mkdir -p organizations/peerOrganizations/auditor1.carbonAccounting.com/users
  mkdir -p organizations/peerOrganizations/auditor1.carbonAccounting.com/users/User1@auditor1.carbonAccounting.com

  echo
  echo "## Generate the user msp"
  echo
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-auditor1 -M ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/User1@auditor1.carbonAccounting.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/User1@auditor1.carbonAccounting.com/msp/config.yaml

  cd ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/User1@auditor1.carbonAccounting.com/msp/keystore/
  mv $(ls) priv_sk
  cd -

  mkdir -p organizations/peerOrganizations/auditor1.carbonAccounting.com/users/Admin@auditor1.carbonAccounting.com

  echo
  echo "## Generate the org admin msp"
  echo
  set -x
  fabric-ca-client enroll -u https://auditor1admin:auditor1adminpw@localhost:7054 --caname ca-auditor1 -M ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/Admin@auditor1.carbonAccounting.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/Admin@auditor1.carbonAccounting.com/msp/config.yaml

  cd ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/users/Admin@auditor1.carbonAccounting.com/msp/keystore/
  mv $(ls) priv_sk
  cd -

  echo
  echo "Register orderer"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor1 --id.name orderer1 --id.secret orderer1pw --id.type orderer --id.attrs "hf.Registrar.Roles=orderer" --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x
  set +x

  echo
  echo "## Generate the orderer msp"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:7054 --caname ca-auditor1 -M ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp --csr.hosts orderer1.auditor1.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:7054 --caname ca-auditor1 -M ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls --enrollment.profile tls --csr.hosts orderer1.auditor1.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor1/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/server.key

  mkdir ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/msp/tlscacerts/tlsca.auditor1.carbonAccounting.com-cert.pem

  cp ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/orderers/orderer1.auditor1.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor1.carbonAccounting.com/msp/tlscacerts/tlsca.auditor1.carbonAccounting.com-cert.pem

}

function createAuditor2() {

  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p organizations/peerOrganizations/auditor2.carbonAccounting.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/
  #  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
  #  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-auditor2 --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-auditor2.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-auditor2.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-auditor2.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-auditor2.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/config.yaml

  echo
  echo "Register peer1"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor2 --id.name peer1 --id.secret peer1pw --id.type peer --id.attrs "hf.Registrar.Roles=peer" --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  echo
  echo "Register user"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor2 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  echo
  echo "Register the org admin"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor2 --id.name auditor2admin --id.secret auditor2adminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  mkdir -p organizations/peerOrganizations/auditor2.carbonAccounting.com/peers
  mkdir -p organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com

  echo
  echo "## Generate the peer1 msp"
  echo
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:8054 --caname ca-auditor2 -M ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/msp --csr.hosts peer1.auditor2.carbonAccounting.com --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/msp/config.yaml

  echo
  echo "## Generate the peer1-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:8054 --caname ca-auditor2 -M ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls --enrollment.profile tls --csr.hosts peer1.auditor2.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/server.key

  mkdir ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/tlsca/tlsca.auditor2.carbonAccounting.com-cert.pem

  mkdir ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/ca
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/peers/peer1.auditor2.carbonAccounting.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/ca/ca.auditor2.carbonAccounting.com-cert.pem

  mkdir -p organizations/peerOrganizations/auditor2.carbonAccounting.com/users
  mkdir -p organizations/peerOrganizations/auditor2.carbonAccounting.com/users/User1@auditor2.carbonAccounting.com

  echo
  echo "## Generate the user msp"
  echo
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-auditor2 -M ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/User1@auditor2.carbonAccounting.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/User1@auditor2.carbonAccounting.com/msp/config.yaml

  cd ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/User1@auditor2.carbonAccounting.com/msp/keystore/
  mv $(ls) priv_sk
  cd -

  mkdir -p organizations/peerOrganizations/auditor2.carbonAccounting.com/users/Admin@auditor2.carbonAccounting.com

  echo
  echo "## Generate the org admin msp"
  echo
  set -x
  fabric-ca-client enroll -u https://auditor2admin:auditor2adminpw@localhost:8054 --caname ca-auditor2 -M ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/Admin@auditor2.carbonAccounting.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/Admin@auditor2.carbonAccounting.com/msp/config.yaml

  cd ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/users/Admin@auditor2.carbonAccounting.com/msp/keystore/
  mv $(ls) priv_sk
  cd -

  echo
  echo "Register orderer"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor2 --id.name orderer1 --id.secret orderer1pw --id.type orderer --id.attrs "hf.Registrar.Roles=orderer" --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x
  set +x

  echo
  echo "## Generate the orderer msp"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:8054 --caname ca-auditor2 -M ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/msp --csr.hosts orderer1.auditor2.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:8054 --caname ca-auditor2 -M ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls --enrollment.profile tls --csr.hosts orderer1.auditor2.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor2/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/server.key

  mkdir ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/msp/tlscacerts/tlsca.auditor2.carbonAccounting.com-cert.pem

  cp ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/orderers/orderer1.auditor2.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor2.carbonAccounting.com/msp/tlscacerts/tlsca.auditor2.carbonAccounting.com-cert.pem
}

function createAuditor3() {

  echo
  echo "Enroll the CA admin"
  echo
  mkdir -p organizations/peerOrganizations/auditor3.carbonAccounting.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/
  #  rm -rf $FABRIC_CA_CLIENT_HOME/fabric-ca-client-config.yaml
  #  rm -rf $FABRIC_CA_CLIENT_HOME/msp

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-auditor3 --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-auditor3.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-auditor3.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-auditor3.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-auditor3.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/config.yaml

  echo
  echo "Register peer1"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor3 --id.name peer1 --id.secret peer1pw --id.type peer --id.attrs "hf.Registrar.Roles=peer" --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  echo
  echo "Register user"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor3 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  echo
  echo "Register the org admin"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor3 --id.name auditor3admin --id.secret auditor3adminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  mkdir -p organizations/peerOrganizations/auditor3.carbonAccounting.com/peers
  mkdir -p organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com

  echo
  echo "## Generate the peer1 msp"
  echo
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:9054 --caname ca-auditor3 -M ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/msp --csr.hosts peer1.auditor3.carbonAccounting.com --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/msp/config.yaml

  echo
  echo "## Generate the peer1-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:9054 --caname ca-auditor3 -M ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls --enrollment.profile tls --csr.hosts peer1.auditor3.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/server.key

  mkdir ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/tlscacerts/ca.crt

  mkdir ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/tlsca/tlsca.auditor3.carbonAccounting.com-cert.pem

  mkdir ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/ca
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/peers/peer1.auditor3.carbonAccounting.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/ca/ca.auditor3.carbonAccounting.com-cert.pem

  mkdir -p organizations/peerOrganizations/auditor3.carbonAccounting.com/users
  mkdir -p organizations/peerOrganizations/auditor3.carbonAccounting.com/users/User1@auditor3.carbonAccounting.com

  echo
  echo "## Generate the user msp"
  echo
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:9054 --caname ca-auditor3 -M ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/User1@auditor3.carbonAccounting.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/User1@auditor3.carbonAccounting.com/msp/config.yaml

  cd ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/User1@auditor3.carbonAccounting.com/msp/keystore/
  mv $(ls) priv_sk
  cd -

  mkdir -p organizations/peerOrganizations/auditor3.carbonAccounting.com/users/Admin@auditor3.carbonAccounting.com

  echo
  echo "## Generate the org admin msp"
  echo
  set -x
  fabric-ca-client enroll -u https://auditor3admin:auditor3adminpw@localhost:9054 --caname ca-auditor3 -M ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/Admin@auditor3.carbonAccounting.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/Admin@auditor3.carbonAccounting.com/msp/config.yaml

  cd ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/users/Admin@auditor3.carbonAccounting.com/msp/keystore/
  mv $(ls) priv_sk
  cd -

  echo
  echo "Register orderer"
  echo
  set -x
  fabric-ca-client register --caname ca-auditor3 --id.name orderer1 --id.secret orderer1pw --id.type orderer --id.attrs "hf.Registrar.Roles=orderer" --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x
  set +x

  echo
  echo "## Generate the orderer msp"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:9054 --caname ca-auditor3 -M ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/msp --csr.hosts orderer1.auditor3.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/msp/config.yaml

  echo
  echo "## Generate the orderer-tls certificates"
  echo
  set -x
  fabric-ca-client enroll -u https://orderer1:orderer1pw@localhost:9054 --caname ca-auditor3 -M ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls --enrollment.profile tls --csr.hosts orderer1.auditor3.carbonAccounting.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/auditor3/tls-cert.pem
  set +x

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/server.key

  mkdir ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/msp/tlscacerts/tlsca.auditor3.carbonAccounting.com-cert.pem

  cp ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/orderers/orderer1.auditor3.carbonAccounting.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/auditor3.carbonAccounting.com/msp/tlscacerts/tlsca.auditor3.carbonAccounting.com-cert.pem

}
