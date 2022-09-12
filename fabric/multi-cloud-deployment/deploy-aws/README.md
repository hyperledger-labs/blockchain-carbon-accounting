 f# AWS deployment of Hyperledger Fabric

This is AWS specific deployment steps in addition to the main guide


## 3. Prerequisites
#### 3.1 Kubernetes
You need to have a running Kubernetes cluster and deploy one nginx ingress controller to it.

In order to run Kubernets cluster manually, use [Getting started with Amazon EKS instruction](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html).

Or you can use the [eksctl util](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html) which creates Kubernetes cluster and nodes in one command.  For example
```bash
eksctl create cluster \
--name cluster-4 \
--region us-west-2 \
--with-oidc \
--managed \
--version 1.17 \
--node-volume-size 20 \
--instance-types t3.small
```
###### Create namespaces

```bash
kubectl create -f ./namespace-fabric-production.json
```

###### Nginx Controller Config
Go to https://github.com/kubernetes/ingress-nginx/tree/master/deploy/static/provider and copy the `deploy.yaml` file to your filesystem according to your cloud provider.

In the `deploy.yaml` file add `--enable-ssl-passthrough` to the args section of the controller container.

**For AWS you may use `/deploy-aws/ kubernetes-ingress-controller-deploy.yaml`**

```sh
kubectl apply -f ./kubernetes-ingress-controller-deploy.yaml
```

#### 3.2 Domain Names
1.1. Create subdomains on Route 53 for fabric-ca, fabric-peer, and fabric-orderer, e.g., fabric-ca.emissionsaccounting.yourdomain.com

1.2. Link subdomains to nginx ingress IP address ( at cluster management level) after you you started the nginx ingress as describe in step 3.2.

AWS: set up Route 53 to have your domain pointed to the NLB

`fabric-ca.emissionsaccounting.<your-domain>.           A.    ALIAS abf3d14967d6511e9903d12aa583c79b-e3b2965682e9fbde.elb.us-east-1.amazonaws.com `

![plot](./imgs/subdomain.png)

##### Ingress Service Config
Next, you need to prepare your ingress to route the the subdomains of your Hyperledger Fabric infrastructure with `nginx.ingress.kubernetes.io/ssl-passthrough: "true"`.

**For AWS you can use `/deploy-aws/ingress-fabric-services-deployment.yaml`**

```sh
kubectl apply -f ./ingress-fabric-services-deploy.yaml
```

Set the following values according to your setup:
- name: name-of-your-ingress
- host: sudomain-to-fabric-ca
- host: sudomain-to-fabric-peer
- host: sudomain-to-fabric-orderer
Of course, you can add additional rules for e.g. a second peer node.

## 4. Start Hyperledger Fabric network
#### 4.1. Crypto-material
The following step to accomplish to start the multi-cloud Hyperledger Fabric network or even your organizations' infrastructure is to generate the crypto-material. We use fabric certificate authority (ca) for this. Each organization has its own fabric-ca.

1. Configure `./deploy-aws/fabric-config/fabric-ca-server-config.yaml`
change the values of:
- fabric-ca-subdomain
- ca-admin
- ca-admin-password (Use a strong password and keep it safe)
- your organization
2. Create configmap
Change value of namespace.
```shell
kubectl create cm fabric-ca-server-config --from-file=./fabric-config/fabric-ca-server-config.yaml -n fabric-production
```
   3.  Adjust the deployment configuration of `./deploy-aws/fabric-ca-deployment.yaml`.

Take a closer look at the PVC section.

On AWS you would need to create a static ebs volume.

https://rtfm.co.ua/en/kubernetes-persistentvolume-and-persistentvolumeclaim-an-overview-with-examples/

```bash
aws ec2 --profile <aws_profile> --region <us-west-2> create-volume --availability-zone <us-west-2a> --size 1
# aws ec2 --profile opensolar --region us-west-2 create-volume --availability-zone us-west-2a --size 1
```
Update `PersistentVolume` `./fabric-ca-deployment.yaml` with volumeID of created ebs.

NOTE: if you re-initializing the setup you should delete old `ebs` and create a new ones as it stores old configs.

