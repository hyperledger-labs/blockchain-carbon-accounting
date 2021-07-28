#!/bin/bash
echo "Starting blockchain-carbon-accounting repo"

echo "Checking for carbonAccounting network..."
./scripts/startNetwork.sh

echo "Starting CAs..."
./scripts/startCA.sh
echo "Starting client..."
./scripts/startCli.sh

echo "Generating crpyto and orgs..."
docker exec -it cli /bin/bash ./network.sh up

echo "Starting orderers, peers, and couchdb..."
sh ./scripts/startAndConnectNetwork.sh

echo "Creating the channel..."
docker exec -it cli /bin/bash ./network.sh createChannel

echo "Install ext chaincode..."
docker exec -it cli /bin/bash ./scripts/installChaincode.sh 1 2
docker exec -it cli /bin/bash ./scripts/installChaincode.sh 1 1

echo "Starting ext chaincode..."
sh ./scripts/startExtChaincode.sh

echo "Deploying CC Ext..."
docker exec -it cli /bin/bash ./scripts/deployCCExt.sh 1 1
docker exec -it cli /bin/bash ./scripts/deployCCExt.sh 1 2

sleep 20
docker exec -it cli /bin/bash ./scripts/commitCCExt.sh 1 1

#echo "Deploy TrustID chaincode"
#./network.sh deployCC -ccn trustidcc -ccp ../chaincode/TrustID -ccl go
#sh ./scripts/invokeTrustID.sh '{"Args":["Init", "{\"did\":\"did:vtn:trustid:29222201b6662e5b2a07815f7f98b8653b306e3af3830dbaf2387da49ec744db\",\"controller\":\"did:vtn:trustid:29222201b6662e5b2a07815f7f98b8653b306e3af3830dbaf2387da49ec744db\",\"publicKey\":\"-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzP4bEUzWUJQh+gm9apHT6H1myWMqje4I3+F0d4NSPV8Y3HG0mOYr034fx34je9F82+YpToOO5utbQFlDTmCcI3S2hO4oNwV4xuvt+DCMm2QsYOPCy8BjMHFHiOxTVzlDNaq9YVrGeiEY6+e5e5c61y+Yi5YeaRld0RLBWkIfaQIAQyx/FgYFpzDDhxB/TznO9hiw5O5/MFqVOKFEhjT3ndXPRuHUi1F5BfidzlKzfU8G9LO4M+VLzRwnsWGsrgdyQwK8SG9RhcYwPBKMqxwdyUwwccX3DEovshPMxEdPGaj1zuJuAuJlcd504FZDSqszcTjbdSGUgivVWMv8HvRIoQIDAQAB-----END PUBLIC KEY-----\"}"]}' 1

echo "Starting the api..."
sh ./scripts/startApi.sh

