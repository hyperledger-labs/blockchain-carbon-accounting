# utility-emissions-channel

# Setting up the app

## Set up AWS credentials and configure environment

The utility emissions channel can be run locally or remotely using Amazon S3 and DynamoDB. In either case you will need a configuration file for AWS.

You can copy the configuration file from our template

```bash
$ cp ./chaincode/node/lib/aws-config.js.template ./chaincode/node/lib/aws-config.js
```

If you're running with remote AWS, then fill it out with your credentials for AWS based on the fields requested in `aws-config.js.template`. Otherwise, you can leave the credentials blank but set the other fields based on directions below.

### Configure S3 and DynamoDB Locally

#### S3

Serverless S3 stores documents in a folder called `local-bucket` within the `typescript_app` directory. To reset this bucket at any time, simply remove the folder. You can also test the integrity of the documents store by replacing some files with other copies. The emissions records will no longer be retrievable if you try to do this.

Set the following in `aws-config.js` if you're running locally:

```bash
exports.S3_LOCAL = true;
exports.BUCKET_NAME = "local-bucket";
```

#### DynamoDB

See "Load the Data" below for setting `exports.AWS_ENDPOINT` to your local DynamoDB.

### Configure S3/DynamoDB Remotely

#### S3

1. Set up an S3 bucket and set the value of `BUCKET_NAME` in `aws-config.js` to the name of the newly created bucket.

2. Set `S3_LOCAL` to false in `aws-config.js`

#### DynamoDB

Set AWS_ENDPOINT to the endpoint of your remote dynamodb

## Load the Data

If you're using the local dynamodb, execute the following from the `docker-compose-setup` directory to start dynamodb:

```bash
./scripts/startDynamo.sh
```

Then, for local or remote dynamodb, follow instructions from eGrid Loader documentation [here](egrid-data-loader/README.md).

## Get the blockchain network up and running

Install Prerequisites (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)

```bash
$ cd docker-compose-setup
```

Start network, create channel, and deployCC:

```bash
$ sh start.sh
```

Optionally, start Hyperledger Explorer ():

```bash
$ ./network.sh startBlockchainExplorer`
```

Now go to http://localhost:8080 with username `exploreradmin` and password `exploreradminpw`

### Test the chaincode and the blockchain-explorer.

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

```bash
$ cd utility-emissions-channel/typescript_app
# install node modules if you don't have it
$ npm i
$ sh start.sh
```

Now you can go to `http://localhost:9000/api-docs/` to access swagger file from where you can interact with the blockchain. You can test it by registering org admin of org auditor1, auditor2, and/or auditor (e.g. { "orgName": "auditor1"}), and then register and enroll users. First register org admin, then register user with userId, orgName, and affiliation. (e.g. { "userID": "User8", "orgName": "auitor1", "affiliation": "auditor1.department1"} ) Once you've done that, you can try the `emissionscontract` chaincode. Note that there is some error handling but may not be complete if your inputs are not correct.

### Local DynamoDB

If you're using the local dynamodb, make sure it's been started (see instructions above.)

### S3

Running serverless s3 locally requires the api to be started first. The api will start automatically at the end of `start.sh`, but alternatively, start the API from the `docker-compose-setup` directory:

```bash
$ sh ./scripts/startApi.sh
```

Then, from the typescript_app directory, start the S3 emulation:

```bash
$ sh startLocalS3.sh
```

## Update emissioncontact Chaincode

1. cd to `docker-compose-setup`
2. Update Chaincode:
   Run `./network.sh deployCC -ccv 'VERSION' -ccs 'SEQUENCE'`
   e.g. update chaincode `emissionscontract` to version 2: `./network.sh deployCC -ccv 2.0 -ccs 2`
3. Check help, if further infomation is needed. Run: `./network.sh -h`

## Stop the blockchain network and remove container

```bash
$ cd docker-compose-setup
$ ./scripts/reset.sh
```

#### Stop blockchain explorer

```bash
$ cd docker-compose-setup
$ ./network.sh stopBlockchainExplorer
```

## CouchDB

You can look around couchdb to see the records being stored on the ledger. Go to http://localhost:5984/_utils/ The default username and password are `admin` and `adminpw` Once you login, look in the `utilityemissionchannel_emissionscontract` table to see the emissions records, including links to the documents.

## Testing the network

We currently have a small test suite that will run the following tests via the API:

- Registering an auditor
- Registering a user under this auditor
- Recording an emission with this user
- Retrieve this emission and verify that all of the appropriate fields have been upserted to the ledger

For the tests to pass, you must first reset and restart the entire network. From the docker-compose-setup directory:

```bash
sh ./scripts/reset.sh && sh start.sh
```

When the network/API has fully started, run the tests by navigating to the typescript_app directory and executing the tests into the docker container:

```bash
sh runTests.sh
```

## Fabric Network && Net Emissions Token Network integration through REST API

There is currently functionality through an endpoint in the REST API to retrieve a series of emissions records by date a date range and then issue an Audited Emissions Token based on this data. The flow to use this technology is as follows.

### Setting up an Ethereum network

There are currently two options for starting an Ethereum network to deploy the Net Emissions Token Contract to - the hardhat test network, or Goerli.

#### Using the hardhat test network

##### Running in Docker

1. Start the hardhat test network from the net-emissions-token-network directory:

```bash
sh runDockerHardhatTestNet.sh
```

2. Deploy the contract to the hardhat test network via the following command in the net-emissions-token-network directory:

```bash
sh deployDockerHardHatContract.sh
```

#### Using the Goerli Network

TODO

### Starting the React frontend UI

1. Start the react app based on the documentation in the net-emissions-token-network [here](net-emissions-token-network/README.md).

2. Register a wallet as an Audited Emissions Token Dealer via the UI

### Starting the fabric network

The next section is about starting the fabric network and calling the endpoint through the API to issue the token. All of these scripts will be called from the utility-emissions-channel/docker-compose-setup directory.

1. (Optional) If needed, reset the fabric config:

```bash
sh ./scripts/reset.sh
```

2. Based on the template in utility-emissions-channel/typescript_app/src/blockchain-gateway/net-emissions-token-network, enter in your connection details for your ethereum network. For testing and development, the values that are currently within the template will work out of the box.

3. Start the fabric network:

```bash
sh start.sh
```

### Interacting with the API

1. Navigate to http://localhost:9000/api-docs/ in the browser of your choice to interact with the API via swagger.

2. Register an org using the UI. For example, the following arguments:

```bash
{
  "orgName": "auditor1"
}
```

3. Register a user under this newly registered org. For example, the following arguments:

```bash
{
  "userId": "testuser1",
  "orgName": "auditor1",
  "affiliation": "auditor1.department1"
}
```

4. Record a few emissions with different energyUseAmount over a span of dates that do not overlap. For testing, you may use utilityId 11208.

5. (Optional) Verify that that your emissions can be successfully retrieved using the api/v1/utilityemissionchannel/emissionscontract/getAllEmissionsDataByDateRange endpoint.

6. Issue a token to the chosen wallet via the api/v1/utilityemissionchannel/emissionscontract/recordAuditedEmissionsToken endpoint.

## Troubleshooting

If any error in `Get the blockchain network up and running` please run the commands of `Stop the blockchain network and remove container` and retry starting the network. If you still run into errors open an issue with the error logs, please.