4. Start fabric-ca
```shell
kubectl apply -f ./fabric-ca-deployment.yaml -n fabric-production
```
5. Copy fabric-ca tls certificate

 - Get the name of the fabric-ca pod

- Copy tls certificate to local file system
```shell
# Export fabric ca client home; change <your-domain>, e.g., `emissionsaccounting.sampleOrg.de`

mkdir -p ${PWD}/crypto-material/opensolarx.com/fabric-ca

export FABRIC_CA_CLIENT_HOME=${PWD}/crypto-material/opensolarx.com/fabric-ca

export FABRIC_CA_CLIENT_TLS_CERTFILES=${PWD}/crypto-material/opensolarx.com/fabric-ca/tls-cert.pem

# Returns fabric-ca pod of yournamespce
kubectl get pod -n fabric-production | grep fabric-ca

# Copy tls-cert.pem
kubectl cp "<fabric-ca-pod>:/etc/hyperledger/fabric-ca-server/tls-cert.pem" "${FABRIC_CA_CLIENT_HOME}/tls-cert.pem" -n fabric-production
```
6. Configure ingress (Skip this step if this already happened)
Adjust the deployment configuration of `./ingress-fabric-services-deploy.yaml`
Change:
- name: name-of-your-ingress
- host: sudomain-to-fabric-ca

Apply deployment configuration.
```shell
kubectl apply -f ./ingress-fabric-services-deploy.yaml -n fabric-production
```
7. Generate crypto-material
Set input variables of `registerEnroll.sh` according to your organizations configuration

Get fabric binaries

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- -d -s
```

Run the script
```shell
./registerEnroll.sh
```
#### 4.2. Orderer
Once all the crypto material is created, we can start the orderer.

1. Create orderer genesis block
NOTE: For testing purposes, change the values of `/fabric-config/configtx.yaml`. This is just a way for you to test the functionality of your configuration before you try to start interacting with nodes from different organizations. Values to change:
- Name of the organization (sampleorg)
- Subdomain of peer and orderer

Changes the values accordingly your setup, e.g., `-n fabric-production`
```shell
# use configtxgen to create orderer.genesis.block
./bin/configtxgen -profile MultiNodeEtcdRaft -channelID system-channel -outputBlock ./system-genesis-block/orderer.genesis.block -configPath ./fabric-config

# create configmap of orderer.genesis.block
kubectl create cm system-genesis-block  --from-file=./system-genesis-block/orderer.genesis.block -n fabric-production
```

2. Create secret of crypto-material

Next we need to create a secret that contains all the crypto-material of the orderer (msp and tls). Change the path to crypto-material of orderer and Kubernetes namespace.
```shell
mkdir tmp-crypto && cd tmp-crypto
# pack crypto-material of orderer into one *.tgz file (example of path: "/Users/user1/Documents/GitHub/blockchain-carbon-accounting/multi-cloud-deplyoment/crypto-material/emissionsaccounting.yourdomain.com/orderers/fabric-orderer1.emissionsaccounting.yourdomain.com")
tar -zcf "orderer-crypto.tgz" -C "/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deployment/deploy-aws/crypto-material/opensolarx.com/orderers/fabric-orderer.opensolarx.com" .

# create secret of *.tgz file
kubectl create secret generic orderer-crypto --from-file=orderer-crypto=orderer-crypto.tgz -n fabric-production && cd -
```

3. Start orderer

Now it's time to start the orderer. Apply `fabric-orderer-deplyoment.yaml` to your cluster.   But first, change the value of `ORDERER_GENERAL_LOCALMSPID` to your organization's msp (find it here `./fabric-config/orderer.yaml` value `LocalMSPID`).

Create ebs volume

```bash
aws ec2 --profile opensolar --region us-west-2 create-volume --availability-zone us-west-2a --size 20
# aws ec2 --profile opensolar --region us-west-2 create-volume --availability-zone us-west-2a --size 20
```

Update `PersistentVolume` at `./deploy-aws/fabric-orderer-deplyoment.yaml` with volumeID of created ebs

Run orderer deployment

```shell
kubectl apply -f ./fabric-orderer-deployment.yaml -n fabric-production
```
if everyhting goes fine you should see similar logs
```sh
kubectl logs fabric-orderer-564897bb8c-lhz9d --tail 100 -n fabric-production

