# Multi-cloud deployment of Hyperledger Fabric as a testNet for emissions accounting

## DOCUMENT IN PROGRESS


## Index
   1. [Overview](README.md#1-overview)
   2. [Architecture](README.md#2-architecture)
   3. [Configuration](README.md#3-configuration)
   4. [Start Hyperledger Fabric network](README.md#5-start-hyperledger-fabric-network)
   5. [Monitor Hyperledger Fabric network](README.md#5-monitor-hyperledger-fabric-network)

## 1. Overview
tbd

## 2. Architecture
tbd

## 3. Prerequisites
#### 3.1 Kubernetes
You need to habe a running Kubernetes cluster. nginx ingress with ssl passthrough enabled

#### 3.2 Domain Names
1.1. Create subdomain for fabric-ca, fabric-peer, and fabric-orderer, e.g., fabric-ca.emissionsaccounting.yourdomain.com
1.2. Link subdomains to nginx ingress IP address (cluster management)

## 4. Start Hyperledger Fabric network
#### 4.1. Crypto-material
The first step to do to start the multi-cloud Hyperledger Fabric network or even your organitations' infrastructure is to generate the crypto-material. We use fabric certificate authority (ca) for this. Each organization has its own fabric-ca.

1. Configure `./fabric-config/fabric-ca-server-config.yaml`
change the values of:
- fabric-ca-subdomain
- ca-admin
- ca-admin-password (Use a strong password and keep it safe)
- your organization
2. Create configmap
Change value of namespace.
```shell
kubectl create cm fabric-ca-server-config --from-file=./fabric-config/fabric-ca-server-config.yaml -n yournamespace
```
3. Adjust the deployment configuration of `./deploy-digitalocean/fabric-ca-deplyoment.yaml` according to your cloud provider. Take a closer look at the PVC section.
4. Start fabric-ca
Change value of namespace.
```shell
kubectl apply -f absolute-path-to-fabric-ca-deplyoment.yaml -n yournamespace
```
5. Copy fabric-ca tls certificate
Get the name of the fabric-ca pod. Copy tls certificate to local file system. Change value of namespace.
```shell
# Export fabric ca client home; change <your-domain>, e.g., `emissionsaccounting.sampleOrg.de`
mkdir -p ${PWD}/crypto-material/<your-domain>/fabric-ca
${PWD}/crypto-material/${ORG_DOMAIN}/fabric-ca/tls-cert.pem
export FABRIC_CA_CLIENT_HOME=${PWD}/crypto-material/<your-domain>
export FABRIC_CA_CLIENT_TLS_CERTFILES=${PWD}/crypto-material/<your-domain>/fabric-ca/tls-cert.pem

# Returns all pods of yournamespace
kubectl get pod -n yournamespace

# Copy tls-cert.pem
kubectl cp "<fabric-ca-pod>:/etc/hyperledger/fabric-ca-server/tls-cert.pem" "${FABRIC_CA_CLIENT_HOME}/tls-cert.pem" -n yournamespace
```
6. Configure ingress
Adjust the deployment configuration of `./deploy-digitalocean/ingress-fabric-services-deployment.yaml` 
Change:
- name-of-your-ingress
- sudomain-to-fabric-ca
```shell
# Apply deployment configuration. Change path and namespace.
kubectl apply -f absolute-path-to-fabric-services-ingress-deplyoment.yaml -n yournamespace
```
7. Generate crypto-material
Set input variables of `registerEnroll.sh` according to your organizations configuration
Run the script
```shell
./registerEnroll.sh
```
#### 4.2. Orderer
Once all the crypto material is created, we can start the orderer.

1. Create orderer genesis block 
For testing purposes, change the values of `configtx.yaml` in fabric-config. Values to change:
- Name of the organization (sampleorg)
- Subdomain of peer and orderer

Changes the values accordingly your setup, e.g., `-n yournamespace`
```shell
# use configtxgen to create orderer.genesis.block
./bin/configtxgen -profile MultiNodeEtcdRaft -channelID system-channel -outputBlock ./system-genesis-block/orderer.genesis.block -configPath ./fabric-config

# create configmap of orderer.genesis.block
kubectl create cm system-genesis-block  --from-file=./system-genesis-block/orderer.genesis.block -n yournamespce
```

2. Create secret of crypto-material
Next we need to create a secret that contains all the crypto-material of the orderer (msp and tls). Change path to crypto-material of orderer and Kubernetes namespace.
```shell
mkdir tmp-crypto
cd tmp-crypto
# pack crypto-material of orderer into one *.tgz file (example of path: "/Users/user1/Documents/GitHub/blockchain-carbon-accounting/multi-cloud-deplyoment/crypto-material/emissionsaccounting.yourdomain.com/orderers/fabric-orderer1.emissionsaccounting.yourdomain.com")
tar -zcf "orderer1-crypto.tgz" -C "absolute path to fabric-orderer1.emissionsaccounting.yourdomain.com" .

# create secret of *.tgz file
kubectl create secret generic orderer1-crypto --from-file=orderer1-crypto=orderer1-crypto.tgz -n yournamespace
cd -
```
3. Start orderer
Now it's time to start the orderer. Apply `fabric-orderer-deplyoment.yaml`to your cluster.  
```shell
kubectl apply -f absolute-path-to-fabric-orderer-deplyoment.yaml -n yournamespace
```
#### 4.3. Peer
tbd

- 
## 5. Monitor Hyperledger Fabric network
