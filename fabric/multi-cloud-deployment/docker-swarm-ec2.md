# Utility Emissions Channel Cloud Deployment via Docker Swarm

This deployment uses Docker, Docker Swarm, and amazon EC2 to deploy the network across multiple hosts.

To reset the process at any time during the deployment, run the following on both servers:

```bash
cd ~/blockchain-carbon-accounting/emissions-data/docker-compose-setup
./scripts/fabricNetwork.sh
```

# Preparing your EC2 nodes

For this deployment, we will need two servers. For the purpose of this documentation, we will be referring to them as server A and server B. Server A will run the API/peer1/auditor1/orderer1/couch0, server B will run peer2/auditor2/orderer2/couch0.

1. Create server A, make sure to allow all sources and incoming traffic in the security settings for the purpose of this demo. You will want a decent amount of RAM on this server, probably 6-8. (t2.large)
1. Create server B, make sure to allow all sources and incoming traffic in the security settings for the purpose of this demo. You can most likely get away with using a t2 micro instance for this server.
1. SSH into both servers and `git clone https://github.com/opentaps/blockchain-carbon-accounting ; cd blockchain-carbon-accounting ; git checkout deployment`.
1. Fill out the AWS credentials in a separate file called `aws-config.js` based on `fabric/typescript_app/src/config/aws-config.js.template`.
1. Install docker on both machines by running `cd ~/blockchain-carbon-accounting/fabric/docker-compose-setup ; ./scripts/deploy/install-docker.sh`
1. Exit and re-enter the SSH session on both servers to activate changes
1. Setup SSH keys needed to run SCP later on, copy the EC2 private key in `~/ssh_key` on both servers and `chmod 600 ~/ssh_key`
1. Note the IP of both servers they will be referred to later **x.x.x.x** as Server A and **y.y.y.y** as Server B

# Setting up the network

For this section, you will find a collection of utility scripts in docker-compose-setup/scripts/deploy. The folder node-one refers to server A's scripts, and node-two refers to server B's scripts. Work from the docker-compose-setup directory when executing these commands. If there are ever permissions issues, sudo chown -R \$USER ~/blockchain-carbon-accounting.

## 1. On Server A, run:

```bash
export BASE_PATH=~/blockchain-carbon-accounting/emissions-data/docker-compose-setup
export SERVER_B_IP=y.y.y.y
cd $BASE_PATH
./scripts/deploy/node-one/start.sh
sudo chown -R ubuntu:ubuntu ~/blockchain-carbon-accounting
```

This will create a docker swarm, network, create the Cli, create the CA, and connect them all to the network.

Then:

```bash
docker swarm join-token worker
```

Finally, copy the command returned which looks like `docker swarm join --token some-long-token <ip>:<port>`. And save it for the next step.

## 2. On Server B, run:

```bash
export BASE_PATH=~/blockchain-carbon-accounting/emissions-data/docker-compose-setup
export SERVER_A_IP=x.x.x.x
cd $BASE_PATH
```

Use the command you copied from Server A to join the docker swarm:

```bash
docker swarm join --token some-long-token <ip>:<port>
```

Then:

```bash
./scripts/deploy/node-two/start.sh
sudo chown -R ubuntu:ubuntu ~/blockchain-carbon-accounting
```

This will create CA for this server.

Then copy them to Server A. This will ensure that the proper certs are in place to register/enroll the admins/users and generate the system genesis block.

```bash
scp -i ~/ssh_key -r $BASE_PATH/organizations/fabric-ca/auditor2 $SERVER_A_IP:$BASE_PATH/organizations/fabric-ca/
```

Create required directory

```bash
mkdir $BASE_PATH/organizations/peerOrganizations/
```

## 3. On Server A, run:

```bash
./scripts/deploy/node-one/generateCryptoCreateOrgs.sh
sudo chown -R ubuntu:ubuntu ~/blockchain-carbon-accounting
```

This will register/enroll admins/users, generate the system genesis block, and create the CCP for the API.

Then copy some of the needed files to Server B:

```bash
scp -i ~/ssh_key -r $BASE_PATH/system-genesis-block $SERVER_B_IP:$BASE_PATH/
scp -i ~/ssh_key -r $BASE_PATH/organizations/peerOrganizations/auditor2.carbonAccounting.com $SERVER_B_IP:$BASE_PATH/organizations/peerOrganizations/
```

Then:

```bash
./scripts/deploy/node-one/startAndConnectNetwork.sh
```

This will bring up peer1.auditor1, orderer1.auditor1, and couchdb0. This will also generate the proper certs for auditor1.carbonAccounting.com under organizations/peerOrganizations.

Copy CA to Server B:

```bash
scp -i ~/ssh_key -r $BASE_PATH/organizations/fabric-ca/auditor1 $SERVER_B_IP:$BASE_PATH/organizations/fabric-ca/
```

## 4. On Server B, run:

```bash
./scripts/deploy/node-two/startAndConnectNetwork.sh
```

This will bring up peer1.auditor2, orderer1.auditor2, and couchdb1. This will also generate the proper certs for auditor2.carbonAccounting.com under organizations/peerOrganizations.

Then, now that all the proper certs are in place, SCP -r \$BASE_PATH/organizations to the same directory on server A so that both servers have them.

```bash
scp -i ~/ssh_key -r $BASE_PATH/organizations/fabric-ca/auditor1 $SERVER_A_IP:$BASE_PATH/organizations/fabric-ca/
```

# Creating the channel, deploying the chaincode

1. Everything should now be in place to create the channel. On Server A, run:

```bash
./scripts/deploy/node-one/createChannel.sh
```

This will generate the Emissions channel by executing the script into the client container.

2. On Server A, deploy the CC by running:

```bash
./scripts/deploy/node-one/deployCC.sh
```

This will deploy the CC over the network by executing the script into the client container.

3. On Server A, test that the CC has been properly installed by running the following command INSIDE of the cli container by running:

```bash
docker exec -ti cli bash
```

Once inside, run:

```bash
./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["11208","MyCompany","2018-06-01","2018-06-30","150","KWH"]}' 1 2
```

## Start the API

1. On Server A, run:

```bash
./scripts/deploy/node-one/startApi.sh
```

This will spin up a containerized version of the API, install dependencies, join the network, and then start API using nodemon for refresh on change. It will also mount the API window to the current terminal session.

2. Assuming you have opened up all ports/traffic in the network, navigate to http://EC2_INSTANCE_IP_HERE:9000/api-docs to interact with the swagger UI, or connect this same url to an Opentaps repo to access the ledger.

## Additional Restrictions on the API

Currently, there is no API key built in to the express server. For now, traffic can be restricted by limiting the IPs allowed to access your server. In the case of AWS, this can be done with the follow steps:

1. Go to your security group for your servers

2. Click "edit inbound rules"

3. Adjust the source under "all traffic" to reflect only the IPs desired.