2021-01-09 13:35:05.257 UTC [orderer.consensus.etcdraft] Check -> DEBU 50d Current active nodes in cluster are: [1] channel=system-channel node=1
2021-01-09 13:35:07.257 UTC [orderer.consensus.etcdraft] Check -> DEBU 50e Current active nodes in cluster are: [1] channel=system-channel node=1
2021-01-09 13:35:09.257 UTC [orderer.consensus.etcdraft] Check -> DEBU 50f Current active nodes in cluster are: [1] channel=system-channel node=1
2021-01-09 13:35:11.257 UTC [orderer.consensus.etcdraft] Check -> DEBU 510 Current active nodes in cluster are: [1] channel=system-channel node=1

```

#### 4.3. Peer
Now it's time to start (and test) the peer node.

1. Create a new ebs volume

```bash
aws ec2 --profile opensolar --region us-west-2 create-volume --availability-zone us-west-2a --size 20
```
Update `PersistentVolume` `./deploy-aws/fabric-peer-deplyoment.yaml` with volumeID of created ebs

2. Edit `./deploy-aws/fabric-peer-deplyoment.yaml` and change the following values according to your configuration:

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
Next we need to create a secret that contains all the crypto-material of the peer (msp and tls). Change the path to crypto-material of peer and Kubernetes namespace.
```shell
cd tmp-crypto
# pack crypto-material of orderer into one *.tgz file (example of path: "/Users/user1/Documents/GitHub/blockchain-carbon-accounting/multi-cloud-deplyoment/crypto-material/emissionsaccounting.yourdomain.com/peers/fabric-peer1.emissionsaccounting.yourdomain.com")
tar -zcf "peer-crypto.tgz" -C "/home/pk/Projects/blockchain-carbon-accounting/multi-cloud-deployment/deploy-aws/crypto-material/opensolarx.com/peers/fabric-peer.opensolarx.com" .

# create secret of *.tgz file
kubectl create secret generic peer-crypto --from-file=peer-crypto=peer-crypto.tgz -n fabric-production
cd -
```

3. Create configmap of channel artifacts
In order to pass the channel artifacts of the first channel, we package them into a configmap which we'll mount to the pod. Changes the value of and yournamespace.
```shell
# run the tool configtxgen with the sample confitgtx.yaml file you created in section 1 of chapter 4.2 to create channel artifacts

./bin/configtxgen -profile MultipleOrgsChannel -outputCreateChannelTx ./channel-artifacts/emissions-data.tx -channelID emissions-data -configPath ./fabric-config

# Create configmap

kubectl create cm emissions-data  --from-file=./channel-artifacts/emissions-data.tx -n fabric-production
```

4. Create configmap of anchor peers update

Next, we create a second configmap of the peer nodes which contains the information about the anchor peer. Changes the values of yournamespace, sampleOrg, and sampleorganchors.
```shell
# run the tool configtxgen with the sample confitgtx.yaml file you created in section 1 of chapter 4.2 to create anchros peers update.

./bin/configtxgen -profile MultipleOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/emitrasanchors.tx -channelID emissions-data -asOrg opensolarx -configPath ./fabric-config

kubectl create cm opensolarxanchors --from-file=./channel-artifacts/emitrasanchors.tx -n fabric-production
```

5. Create config maps for external chaincode builder

In order to use [chaincode as an external service](https://hyperledger-fabric.readthedocs.io/en/release-2.2/cc_service.html), we need to prepare the peer with configmaps containing the external builder scripts as well as an updated core.yaml file. Most of the part from this section is copied from the repo [vanitas92/fabric-external-chaincodes](https://github.com/vanitas92/fabric-external-chaincodes). Change the value of yournamespace
```shell
# Create external chaincode builder configmap
kubectl apply -f ./external-chaincode-builder-config.yaml -n fabric-production

# Should print a similar output
configmap/external-chaincode-builder-config
```

6. Start peer
Now it's time to start the peer. Apply `fabric-peer-deplyoment.yaml` to your cluster.
```shell
kubectl apply -f ./fabric-peer-deployment.yaml -n fabric-production
```

if everyhting goes fine you should see similar logs
```sh
kubectl logs fabric-peer-7557bfb788-9v8wc --tail 100 -n fabric-production -c fabric-peer

