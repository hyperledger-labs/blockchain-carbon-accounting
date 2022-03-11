# Multi-cloud deployment of Hyperledger Fabric as a testNet for emissions accounting

## Index
   1. [Overview](README.md#1-overview)
   2. [Architecture](README.md#2-architecture)
   3. [Prerequisites](README.md#3-prerequisites)
   4. [Start Hyperledger Fabric network](README.md#4-start-hyperledger-fabric-network)
   5. [Monitor Hyperledger Fabric network](README.md#5-monitor-hyperledger-fabric-network)
   6. [Troubleshooting](README.md#6-troubleshooting)

## 1. Overview
This document describes how to get your Hyperledger Fabric infrastructure ready to run on Kubernetes and connect with different organizations that host their infrastructure in their own Kubernetes cluster. (as of 2020-12-09)

This readme file describes the deployment to a Kubernetes cluster hosted at Digital Ocean. If you want to deploy Hyperledger Fabric to AWS EKS follow the [instructions](./deploy-aws/README.md) in ./deploy-aws.

## 2. Architecture
The following image shows a sample architecture of the multi-cloud deployment consisting of three organizations. The Hyperledger Fabric infrastructure of each organization is hosted separately in Kubernetes clusters.
![Image of sample architecture](images/multi-cloud-deployment-EmissionChannel.png)

The following image gives a high-level overview of the components of each organizations' Kubernetes cluster.
![Image of sample Kubernetes cluster](images/kubernetes-cluster-of-sampleOrg.png)

## 3. Prerequisites
#### 3.1 Domain Names
1. Create subdomains for fabric-ca, fabric-peer, and fabric-orderer, e.g., fabric-ca.emissionsaccounting.yourdomain.com
2. Link subdomains to nginx ingress IP address (at cluster management level) after you've started the nginx ingress as describe in step 3.2.
#### 3.2 Kubernetes
You need to have a running Kubernetes cluster. You need to deploy one nginx ingress controller to your Kubernetes cluster.

###### Nginx Controller Config
Go to https://github.com/kubernetes/ingress-nginx/tree/master/deploy/static/provider and copy the `deploy.yaml` file to your filesystem according to your cloud provider.
In the `deploy.yaml` file add `--enable-ssl-passthrough` to the args section of the controller container. For an example, take a look at the deployment file [kubernetes-ingress-controller-deploy.yaml](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/multi-cloud-deployment/deploy-digitalocean/kubernetes-ingress-controller-deployment.yaml#L353) of the nginx ingress for DigitalOcean (do).

##### Ingress Service Config
Next, you need to prepare your ingress to route the subdomains of your Hyperledger Fabric infrastructure with `nginx.ingress.kubernetes.io/ssl-passthrough: "true"`. As a starting point you can use `deploy-digitalocean/ingress-fabric-services-deployment.yaml´.
Set the following values according to your setup:
- name: name-of-your-ingress
- host: sudomain-to-fabric-ca
- host: sudomain-to-fabric-peer
- host: sudomain-to-fabric-orderer
Of course, you can add additional rules for e.g. a second peer node.

#### 3.3 Fabric Binaries
Get fabric binaries in fabric version 2.2.1 and fabric-ca at version 1.4.9 and include in path env.
```shell
# download binaries
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.1 1.4.9 -d -s

# include bin directory in path
export PATH=${PWD}/bin:$PATH
```

#### 3.4 Kubernetes Namespace
Create a separate namespace for the deployment of the ignress instance and all hyperledger fabric related stuff. Adjust the value of `name` in `./deploy-digitalocean/fabric-namespace.yaml` according to your preferences (here: fabric) and then apply the configuration as follows:
```shell
# Create namespace
kubectl apply -f ./deploy-digitalocean/fabric-namespace.yaml

# Should print a similar output
namespace/fabric created
```

## 4. Start Hyperledger Fabric network
#### 4.1. Crypto-material
The following step to accomplish to start your organizations' infrastructure of the multi-cloud Hyperledger Fabric network is to generate the crypto-material. We use fabric certificate authority (ca) for this. Each organization has its own fabric-ca.

1. Configure `./fabric-config/fabric-ca-server-config.yaml`

Change the values of:
- fabric-ca-subdomain
- ca-admin
- ca-admin-password (Use a strong password and keep it safe)
- your-organization
- names (C, ST, L, O, OU) --> This is optional but recommended
2. Create configmap

Change value of `yournamespace`.
```shell
# Create fabric-ca-server configmap
kubectl create cm fabric-ca-server-config --from-file=./fabric-config/fabric-ca-server-config.yaml -n yournamespace

# Should print a similar output
configmap/fabric-ca-server-config created
```
3. Adjust the deployment configuration of `./deploy-digitalocean/fabric-ca-deployment.yaml` according to your cloud provider.
4. Start fabric-ca

Change value of `yournamespace`.
```shell
# Start fabric-ca
kubectl apply -f ./deploy-digitalocean/fabric-ca-deployment.yaml -n yournamespace

# Should print a similar output
service/fabric-ca created
persistentvolumeclaim/fabric-ca created
deployment.apps/fabric-ca created
```
5. Copy fabric-ca tls certificate

Get the name of the fabric-ca pod. Copy tls certificate to local file system. Change value of `yournamespace`.
```shell
# Export fabric ca client home; change <your-domain>, e.g., `emissionsaccounting.sampleOrg.de`

mkdir -p ${PWD}/crypto-material/<your-domain>/fabric-ca
e.g. ${PWD}/crypto-material/emissionsaccounting.sampleOrg.de/fabric-ca/tls-cert.pem

export FABRIC_CA_CLIENT_HOME=${PWD}/crypto-material/<your-domain>/fabric-ca
export FABRIC_CA_CLIENT_TLS_CERTFILES=${PWD}/crypto-material/<your-domain>/fabric-ca/tls-cert.pem

# Returns all pods of yournamespace
kubectl get pod -n yournamespace
# Should print a similar output
NAME                        READY   STATUS    RESTARTS   AGE
fabric-ca-6884b9dc5-86894   1/1     Running   0          16m


# Copy tls-cert.pem from fabric-ca pod (here: fabric-ca-6884b9dc5-86894)
kubectl cp "<fabric-ca-pod>:/etc/hyperledger/fabric-ca-server/tls-cert.pem" "${FABRIC_CA_CLIENT_HOME}/tls-cert.pem" -n yournamespace
```
6. Configure ingress (Skip this step if this already happened)

Adjust the deployment configuration of `./deploy-digitalocean/ingress-fabric-services-deployment.yaml`
Change:
- name: name-of-your-ingress
- host: sudomain-to-fabric-ca

Apply deployment configuration and change namespace.
```shell
# Start ingress. (change namespace)
kubectl apply -f ./deploy-digitalocean/ingress-fabric-services-deployment.yaml -n yournamespace
```
7. Generate crypto-material

Set input variables of `registerEnroll.sh` according to your organizations configuration
Run the script
```shell
# Register and enroll peer, oderer and org admin
./registerEnroll.sh

# Check the logs and confirm that you don't get any error messages
```
#### 4.2. Orderer
Once all the crypto material is created, we can start the orderer.

1. Create orderer genesis block

NOTE: For testing purposes, change the values of `configtx.yaml` in fabric-config. This is just a way for you to test the functionality of your configuration before you try to start interacting with nodes from different organizations. Values to change:
- Name of the organization (sampleorg)
- Subdomain of peer and orderer (e.g. OrdererEndpoints, AnchorPeers, and Consenters.Host)
- Paths of Consenters.ClientTLSCert and Consenters.ServerTLSCert

Changes the values accordingly your setup, e.g., `-n yournamespace`
```shell
# use configtxgen to create orderer.genesis.block
./bin/configtxgen -profile MultiNodeEtcdRaft -channelID system-channel -outputBlock ./system-genesis-block/orderer.genesis.block -configPath ./fabric-config

# Should print a similar output
2021-01-06 17:46:26.426 CET [common.tools.configtxgen] main -> INFO 001 Loading configuration
[...]
2021-01-06 17:46:26.455 CET [common.tools.configtxgen] doOutputBlock -> INFO 005 Writing genesis block


# create configmap of orderer.genesis.block
kubectl create cm system-genesis-block  --from-file=./system-genesis-block/orderer.genesis.block -n yournamespce

# Should print a similar output
configmap/system-genesis-block created
```

2. Create secret of crypto-material

Next we need to create a secret that contains all the crypto-material of the orderer (msp and tls). Change the path to crypto-material of orderer and Kubernetes namespace.
```shell
mkdir tmp-crypto
cd tmp-crypto
# pack crypto-material of orderer into one *.tgz file (example of path: "/Users/user1/Documents/GitHub/blockchain-carbon-accounting/multi-cloud-deployment/crypto-material/emissionsaccounting.yourdomain.com/orderers/fabric-orderer1.emissionsaccounting.yourdomain.com")
tar -zcf "orderer1-crypto.tgz" -C "absolute path to fabric-orderer1.emissionsaccounting.yourdomain.com" .

# create secret of *.tgz file
kubectl create secret generic orderer1-crypto --from-file=orderer1-crypto=orderer1-crypto.tgz -n yournamespace

# Should print a similar output
secret/orderer1-crypto created

# Change dir to multi-cloud-deployment
cd -
```

3. Start orderer

Now it's time to start the orderer. Apply `./deploy-digitalocean/fabric-orderer-deployment.yaml` to your cluster. But first, change the value of `ORDERER_GENERAL_LOCALMSPID` to your organization's msp.
```shell
# Set path to fabric-orderer-deployment.yaml and change yournamespace
kubectl apply -f ./deploy-digitalocean/fabric-orderer-deployment.yaml -n yournamespace

# Should print a similar output
service/fabric-orderer1 created
persistentvolumeclaim/fabric-orderer1 created
deployment.apps/fabric-orderer1 created


# Wait for 2 minutes and check if orderer is running
kubectl get pod -n yournamespace

# Should print a similar output
NAME                               READY   STATUS    RESTARTS   AGE
fabric-ca-6884b9dc5-zjxrz          1/1     Running   0          11m
fabric-orderer1-56688dbbdc-r42ps   1/1     Running   0          106s
```

#### 4.3. Peer
Now it's time to start (and test) the peer node.

1. First, edit `./deploy-digitalocean/fabric-peer-deployment.yaml` and change the following values according to your configuration:

ENV section of peer container:
- CORE_PEER_ADDRESS
- CORE_PEER_CHAINCODEADDRESS
- CORE_PEER_GOSSIP_BOOTSTRAP
- CORE_PEER_GOSSIP_EXTERNALENDPOINT
- CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME
- CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD

ENV section of couchDB container:
- COUCHDB_USER
- COUCHDB_PASSWORD

2. Create secret of crypto-material

Next, we need to create a secret that contains all the crypto-material of the peer (msp and tls). Change the path to crypto-material of peer and Kubernetes namespace.
```shell
mkdir -p tmp-crypto
cd tmp-crypto
# pack crypto-material of orderer into one *.tgz file (example of path: "/Users/user1/Documents/GitHub/blockchain-carbon-accounting/multi-cloud-deployment/crypto-material/emissionsaccounting.yourdomain.com/peers/fabric-peer1.emissionsaccounting.yourdomain.com")
tar -zcf "peer1-crypto.tgz" -C "absolute path to fabric-peer1.emissionsaccounting.yourdomain.com" .

# create secret of *.tgz file; change value of yournamespace
kubectl create secret generic peer1-crypto --from-file=peer1-crypto=peer1-crypto.tgz -n yournamespace

# Should print a similar output
secret/peer1-crypto created


# Change dir to multi-cloud-deployment
cd -
```

3. Create configmap of channel artifacts

In order to pass the channel artifacts of the first channel, we package them into a configmap which we'll mount to the pod. Changes the value of yournamespace.
```shell
# run the tool configtxgen with the sample confitgtx.yaml file you created in section 1 of chapter 4.2 to create channel artifacts
./bin/configtxgen -profile MultipleOrgsChannel -outputCreateChannelTx ./channel-artifacts/emissions-data.tx -channelID emissions-data -configPath ./fabric-config

# Should print a similar output
2021-01-06 17:58:06.505 CET [common.tools.configtxgen] main -> INFO 001 Loading configuration
[...]
2021-01-06 17:58:06.536 CET [common.tools.configtxgen] doOutputChannelCreateTx -> INFO 004 Writing new channel tx


# Create configmap of channel tx
kubectl create cm emissions-data  --from-file=./channel-artifacts/emissions-data.tx -n yournamespace

# Should print a similar output
configmap/emissions-data created
```

4. Create configmap of anchor peers update

Next, we create a second configmap of the peer nodes which contains the information about the anchor peer. Changes the values of yournamespace, sampleOrg, and sampleorganchors.
```shell
# run the tool configtxgen with the sample confitgtx.yaml file you created in section 1 of chapter 4.2 to create anchros peers update.
./bin/configtxgen -profile MultipleOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/sampleOrganchors.tx -channelID emissions-data -asOrg sampleOrg -configPath ./fabric-config

# Should print a similar output
2021-01-06 17:59:17.746 CET [common.tools.configtxgen] main -> INFO 001 Loading configuration
[...]
2021-01-06 17:59:17.768 CET [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 004 Writing anchor peer update

# create configmap of anchor peer update
kubectl create cm sampleorganchors --from-file=./channel-artifacts/sampleOrganchors.tx -n yournamespace

# Should print a similar output
configmap/sampleorganchors created
```

5. Create config maps for external chaincode builder

In order to use [chaincode as an external service](https://hyperledger-fabric.readthedocs.io/en/release-2.2/cc_service.html), we need to prepare the peer with configmaps containing the external builder scripts as well as an updated core.yaml file. Most of the part from this section is copied from the repo [vanitas92/fabric-external-chaincodes](https://github.com/vanitas92/fabric-external-chaincodes). Changes the value of yournamespace
```shell
# Create external chaincode builder configmap
kubectl apply -f ./deploy-digitalocean/external-chaincode-builder-config.yaml -n yournamespace

# Should print a similar output
configmap/external-chaincode-builder-config
```

6. Start peer

Now it's time to start the peer. Apply `./deploy-digitalocean/fabric-peer-deployment.yaml`to your cluster.
```shell
# Change value of yournamespace
kubectl apply -f ./deploy-digitalocean/fabric-peer-deployment.yaml -n yournamespace

# Should print a similar output
service/fabric-peer1 created
persistentvolumeclaim/fabric-peer1 created
deployment.apps/fabric-peer1 created


# Wait for 2 minutes and check if peer is running
kubectl get pod -n yournamespace

# Should print a similar output
NAME                               READY   STATUS    RESTARTS   AGE
fabric-ca-6884b9dc5-zjxrz          1/1     Running   0          20m
fabric-orderer1-56688dbbdc-r42ps   1/1     Running   0          10m
fabric-peer1-6c89fd57d4-8w8z8      2/2     Running   0          28s
```

#### 4.4. Test your infrastructure against the test configuration
In this step, we'll create a channel in your running Hyperledger Fabric network consisting of 1 fabric-ca, 1 orderer node, and 1 peer node. Also, we will make the peer join the created channel.
1. Set ENV variables

Open `setEnv.sh` and set the values of the ENVs according to your setup.
```shell
# sourve ENVs
source ./setEnv.sh

# Should print a similar output
+++++ENVs are set+++++
```

2. Create Channel

Run the command `peer channel create` and the value of yourdomain
```shell
./bin/peer channel create -o ${ORDERER_ADDRESS} -c emissions-data -f ./channel-artifacts/emissions-data.tx --outputBlock ./channel-artifacts/emissions-data.block --tls --cafile ${ORDERER_TLSCA}

# Should print a similar output
2021-01-06 18:08:08.775 CET [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2021-01-06 18:08:09.136 CET [cli.common] readBlock -> INFO 002 Expect block, but got status: &{NOT_FOUND}
2021-01-06 18:08:09.359 CET [channelCmd] InitCmdFactory -> INFO 003 Endorser and orderer connections initialized
2021-01-06 18:08:09.679 CET [cli.common] readBlock -> INFO 004 Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-01-06 18:08:10.063 CET [channelCmd] InitCmdFactory -> INFO 005 Endorser and orderer connections initialized
2021-01-06 18:08:10.280 CET [cli.common] readBlock -> INFO 006 Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-01-06 18:08:10.540 CET [channelCmd] InitCmdFactory -> INFO 007 Endorser and orderer connections initialized
2021-01-06 18:08:10.775 CET [cli.common] readBlock -> INFO 008 Received block: 0
```

3. Join Peer1 to Channel

Run the command `peer channel join`
```shell
./bin/peer channel join -b ./channel-artifacts/emissions-data.block

# Should print a similar output
2021-01-06 18:11:23.889 CET [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2021-01-06 18:11:24.392 CET [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
```

4. Verify that peer has joind the channel
```shell
./bin/peer channel list

# Should print similar output to
2021-01-06 18:11:43.755 CET [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
Channels peers has joined:
emissions-data
```

5. Deploy chaincode as external service

Next, we deploy a sample chaincode to the emissions-data. Follow the next steps carefully.

5.1. First, we package and install the chaincode to one peer. In `./chaincode/packacking/connection.json` replace the value of `yournamespace` (e.g., "address": "chaincode-marbles.fabric:7052").
``` shell
# change dir to chaincode/packaging
cd ./chaincode/packaging

# tar connection.json and metadata.json
tar cfz code.tar.gz connection.json
tar cfz marbles-chaincode.tgz code.tar.gz metadata.json

# install chaincecode package to peer
peer lifecycle chaincode install marbles-chaincode.tgz

# Should print similar output to
2021-01-10 14:16:07.493 CET [cli.lifecycle.chaincode] submitInstallProposal -> INFO 001 Installed remotely: response:<status:200 payload:"\nHmarbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649\022\007marbles" >
2021-01-10 14:16:07.493 CET [cli.lifecycle.chaincode] submitInstallProposal -> INFO 002 Chaincode code package identifier: marbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649
```

5.2 Copy the chaincode package identifier (here: marbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649) and paste into `./chaincode/deploy/chaincode-deployment.yaml`. Replace the value of `CHAINCODE_CCID`. You can query installed chaincode as follows if the chaincode package identifier gets lost.
```shell
# Query installed chaincode of peer
peer lifecycle chaincode queryinstalled

# Should print similar output to
Installed chaincodes on peer:
Package ID: marbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649, Label: marbles
```

5.3 At this point, we need to build a docker image containing the chaincode as well as its runtime environment. You can check `./chaincode/Dockerfile` as an example. Next, you would need to push the docker image to an image registry. However, this has already been done and you can you use `udosson/chaincode-marbles:1.0` (Docker Hub, public)

5.4. Now we can start the chaincode. The next command will create one pod (1 container) with one service. Change the value of yournamespace
```shell
# Change dir to multi-cloud-deployment from ./chaincode/packaging
cd ../..

# Start chaincode
kubectl apply -f ./chaincode/deploy/chaincode-deployment.yaml -n yournamespace

# Should print similar output to
deployment.apps/chaincode-marbles created
service/chaincode-marbles created

# Wait for 1 minutes and check if peer is chaincode container is running
kubectl get pod -n yournamespace

# Should print a similar output
NAME                                 READY   STATUS    RESTARTS   AGE
chaincode-marbles-5c44496446-pbpz6   1/1     Running   0          5s
fabric-ca-6884b9dc5-zjxrz            1/1     Running   0          3d20h
fabric-orderer1-56688dbbdc-4dltz     1/1     Running   0          21m
fabric-peer1-5cf97d7cb4-5gftb        2/2     Running   0          32m
```

5.5 Next, we follow the [Chaincode Lifecyle](https://hyperledger-fabric.readthedocs.io/en/release-2.2/chaincode_lifecycle.html) by running the script `./deployCC.sh`. Take a look at the script and change the value of `CC_PACKAGE_ID`.
```shell
# Run deployCC.sh. Remember to change the value of CC_PACKAGE_ID
./deployCC.sh

# Should print a similar output
+++++Export chaincode package identifier+++++
[...]
+++++Query commited chaincode+++++
Committed chaincode definition for chaincode 'marbles' on channel 'emissions-data':
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [sampleOrg: true]
```

5.6. Invoke chaincode manually by running the following commands. If you get the expected results without any errors, you successfully deployed Hyperledger Fabric to your Kubernetes cluster. Congrats on that!!
```shell
# Invoke chaincode
peer chaincode invoke -o ${ORDERER_ADDRESS} --tls --cafile ${ORDERER_TLSCA} -C emissions-data -n marbles --peerAddresses ${CORE_PEER_ADDRESS} --tlsRootCertFiles ${CORE_PEER_TLS_ROOTCERT_FILE} -c '{"Args":["initMarble","marble1","blue","35","tom"]}' --waitForEvent

# Should print a similar output
2021-01-10 14:44:46.497 CET [chaincodeCmd] ClientWait -> INFO 001 txid [c176a9600494de93d0e213b106f595fee421c7f3affa465ec1b05d1bd0ba4e55] committed with status (VALID) at fabric-peer1.emissionsaccounting.sampleOrg.de:443
2021-01-10 14:44:46.497 CET [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 002 Chaincode invoke successful. result: status:200


# Query chaincode
peer chaincode query -C emissions-data -n marbles -c '{"Args":["readMarble","marble1"]}'

# Should print a similar output
{"color":"blue","docType":"marble","name":"marble1","owner":"tom","size":35}
```


## 5. Monitor Hyperledger Fabric network
TBD. --> Hyperledger Explorer


## 6. Troubleshooting
In the following, there are some hints to get rid of your error. If you run into an error that isn't listed, please report an issue if you cannot solve the problem by yourself. If you can solve it yourself, we very much appreciated it if you append your fix to the list below.

###### command not found: peer|configtxgen
Make sure you followed step 3.3 Fabric Binaries from chapter [3. Prerequisites](README.md#3-prerequisites)


