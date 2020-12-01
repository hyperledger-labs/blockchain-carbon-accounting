# utility-emissions-channel

# Setting up the app

## Set up AWS credentials and configure environment

The utility emissions channel can be run locally or remotely using Amazon S3 and DynamoDB. In either case you will need a configuration file for AWS.

First, create a new file in `chaincode/node/lib called aws-config.js` by copying from `aws-config.js.template`

```bash
cp ./chaincode/node/lib/aws-config.js.template ./chaincode/node/lib/aws-config.js
```

If you're running with remote AWS, then fill it out with your credentials for AWS based on the fields requested in `aws-config.js.template`. Otherwise, you can leave the credentials blank but set the other fields based on directions below.

### Configure S3/DynamoDB Locally

#### S3

1. Be sure that the following line is present in `aws-config.js`:

```bash
exports.S3_LOCAL = true;
```

2. Set the value of `BUCKET_NAME` in `aws-config.js` to `local-bucket` if it is not already set.

##### About S3 local storage

Serverless S3 stores pdfs in a folder called local-bucket within the typescript_app directory.

To reset this bucket at any time, simply remove the folder.

#### DynamoDB

1. See "Load the Data" below.

### Configure S3/DynamoDB Remotely

#### S3

1. Set up an S3 bucket and set the value of `BUCKET_NAME` in `aws-config.js` to the name of the newly created bucket.

2. Set `S3_LOCAL` to false in `aws-config.js`

#### DynamoDB

1. Set AWS_ENDPOINT to the endpoint of your remote dynamodb

## Load the Data

### Loading Locally

#### DynamoDB

1. If using the localdynamodb, execute the following from the docker-compose-setup directory to start dynamodb:

```bash
./scripts/startDynamo.sh
```

2. Seed the db, see eGrid Loader documentation [here](egrid-data-loader/README.md).

#### S3

1. The api will start automatically at the end of `start.sh`, but alternatively, start the API from the docker-compose-setup directory:

```bash
sh ./scripts/startApi.sh
```

2. From the typescript_app directory, start the S3 emulation:

```bash
sh startLocalS3.sh
```

### Loading Remotely

#### DynamoDB

1. Seed the db, see eGrid Loader documentation [here](egrid-data-loader/README.md).

## Get the blockchain network up and running

1. Install Prerequisites (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)
2. cd to `docker-compose-setup`
3. Start network, create channel, and deployCC: Run `sh start.sh`
4. (optional) Start Hyperledger Explorer (http://localhost:8080, username: exploreradmin, pw: exploreradminpw): Run `./network.sh startBlockchainExplorer`

##### Play with the chaincode and have a look at the blockchain-explorer.

1. With the app running, exec into the Cli container:

```bash
docker exec -ti cli bash
```

2. Invoke chaincode with peer binaries

```shell
# Record emission to utilityemissionchannel
./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["11208","MyCompany","2018-06-01","2018-06-30","150","KWH"]}' 1 2 3

# Query emission data
./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["11208","MyCompany","2018-06-01","2018-06-30"]}' 1
```

## Start Express server (REST API)

1. cd to `utility-emissions-channel/typescript_app`
2. Install node modules: RUN `npm i`
3. Start express sever: Run `sh start.sh`
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
2. Run `./scripts/reset.sh`

#### Stop blockchain explorer

1. cd to `docker-compose-setup`
2. Run `./network.sh stopBlockchainExplorer`

## Troubleshooting

If any error in `Get the blockchain network up and running` please run the commands of `Stop the blockchain network and remove container` and retry starting the network. If you still run into errors open an issue with the error logs, please.