2021-01-09 13:47:30.629 UTC [gossip.discovery] periodicalSendAlive -> DEBU 176 Sleeping 5s
2021-01-09 13:47:34.630 UTC [gossip.discovery] InitiateSync -> DEBU 177 No peers to send to, aborting membership sync
2021-01-09 13:47:35.617 UTC [gossip.discovery] periodicalReconnectToDead -> DEBU 178 Sleeping 25s
2021-01-09 13:47:35.630 UTC [gossip.discovery] periodicalSendAlive -> DEBU 179 Empty membership, no one to send a heartbeat to
```

#### 4.4. Test your infrastructure against the test configuration
In this step, we'll create a channel in your running Hyperledger Fabric network consisting of 1 fabric-ca, 1 orderer node, and 1 peer node. Also, we will make the peer join the created channel.
1. Set ENV variables
Open `setEnv.sh` and set the values of the ENVs according to your setup.
```shell
# sourve ENVs
source ./setEnv.sh
```

2. Create Channel
Run the command `peer channel create` and the value of yourdomain

```shell
./bin/peer channel create -o ${ORDERER_ADDRESS} -c emissions-data -f ./channel-artifacts/emissions-data.tx --outputBlock ./channel-artifacts/emissions-data.block --tls --cafile $ORDERER_TLSCA

