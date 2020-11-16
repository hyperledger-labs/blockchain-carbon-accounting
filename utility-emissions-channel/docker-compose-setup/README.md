# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case in a docker-compose setup and provides a REST API to interact with the blockchain.

# Running the Code

## Get the blockchain network up and running

1. Install Prerequisites (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)
2. Setup AWS credentials in `chaincode/node/lib/aws-config.js`::
   exports.AWS_ACCESS_KEY_ID = 'your_access_key';
   exports.AWS_SECRET_ACCESS_KEY = 'your_secret_key';
3. cd to `docker-compose-setup`
4. Start network: Run `./network.sh up createChannel`
5. Deploy and invoke `emissionscontract` chaincode (JS): Run `./network.sh deployCC`
6. (optional) Start Hyperledger Explorer (http://localhost:8080, username: exploreradmin, pw: exploreradminpw): Run `./network.sh startBlockchainExplorer`

##### Play with the chaincode and have a look at the blockchain-explorer.

1. Invoke chaincode with peer binaries

```shell
# Record emission to utilityemissionchannel
./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["11208","MyCompany","2018-06-01","2018-06-30","150","KWH"]}' 1 2 3

# Query emission data
./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["11208","MyCompany","2018-06-01","2018-06-30"]}' 1
```

2. Invoke chaincode with nodeJS
   2.1. cd to `docker-compose-setup/application`
   2.2. Install node modules: RUN `npm i`
   2.3. Create wallet: Run `node invokeChaincodeManually/createWallet.js`
   2.2. Invoke chaincode:

```shell
# Invoke chaincode
node invokeChaincodeManually/invoke.js

# Should print similar output
Wallet path: /Users/robinklemens/Documents/GitHub/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/application/wallet
{"class":"org.hyperledger.blockchain-carbon-accounting.emissionsrecord","key":"\"MediumUtility\":\"MyCompany\":\"2020-06-01\":\"2020-06-30\"","currentState":null,"emissionsAmount":150,"emissionsUom":"TONS","fromDate":"2020-06-01","partyId":"MyCompany","thruDate":"2020-06-30","utilityId":"MediumUtility"}
```

## Start Express server (REST API)

1. cd to `utility-emissions-channel/application`
2. Install node modules: RUN `npm i`
   (Not neceasary anymore 09/29/20. Create wallet for User1 of org auditor 1: Run `node ./src/blockchain-gateway/utilityEmissionsChannel/createWallet.js`)
3. Start express sever: Run `node index.js`
4. Go to `http://localhost:9000/api-docs/` to access swagger file from where you can interact with the blockchain.
5. Register org admin of org auditor1, auditor2, and/or auditor (e.g. { "orgName": "auditor1"})
6. Register and enroll user: First register org admin of step 5. Then register user with userId, orgName, and affiliation. (e.g. { "userID": "User8", "orgName": "auitor1", "affiliation": "auditor1.department1"} )
7. Interact with the `emissionscontract` chaincode.
   Note: As of 09/30/2020 the REST API a static, and doesn't include a proper error handling.

## Update emissioncontact Chaincode

1. cd to `docker-compose-setup`
2. Update Chaincode:
   Run `./network.sh deployCC -ccv 'VERSION' -ccs 'SEQUENCE'`
   e.g. update chaincode `emissionscontract` to version 2: `./network.sh deployCC -ccv 2.0 -ccs 2`
3. Check help, if further infomation is needed. Run: `./network.sh -h`

## Stop the blockchain network and remove container

1. cd to `docker-compose-setup`
2. Run `./network.sh down`

#### Stop blockchain explorer

1. cd to `docker-compose-setup`
2. Run `./network.sh stopBlockchainExplorer`

## Running AWS dynamodb locally

1. Setup credentials based on aws-config.js.template. Be sure to set AWS_REGION to "local" and AWS_ENDPOINT to "http://localdynamodb:8000".
1. Start dynamodb:

```bash
./scripts/startDynamo.sh
```

2. See docs in blockchain-carbon-accounting/utility-emissions-channel/egrid-data-loader/README.md for seeding the db

## Troubleshooting

If any error in `Get the blockchain network up and running` please run the commands of `Stop the blockchain network and remove container` and retry starting the network. If you still run into errors open an issue with the error logs, please.
