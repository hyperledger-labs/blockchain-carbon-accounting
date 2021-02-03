# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) Hyperledger Fabric network in a docker-compose setup and provides a REST API to interact with the blockchain.

# Running the Fabric network and Express API

1. Install Prerequisites (Git, curl, Docker, Docker Compose) (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)
2. From `utility-emissions-channel/`, copy over the Fabric database configuration template file with:

```bash
cp ./chaincode/node/lib/aws-config.js.template ./chaincode/node/lib/aws-config.js 
```

3. Fill in AWS credentials in `chaincode/node/lib/aws-config.js`:

```js
    exports.AWS_ACCESS_KEY_ID = 'your_access_key';
    exports.AWS_SECRET_ACCESS_KEY = 'your_secret_key';
    exports.S3_LOCAL = true;
    exports.BUCKET_NAME = "local-bucket";
```

4. From `utility-emissions-channel/`, copy over the Ethereum network configuration settings template file with:

```bash
cp ./typescript_app/src/blockchain-gateway/networkConfig.ts.example ./typescript_app/src/blockchain-gateway/networkConfig.ts 
```

5. Fill in Ethereum configuration settings in `typescript_app/src/blockchain-gateway/networkConfig.ts`:

```js
    export const PRIVATE_KEY = "private_key_of_ethereum_dealer_wallet";
    export const CONTRACT_ADDRESS = "address_of_ethereum_contract_to_connect_to_on_goerli";
    export const INFURA_PROJECT_ID = "infura_id";
    export const INFURA_PROJECT_SECRET = "infura_secret";
```

6.  Install Prerequisites (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html) but don't install binaries. Follow the step below in order to get the right binaries.

```bash
$ cd docker-compose-setup
```

Install binaries for linux distribution.
```bash
$ ./bootstrap.sh  2.2.1 1.4.9 -d -s
```

7. From `utilities-emissions-channel/docker-compose-setup`, run the start script (includes the reset script which resets the Fabric state):

Start network, create channel, and deployCC:

```bash
sh ./scripts/reset.sh && sh start.sh
```

8. Follow the instructions under **Steps to seed the Fabric database** to initialize the Fabric network with emissions data to pull from when recording emissions.

9. (optional) Start Hyperledger Explorer (http://localhost:8080, username: exploreradmin, pw: exploreradminpw): Run `./network.sh startBlockchainExplorer`
   '{"Args":["invoke","a","b","10"]}'

## Steps to seed the Fabric database

The Node.js script `egrid-data-loader.js` in `utility-emissions-channel/docker-compose-setup/` imports data curated by the U.S. Environmental Protection Agency and U.S. Energy Information Administration into the Fabric network for use of recording emissions data. From `utility-emissions-channel/docker-compose-setup/`, first install the dependencies with `npm`:

    $ npm install

###### 1. Download and extract the EPA data:

    $ wget https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip

    $ unzip egrid2018_all_files.zip

###### 2. Download the utility identifiers from [Form EIA-861](https://www.eia.gov/electricity/data/eia861/) and extract:

    $ wget https://www.eia.gov/electricity/data/eia861/zip/f8612019.zip

    $ unzip f8612019.zip

###### 3. Load utility emissions data from the XLSX files (for now two different sheets are supported):

    $ node egrid-data-loader.js load_utility_emissions eGRID2018_Data_v2.xlsx NRL18

    $ node egrid-data-loader.js load_utility_emissions eGRID2018_Data_v2.xlsx ST18

###### 4. Load utility lookup data from the XLSX file Utility_Data_2019.xlsx:

    $ node egrid-data-loader.js load_utility_identifiers Utility_Data_2019.xlsx

### Viewing the seed data

Check the CouchDB interface at [`http://localhost:5984/_utils/`](http://localhost:5984/_utils/) to see new records added under the database utilityemissionchannel_emissionscontract. More complex queries can be run with Mango at [`http://localhost:5984/_utils/#database/utilityemissionchannel_emissionscontract/_find`](http://localhost:5984/_utils/#database/utilityemissionchannel_emissionscontract/_find) (see [here](https://docs.couchdb.org/en/stable/intro/tour.html?highlight=gte#running-a-mango-query) for more information on running Mango queries).

To search for utility emissions, run the Mango query:

```json
{
   "selector": {
      "class": {
         "$eq": "org.hyperledger.blockchain-carbon-accounting.utilityemissionsfactoritem"
      }
   }
}
```

To search for utility identifiers, run the Mango query:

```json
{
   "selector": {
      "class": {
         "$eq": "org.hyperledger.blockchain-carbon-accounting.utilitylookupitem"
      }
   }
}
```

### Testing get_emissions_factor and get_co2_emissions

`egrid-data-loader.js` also includes two functions for calling these two important hepler functions on the contract. Query the chaincode for an emissions factor for a given utility from its utility number and year to test if imports were successful, for example:

    $ node egrid-data-loader.js get_emissions_factor 34 2018

    $ node egrid-data-loader.js get_emissions_factor 11208 2018

Query for CO2 emssions factor for a given utility given the usage, for example:

    $ node egrid-data-loader.js get_co2_emissions 34 2018 1500 MWh

    $ node egrid-data-loader.js get_co2_emissions 11208 2018 3000 MWh


---

#### Recording emissions by invokeChaincode script

```shell
# Record emission to utilityemissionchannel
sudo bash ./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["1","11208","MyCompany","2018-06-01","2018-06-30","150","KWH","url","md5"]}' 1 2

# Query emission data
sudo bash ./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["1"]}' 1
```

## Start Express server (REST API)

1. cd to `utility-emissions-channel/typescript_app`
2. Install node modules: RUN `npm i`
3. Start express sever: Run `sh start.sh` from `utility-emissions-channel/`
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

## Integrating with the Net Emissions Token Network integration 

Through an endpoint in the REST API, you can retrieve a series of emissions records by date range and issue an Audited Emissions Token based on this data. 

### Setting up an Ethereum network

There are currently two options for starting an Ethereum network to deploy the Net Emissions Token Contract to - the hardhat test network, or Goerli.

Copy and edit the network configuration by navigating to this folder and running:

```
cp ./typescript_app/src/blockchain-gateway/net-emissions-token-network/networkConfig.ts.template ./typescript_app/src/blockchain-gateway/net-emissions-token-network/networkConfig.ts
```

#### Using the Goerli Network

1. Edit `networkConfig.ts` and set `IS_GOERLI` to true. Enter the contract address deployed on Goerli, your Infura keys, and the private key of your dealer/owner wallet.

2. Reset and restart the API if it is running.

3. After some emissions are recorded via calls to `recordEmissions`, call `recordAuditedEmissionsToken` to issue audited tokens to the contract on Goerli.

4. If you want to observe changes to the network, either view the contract's transactions on Etherscan or connect to it via the React interface after ensuring `addresses.js` is set to the correct Goerli contract address. See the README in `net-emissions-token-network` for more information.

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

### Starting the React frontend UI

1. Start the react app based on the documentation in the net-emissions-token-network [here](net-emissions-token-network/README.md).

2. Register a wallet as an Audited Emissions Token Dealer via the UI.

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
