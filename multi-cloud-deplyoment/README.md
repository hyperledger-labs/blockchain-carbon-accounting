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

https://aws.amazon.com/blogs/opensource/network-load-balancer-nginx-ingress-controller-eks/

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-0.32.0/deploy/static/provider/aws/deploy.yaml
```
The above manifest file also launches the Network Load Balancer(NLB).

#### 3.2 Domain Names
1.1. Create subdomain for fabric-ca, e.g., fabric-ca.emissionsaccounting.<your-domain>\
1.2. Link subdomain to nginx ingress IP address

AWS: set up Route 53 to have your domain pointed to the NLB

`fabric-ca.emissionsaccounting.<your-domain>.           A.    ALIAS abf3d14967d6511e9903d12aa583c79b-e3b2965682e9fbde.elb.us-east-1.amazonaws.com `

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
3. Adjust the deployment configuration of `./deploy-digitalocean/fabric-ca-deplyoment.yaml` according to your cloud provider. 

Take a closer look at the PVC section. On AWS you would need to create a static ebs volume.

https://rtfm.co.ua/en/kubernetes-persistentvolume-and-persistentvolumeclaim-an-overview-with-examples/


```bash
aws ec2 --profile <aws_profile> --region <us-west-2> create-volume --availability-zone <us-west-2a> --size 20
```
Update `pv-static.yaml` with volumeID of created ebs

```bash
kubectl apply -f fabric-config/pv-static.yaml
```

4. Start fabric-ca
```shell
kubectl apply -f /<absolute-path-to-fabric-ca-deplyoment.yaml>
```
5. Copy fabric-ca tls certificate

 - Get the name of the fabric-ca pod

- Copy tls certificate to local file system
```shell
# Export fabric ca client home; change <your-domain>, e.g., `emissionsaccounting.sampleOrg.de`

mkdir -p ${PWD}/crypto-material/<your-domain>/fabric-ca

e.g. ${PWD}/crypto-material/${ORG_DOMAIN}/fabric-ca/tls-cert.pem

export FABRIC_CA_CLIENT_HOME=${PWD}/crypto-material/
<your-domain>/fabric-ca

export FABRIC_CA_CLIENT_TLS_CERTFILES=${PWD}/crypto-material/<your-domain>/fabric-ca/tls-cert.pem

# Returns fabric-ca pod of yournamespce
kubectl get pod -n <yournamespce> | grep fabric-ca

# Copy tls-cert.pem
kubectl cp "<fabric-ca-pod>:/etc/hyperledger/fabric-ca-server/tls-cert.pem" "${FABRIC_CA_CLIENT_HOME}/tls-cert.pem" -n <yournamespce>
```
6. Configure ingress

Adjust the deployment configuration of 

`./deploy-digitalocean/ingress-fabric-services-deploy.yaml` 

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
