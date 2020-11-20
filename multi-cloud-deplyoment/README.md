# Multi-cloud deployment of Hyperledger Fabric as a testNet for emissions accounting

## DOCUMENT IN PROGRESS


## Index
   1. [Overview](README.md#1-overview)
   2. [Architecture](README.md#2-architecture)
   3. [Configuration](README.md#3-configuration)
   4. [Start Hyperledger Fabric network](README.md#4-start Hyperledger Fabric network)
   5. [Monitor Hyperledger Fabric network](README.md#5-monitor Hyperledger Fabric network)

## 1. Overview
tbd

## 2. Architecture
tbd

## 3. Prerequisites
#### 3.1 Kubernetes
You need to habe a running Kubernetes cluster. nginx ingress with ssl passthrough enabled

#### 3.2 Domain Names
1.1. Create subdomain for fabric-ca, e.g., fabric-ca.emissionsaccounting.<your-domain>
1.2. Link subdomain to nginx ingress IP address

## 4. Start Hyperledger Fabric network
#### 4.1. Crypto-material
The first step to do to start the multi-cloud Hyperledger Fabric network or even your organitations' infrastructure is to generate the crypto-material. We use fabric certificate authority (ca) for this. Each organization has its own fabric-ca.

1. Configure `./fabric-config/fabric-ca-server-config.yaml`
change the values of:
- <fabric-ca-subdomain>
- <ca-admin>
- <ca-admin-password> (Use a strong password and keep it safe)
- <your organization>
2. Create configmap
```shell
kubectl create cm fabric-ca-server-config --from-file=./fabric-config/fabric-ca-server-config.yaml -n ingress-nginx
```
3. Adjust the deployment configuration of `./deploy-digitalocean/fabric-ca-deplyoment.yaml` according to your cloud provider. Take a closer look at the PVC section.
4. Start fabric-ca
```shell
kubectl apply -f /<absolute-path-to-fabric-ca-deplyoment.yaml>
```
5. Copy fabric-ca tls certificate
Get the name of the fabric-ca pod
Copy tls certificate to local file system
```shell
# Export fabric ca client home; change <your-domain>, e.g., `emissionsaccounting.sampleOrg.de`
mkdir -p ${PWD}/crypto-material/<your-domain>/fabric-ca
${PWD}/crypto-material/${ORG_DOMAIN}/fabric-ca/tls-cert.pem
export FABRIC_CA_CLIENT_HOME=${PWD}/crypto-material/<your-domain>
export FABRIC_CA_CLIENT_TLS_CERTFILES=${PWD}/crypto-material/<your-domain>/fabric-ca/tls-cert.pem

# Returns all pods of yournamespce
kubectl get pod -n <yournamespce>

# Copy tls-cert.pem
kubectl cp "<fabric-ca-pod>:/etc/hyperledger/fabric-ca-server/tls-cert.pem" "${FABRIC_CA_CLIENT_HOME}/tls-cert.pem" -n <yournamespce>
```
6. Configure ingress
Adjust the deployment configuration of `./deploy-digitalocean/ingress-fabric-services-deploy.yaml` 
Change:
- <name-of-your-ingress>
- <sudomain-to-fabric-ca>
7. Generate crypto-material
Set input variables of `registerEnroll.sh` according to your organizations configuration
Run the script
```shell
./registerEnroll.sh
```

## 5. Monitor Hyperledger Fabric network
