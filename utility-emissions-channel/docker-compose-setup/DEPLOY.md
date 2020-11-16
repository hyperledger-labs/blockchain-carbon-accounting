# blockchain-carbon-accounting deployment

Now that the app has been restructured, deployment is much more seamless to the development environment. By containerizing the API and creating custom client container using an Ubuntu image, we are able to run the whole app and binary commands in a docker swarm network. Now that we have adopted this setup, there is no need for dynamic URL/IP values, IP SANS, or access to the local machine from containers. To reset and start over at any time during this process, run ./scripts/reset.sh.

# Preparing your EC2 nodes

For this deployment, we will need two servers. For the purpose of this documentation, we will be referring to them as server A and server B. Server A will run the API/peer1/auditor1/orderer1/couch0, server B will run peer2/auditor2/orderer2/couch0.

1. Create server A, make sure to allow all sources and incoming traffic in the security settings for the purpose of this demo. You will want a decent amount of RAM on this server, probably 6-8. (t2.large)
2. Create server B, make sure to allow all sources and incoming traffic in the security settings for the purpose of this demo. You can most likely get away with using a t2 micro instance for this server.
3. SSH into both servers and git clone https://github.com/opentaps/blockchain-carbon-accounting/tree/deployment. Fill out the AWS credentials in a seperate file called aws-config.js based on utility-emissions-channel/chaincode/node/lib/aws-config.js.template.
4. Install docker on both machines by running ./scripts/deploy/install-docker.sh
5. Exit and re-enter the SSH session on both servers to activate changes

# Setting up the network

For this section, you will find a collection of utility scripts in docker-compose-setup/scripts/deploy. The folder node-one refers to server A's scripts, and node-two refers to server B's scripts. Work from the docker-compose-setup directory when executing these commands. If there are ever permissions issues, sudo chown -R \$USER ~/blockchain-carbon-accounting.

1. On server A, run:

```bash
./scripts/deploy/node-one/start.sh.
```

This will create a doker swarm, network, create the Cli, create the CA, and connect them all to the network.

2. On Server A, run:

```bash
docker swarm join-token worker
```

Copy the command and use it to join the swarm on server B.

3. On server B, run:

```bash
./scripts/deploy/node-two/start.sh.
```

This will create CA for this server.

4. On server B, SCP -r the contents of ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor2 to the same directory on server A. This will ensure that the proper certs are in place to register/enroll the admins/users and generate the system genesis block.

```bash
scp -r ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor2 SERVER_A_IP ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor2
```

5. On Server A, run:

```bash
./scripts/deploy/node-one/generateCryptoCreateOrgs.sh.
```

This will register/enroll admins/users, generate the system genesis block, and create the CCP for the API.

6. On Server A, SCP -r the system genesis block directory ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/system-genesis-block to server B.

```bash
scp -r  ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/system-genesis-block SERVER_B_IP ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/system-genesis-block
```

7. On Server A, SCP -r ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/peerOrganizations/auditor2.carbonAccounting.com to the same directory in server B.

```bash
scp -r  ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/peerOrganizations/auditor2.carbonAccounting.com SERVER_B_IP ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/peerOrganizations/auditor2.carbonAccounting.com
```

8. On Server A, SCP -r ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor1 to the same directory in server B.

```bash
scp -r  ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor1 SERVER_B_IP ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor1
```

9. On Server A, run:

```bash
./scripts/deploy/node-one/startAndConnectNetwork.sh.
```

This will bring up peer1.auditor1, orderer1.auditor1, and couchdb0. This will also generate the proper certs for auditor1.carbonAccounting.com under organizations/peerOrganizations.

10. On Server B, run:

```bash
./scripts/deploy/node-two/startAndConnectNetwork.sh
```

This will bring up peer1.auditor2, orderer1.auditor2, and couchdb1. This will also generate the proper certs for auditor2.carbonAccounting.com under organizations/peerOrganizations.

11. On Server B, now that all the proper certs are in place, SCP -r ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations to the same directory on server A so that both servers have them.

```bash
scp -r  ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor1 SERVER_A_IP ~/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/organizations/fabric-ca/auditor1
```

# Creating the channel, deploying the chaincode

1. Everything should now be in place to create the channel. On Server A, run:

```bash
./scripts/deploy/node-one/createChannel.sh.
```

This will generate the utilityEmissions channel by execing the script into the client container.

2. On Server A, deploy the CC by running:

```bash
./scripts/deploy/node-one/deployCC.sh.
```

This will deploy the CC over the network by execing the script into the client container.

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
./scripts/deploy/node-one/startApi.sh.
```

This will spin up a containerized version of the API, install dependencies, join the network, and then start API using nodemon for refresh on change. It will also mount the API window to the current terminal session.

2. Assuming you have opened up all ports/traffic in the network, navigate to http://EC2_INSTANCE_IP_HERE:9000/api-docs to interact with the swagger UI, or connect this same url to an opentaps repo to access the ledger.