# Should print a similar output
2021-01-11 10:53:30.112 MSK [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2021-01-11 10:53:31.191 MSK [cli.common] readBlock -> INFO 002 Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-01-11 10:53:31.790 MSK [channelCmd] InitCmdFactory -> INFO 003 Endorser and orderer connections initialized
2021-01-11 10:53:32.389 MSK [cli.common] readBlock -> INFO 004 Received block: 0
```

3. Join Peer to Channel
Run the command `peer channel join`
```shell
./bin/peer channel join -b ./channel-artifacts/emissions-data.block

# Should print a similar output
2021-01-11 11:00:44.314 MSK [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2021-01-11 11:00:45.066 MSK [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel

```

4. Verify that peer has joind the channel
```shell
./bin/peer channel list

# Should print similar output to
2021-01-11 11:01:32.253 MSK [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
Channels peers has joined:
emissions-data
```

#### 4.5. Deploy chaincode


##### 1. Deploy marbles example chaincode as external service

Next, we deploy a sample chaincode to the emissions-data. Follow the next steps carefully.

1.1. First, we package and install the chaincode to one peer. In `./chaincode/packacking/connection.json` replace the value of `yournamespace` (e.g., "address": "chaincode-marbles.fabric-production:7052"). If you use `fabric-production` namespace, than
``` shell
# change dir to chaincode/packaging
parentdir="$(pwd)"
cd ./chaincode/packaging

# tar connection.json and metadata.json
tar cfz code.tar.gz connection.json
tar cfz marbles-chaincode.tgz code.tar.gz metadata.json

# install chaincecode package to peer
$parentdir/bin/peer lifecycle chaincode install marbles-chaincode.tgz

# Should print similar output to
2021-01-16 13:20:31.383 MSK [cli.lifecycle.chaincode] submitInstallProposal -> INFO 001 Installed remotely: response:<status:200 payload:"\nHmarbles:d750084d91b0f536fb76471ed3854eb7892271a44b95563d1e7dbbb122f47469\022\007marbles" >
2021-01-16 13:20:31.383 MSK [cli.lifecycle.chaincode] submitInstallProposal -> INFO 002 Chaincode code package identifier: marbles:d750084d91b0f536fb76471ed3854eb7892271a44b95563d1e7dbbb122f47469
```

1.2 Copy the chaincode package identifier (here: marbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649) and paste into `./chaincode/deploy/chaincode-deployment.yaml`. Replace the value of `CHAINCODE_CCID`. You can query installed chaincode as follows if the chaincode package identifier gets lost.
```shell
# Query installed chaincode of peer
./bin/peer lifecycle chaincode queryinstalled

# Should print similar output to
Installed chaincodes on peer:
Package ID: marbles:68219a1d6006f8b5a2eb0ad394b125670a279a7f7eaf816f30d86574af8df649, Label: marbles
```

1.3 At this point, we need to build a docker image containing the chaincode as well as its runtime environment. You can check `./chaincode/Dockerfile` as an example. Next, you would need to push the docker image to an image registry. However, this has already been done and you can you use `udosson/chaincode-marbles:1.0` (Docker Hub, public)

1.4. Now we can start the chaincode. The next command will create one pod (1 container) with one service. Change the value of yournamespace
```shell
# Change dir to multi-cloud-deployment from ./chaincode/packaging
cd ../..

# Start chaincode
kubectl apply -f ./chaincode/deploy/chaincode-deployment.yaml -n fabric-production

# Should print similar output to
deployment.apps/chaincode-marbles created
service/chaincode-marbles created

# Wait for 1 minutes and check if peer is chaincode container is running
kubectl get pods -n fabric-production

# Should print a similar output
NAME                                 READY   STATUS    RESTARTS   AGE
chaincode-marbles-5c44496446-pbpz6   1/1     Running   0          5s
fabric-ca-6884b9dc5-zjxrz            1/1     Running   0          3d20h
fabric-orderer1-56688dbbdc-4dltz     1/1     Running   0          21m
fabric-peer1-5cf97d7cb4-5gftb        2/2     Running   0          32m
```

1.5 Next, we follow the [Chaincode Lifecyle](https://hyperledger-fabric.readthedocs.io/en/release-2.2/chaincode_lifecycle.html) by running the script `./deployCC.sh`. Take a look at the script and change the value of `CC_PACKAGE_ID`.
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

1.6. Invoke chaincode manually by running the following commands. If you get the expected results without any errors, you successfully deployed Hyperledger Fabric to your Kubernetes cluster. Congrats on that!!
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

##### 2. Deploy emissions chaincode as external service

Next, we deploy a emissions chaincode to the emissions-data. Follow the next steps carefully.

2.1. First, we package and install the chaincode to one peer. In `fabric/chaincode/packaging/connection.json` set the value of `your address` (e.g., "address": "chaincode-emissions.fabric-production:7052"). If you use `fabric-production` namespace, than
``` shell
# change dir to fabric/chaincode/packaging
cd fabric/chaincode/packaging
source ../../../multi-cloud-deployment/deploy-aws/setEnv.sh

# tar connection.json and metadata.json
tar cfz code.tar.gz connection.json
tar cfz emissions-chaincode.tgz code.tar.gz metadata.json

# install chaincecode package to peer
../../../multi-cloud-deployment/deploy-aws/bin/peer lifecycle chaincode install emissions-chaincode.tgz

# Should print similar output to
2021-02-26 19:59:09.241 EET [cli.lifecycle.chaincode] submitInstallProposal -> INFO 001 Installed remotely: response:<status:200 payload:"\nQemissions:0ee431100d9b7ab740c0e72ec86db561b052fd1b9b1e47de198bbabd0954ee97\022\020emissions" >
2021-02-26 19:59:09.241 EET [cli.lifecycle.chaincode] submitInstallProposal -> INFO 002 Chaincode code package identifier: emissions:0ee431100d9b7ab740c0e72ec86db561b052fd1b9b1e47de198bbabd0954ee97
```

2.2. Copy the chaincode package identifier (here: emissions:0ee431100d9b7ab740c0e72ec86db561b052fd1b9b1e47de198bbabd0954ee97) and paste into `fabric/chaincode/deploy/chaincode-deployment.yaml`. Replace the value of `CHAINCODE_CCID`. You can query installed chaincode as follows if the chaincode package identifier gets lost.
```shell
# Query installed chaincode of peer
../../../multi-cloud-deployment/deploy-aws/bin/peer lifecycle chaincode queryinstalled

# Should print similar output to
Installed chaincodes on peer:
Package ID: emissions:0ee431100d9b7ab740c0e72ec86db561b052fd1b9b1e47de198bbabd0954ee97, Label: emissions
```

2.3. At this point, we need to build a docker image containing the chaincode as well as its runtime environment. See `fabric/chaincode/typescript`.
``` shell
docker build -t krybalko/emissions-chaincode:0.0.3 .
```

Next, you would need to push the docker image to an image registry. However, this has already been done and you can you use `krybalko/emissions-chaincode:0.0.3` (Docker Hub, public)


2.4. Now we can start the chaincode. The next command will create one pod (1 container) with one service. Change the value of yournamespace
```shell
# Change dir to multi-cloud-deployment from ./chaincode/packaging
cd ../..

# Start chaincode
kubectl apply -f ./chaincode/deploy/chaincode-deployment.yaml -n fabric-production

# Should print similar output to
deployment.apps/chaincode-emissions created
service/chaincode-emissions created

# Wait for 1 minutes and check if peer is chaincode container is running
kubectl get pods -n fabric-production

# Should print a similar output
NAME                                         READY   STATUS    RESTARTS   AGE
chaincode-emissions-89c496668-trf47   1/1     Running   0          22h
fabric-ca-f949798db-8fv2q                    1/1     Running   0          12d
fabric-orderer-6b94b74596-29rww              1/1     Running   0          12d
fabric-peer-77b54dc4cf-kf7xl                 2/2     Running   0          12d
```


2.5. Next, we follow the [Chaincode Lifecyle](https://hyperledger-fabric.readthedocs.io/en/release-2.2/chaincode_lifecycle.html) by running the script `./deployCC.sh`. Take a look at the script and change the value of `CC_PACKAGE_ID`.
```shell
# Run deployCC.sh. Remember to change the value of CC_PACKAGE_ID
./deployCC.sh

# Should print a similar output
+++++Export chaincode package identifier+++++
emissions:0ee431100d9b7ab740c0e72ec86db561b052fd1b9b1e47de198bbabd0954ee97
emissions
[...]
+++++Query commited chaincode+++++
Committed chaincode definition for chaincode 'emissions' on channel 'emissions-data':
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [opentaps: true]
```

2.6. In order to test chaincode we need to [seed Fabric](https://github.com/opentaps/blockchain-carbon-accounting/tree/main/fabric/emissions-data#seeding-the-fabric-database) database first from the `multi-cloud-deployment/deploy-aws` directory.

Make sure you have node modules installed in the fabric/docker-compose-setup directory

    $ cd fabric/docker-compose-setup
    $ npm install

and in the `multi-cloud-deployment/deploy-aws` directory run

    $ source ./setEnv.sh


After seeding  you can run a script to record and get the emissions:
```shell
# Record emission to emissions-data
$ sudo bash ./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["USA_EIA_11208","MyCompany","2018-06-01T10:10:09Z","2018-06-30T10:10:09Z","150","KWH","url","md5"]}' 1 2

# Query emission data
$ sudo bash ./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["7fe9ccb94fb1b0ee302b471cdfafbd4c"]}' 1
```

## 5. Monitor Hyperledger Fabric network

Fabric peer pod name could be found with commands like

    $ kubectl get pods --all-namespaces
    $ kubectl get pods -n fabric-production

You should see lines like
```
NAME                                         READY   STATUS    RESTARTS   AGE
fabric-peer-77b54dc4cf-xxxxx                 2/2     Running   0          23d
```

To login to the couchdb container use

    $ kubectl exec --stdin --tty fabric-peer-77b54dc4cf-xxxxx -n fabric-production -c couchdb -- sh

From there you could locally use `curl` to check out the couchdb:
```
# curl http://127.0.0.1:5984/
{"couchdb":"Welcome","version":"2.3.1","git_sha":"c298091a4","uuid":"7ee7168378b0496c2e5f982effe3b9ad","features":["pluggable-storage-engines","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}
```

But this is not very nice.  You can also set up a port forward (see [details](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/)) like this:
```
$ kubectl port-forward fabric-peer-77b54dc4cf-xxxx -n fabric-production :5984
Forwarding from 127.0.0.1:54125 -> 5984
Forwarding from [::1]:54125 -> 5984
```

Then go to your `http://127.0.0.1:54125/_utils` (replace `54125` with the port number from `kubectl`) to access the CouchDB user interface.


TBD. --> Hyperledger Explorer


## 6. Troubleshooting
In the following, there are some hints to get rid of your error. If you run into an error that isn't listed, please report an issue if you cannot solve the problem by yourself. If you can solve it yourself, we very much appreciated it if you append your fix to the list below.

###### command not found: peer|configtxgen
Make sure you followed step 3.3 Fabric Binaries from chapter [3. Prerequisites](README.md#3-prerequisites)

