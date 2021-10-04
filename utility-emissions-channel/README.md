# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) Hyperledger Fabric network in a docker-compose setup and provides a REST API to interact with the blockchain.  To see how it works, check out [this video](https://youtu.be/zIYfjF4U2G8).

## Running the Fabric network and Express API

1. Make sure you have Git, cURL, Docker, and Docker Compose installed, or follow instructions from [Hyperledger Fabric Install Prerequisites](https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)


2. If you want to use AWS S3 service to store documents, then fill in AWS credentials in `typescript_app/.env` for local development and in `docker-compose-setup/docker/application/docker-compose.yaml` for starting API insider a docker container:

```env
   AWS_ACCESS_KEY_ID='your_access_key';
   AWS_SECRET_ACCESS_KEY='your_secret_key';
   S3_LOCAL=false;
   BUCKET_NAME="local-bucket";
```

Otherwise leave it unchanged, and you will be able to store your documents locally with serverless.


3. Fill in Ethereum configuration settings in `typescript_app/.env` for local development and in `docker-compose-setup/docker/application/docker-compose.yaml` for starting API insider a docker container:

```env
   LEDGER_ETH_JSON_RPC_URL=<json-rpc-url-of-ethereum-node>
   LEDGER_ETH_NETWORK={ropsten|goerli}
   LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS=<ethereum-contract-address-of-emissions-token-contract>
   LEDGER_EMISSION_TOKEN_PUBLIC_KEY = "public_key_of_ethereum_dealer_wallet";
   LEDGER_EMISSION_TOKEN_PRIVATE_KEY = "private_key_of_ethereum_dealer_wallet";
```

For the above you may need to start a new [Infura](https://infura.io/) project and use the credentials there for the project id and secret. 
Regarding the Ethereum dealer wallet you will need for the private key, one option is [MetaMask](https://metamask.io/) which offers a handy Chrome extension.
Moreover, you may also need to create a Goerli TestNet wallet. Detailed instructions regarding how to set this up can be found for example at [the Mudit blog](https://mudit.blog/getting-started-goerli-testnet/).
We already have smart contracts under [net-emissions-token](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/4a8c8c916127bdabed7734074fb9ae78e44e27cc/net-emissions-token-network/README.md) network.
The Express API that connects to ethereum will call that to create emissions tokens. Please check the instructions for the `net-emissions-token-network` [here](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/4a8c8c916127bdabed7734074fb9ae78e44e27cc/net-emissions-token-network/docs/using-the-react-application.md).
Note for the `CONTRACT_ADDRESS` you can use the address of Ethereum contract required to connect to on the Goerli testnet, this can be found in the Settings section of your Infura project. 
In particular, checkout the section "With Goerli testnet" below after following the instructions for installing the React application above therein. 

4.  Install the right binaries.  You will need the linux binaries to run inside of docker, as well as the binaries for your operating system.

```bash
$ cd docker-compose-setup
```

Install binaries for linux distribution.
```bash
$ ./bootstrap.sh  2.2.1 1.4.9 -d -s
```

If you are using a Mac, you will also need to get the Mac binaries.  In a separate directory, follow the steps from [Hyperledger Fabric Install Samples and Binaries](https://hyperledger-fabric.readthedocs.io/en/release-2.2/install.html) to install `fabric-samples` with a `bin/` directory.  Then move that `bin/` directory over to a `bin_mac/` directory inside  `docker-compose-setup`.  For example, I had installed `fabric-samples` in a `hyperledger` directory, so:

```bash
$ mv ~/hyperledger/fabric-samples/bin/ ./bin_mac/
```

Then modify the file `utility-emissions-channel/docker-compose-setup/scripts/invokeChaincode.sh` and change `./bin/peer` to `./bin_mac/peer`

5.  Install the dependencies for the 
server.  This is a temporary fix as reported in [issue #71](https://github.com/hyperledger-labs/blockchain-carbon-accounting/issues/71)


6.  From `utilities-emissions-channel/docker-compose-setup`, run the start script (includes the reset script which resets the Fabric state):

### Start network, create channel, and deployCC

If you are doing it for the first time, run:
```bash
sh start.sh {local|docker}
- local : will start API server without docker container, it will read  envs from `typescript_app/.env`
- docker : will start API server within a docker container , compose file at `docker/application/docker-compose.yaml`
```

In order to run API in local mode, Paste following inside ``/etc/hosts`` file

```text
127.0.0.1       auditor1.carbonAccounting.com
127.0.0.1       auditor2.carbonAccounting.com
127.0.0.1       peer1.auditor1.carbonAccounting.com
127.0.0.1       peer1.auditor2.carbonAccounting.com
127.0.0.1       peer1.auditor1.carbonAccounting.com
```

Otherwise, run:
```bash
sh ./scripts/fabricNetwork.sh && sh start.sh
```

7. Follow the instructions under **Steps to seed the Fabric database** to initialize the Fabric network with emissions data to pull from when recording emissions.

## Seeding the Fabric database

To calculate emissions, we need data on the emissions from electricity usage.  We're currently using the [U.S. Environmental Protection Agency eGRID data](https://www.epa.gov/egrid), [U.S. Energy Information Administration's Utility Identifiers](https://www.eia.gov/electricity/data/eia861), and European Environment Agency's [Renewable Energy Share](https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-3) and [CO2 Emissions Intensity](https://www.eea.europa.eu/data-and-maps/daviz/co2-emission-intensity-6).  The Node.js script `egrid-data-loader.js` in `utility-emissions-channel/docker-compose-setup/` imports this data into the Fabric network.

From `utility-emissions-channel/docker-compose-setup/`, 

1. Install the dependencies:

```bash
$ npm install
```

2. Download and extract the EPA data:

```bash
$ wget https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip
$ unzip egrid2018_all_files.zip
```

```bash
$ wget https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
```

3. Download the utility identifiers from [Form EIA-861](https://www.eia.gov/electricity/data/eia861/) and extract:

```bash
$ wget https://www.eia.gov/electricity/data/eia861/zip/f8612019.zip
$ unzip f8612019.zip
```

4. Download the data from the [European Environment Agency](https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-3/eea-2017-res-share-proxies/2016-res_proxies_eea_csv) and extract the zip file.

5. Load utility emissions and identifiers data from the files.  NOTE: There is a [known issue](https://github.com/hyperledger-labs/blockchain-carbon-accounting/issues/76) with loading the European `co2-emissions-intensity` file on Mac OS X, so if you are looking to use this for European data, it will only work on Ubuntu:

```bash
$ node egrid-data-loader.js load_utility_emissions eGRID2018_Data_v2.xlsx NRL18
$ node egrid-data-loader.js load_utility_emissions eGRID2018_Data_v2.xlsx ST18
$ node egrid-data-loader.js load_utility_emissions egrid2019_data.xlsx NRL19
$ node egrid-data-loader.js load_utility_emissions egrid2019_data.xlsx ST19
$ node egrid-data-loader.js load_utility_identifiers Utility_Data_2019.xlsx
```

```bash
$ node egrid-data-loader.js load_utility_emissions 2019-RES_proxies_EEA.csv Sheet1
$ node egrid-data-loader.js load_utility_emissions co2-emission-intensity-6.csv Sheet1
```

### Viewing the seed data

Check the CouchDB interface at [`http://localhost:5984/_utils/`](http://localhost:5984/_utils/) and look in the `utilityemissionchannel__utilityemissions` for the data stored in your ledger. The default CouchDB username and password are `admin` and `adminpw`.

More complex queries can be run with Mango at [`http://localhost:5984/_utils/#database/utilityemissionchannel_emissionscontract/_find`](http://localhost:5984/_utils/#database/utilityemissionchannel_emissionscontract/_find).  See [tutorial on running Mango queries](https://docs.couchdb.org/en/stable/intro/tour.html?highlight=gte#running-a-mango-query).

For example, to search for utility emissions factors, run the Mango query:

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

## Recording emissions with chain code

From the `utility-emissions-channel/docker-compose-setup` directory, you can run a script to record and get the emissions:

```shell
# Record emission to utilityemissionchannel
$ sudo bash ./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["USA_EIA_11208","MyCompany","2018-06-01T10:10:09Z","2018-06-30T10:10:09Z","150","KWH","url","md5"]}' 1 2
```

You will get a result that looks like this:

```shell
2021-06-16 09:09:25.305 PDT [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200 payload:"{\"uuid\":\"7fe9ccb94fb1b0ee302b471cdfafbd4c\",\"utilityId\":\"USA_EIA_11208\",\"partyId\":\"5568748226281c705e79f668100c0c4ec6c727b7c1b91314e0530a841d11c569\",\"fromDate\":\"2018-06-01T10:10:09Z\",\"thruDate\":\"2018-06-30T10:10:09Z\",\"emissionsAmount\":0.0316521654748084,\"renewableEnergyUseAmount\":65.26895319095316,\"nonrenewableEnergyUseAmount\":84.73104680904684,\"energyUseUom\":\"KWH\",\"factorSource\":\"eGrid 2018 STATE CA\",\"url\":\"url\",\"md5\":\"md5\",\"tokenId\":null,\"class\":\"org.hyperledger.blockchain-carbon-accounting.emissionsrecord\",\"key\":\"\\\"USA_EIA_11208\\\":\\\"5568748226281c705e79f668100c0c4ec6c727b7c1b91314e0530a841d11c569\\\":\\\"2018-06-01T10:10:09Z\\\":\\\"2018-06-30T10:10:09Z\\\"\"}" 
===================== Invoke transaction successful on peer1.auditor1 peer1.auditor2 on channel 'utilityemissionchannel' ===================== 
```

Take the `uuid` of the result, which in this case is `7fe9ccb94fb1b0ee302b471cdfafbd4c` to get the emissions record data:

```shell
# Query emission data
$ sudo bash ./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["7fe9ccb94fb1b0ee302b471cdfafbd4c"]}' 1   // use your uuid!
```

You should also be able to see your emissions records in Couchdb with a Mango query:

```json
{
   "selector": {
      "class": {
         "$eq": "org.hyperledger.blockchain-carbon-accounting.emissionsrecord"
      }
   }
}
```

## Starting the Express server (REST API)

This is normally done for you in the `start.sh` script, but you can also start it manually.  From the `utility-emissions-channel/` directory:

```bash
$ cd typescript_app
$ npm i
$ cd ..
$ cd docker-compose-setup
$ ./scripts/startApi.sh
```

To run the API server outside of docker container:

```bash
$ cd typescript_app
$ npm i
$ sh ./runManual.sh
```

4. Go to `http://localhost:9000/api-docs/` to use the API.  

## Working with the Express Server API

First register an organization using `/registerEnroll/admin`:

```bash
{
  "orgName": "auditor1"
}
```

Next register a user under this organization with `/registerEnroll/user`:

```bash
{
  "userId": "testuser1",
  "orgName": "auditor1",
  "affiliation": "auditor1.department1"
}
```

Now you can record emissions with different energyUseAmount over different dates with `/emissionscontract/recordEmissions`.  Be sure that your dates do not overlap. For testing, you may use utilityId 11208 for [Los Angeles Department of Water and Power](https://ladwp.com).

You can verify that that your emissions can be successfully retrieved using `/emissionscontract/getAllEmissionsDataByDateRange`.

## Shutting Down

From the `docker-compose-setup/` directory:

```bash
$ ./network.sh down
```

To shut down and then reset everything:

```bash
$ sh ./scripts/fabricNetwork.sh
```

## Integrating with the Net Emissions Token Network integration 

Through an endpoint in the REST API, you can retrieve a series of emissions records by date range and issue an Audited Emissions Token based on this data.  This currently works with public Ethereum networks, such as the [Goerli testnet](https://goerli.net/). 

To set it up, Edit `typescript_app/src/config/networkConfig.ts`:
* Set `IS_GOERLI` to `true`. 
* Set the contract address on Goerli, your Infura keys, and the private key of your audited emissions dealer wallet.

Reset and restart the API if it is running.

After some emissions are recorded via calls to `recordEmissions`, call `recordAuditedEmissionsToken` to issue audited tokens to the contract on Goerli.

Then you can see them on [goerli.etherscan.io](https://goerli.etherscan.io/) by searching for the contract address, or on [emissionstokens.opentaps.org/](https://emissionstokens.opentaps.org/) by logging in with your Goerli wallet.

## Other Useful Things

### Updating the Chaincode

From the `docker-compose-setup/` directory:

2. Update Chaincode:
   Run `./network.sh deployCC -ccv 'VERSION' -ccs 'SEQUENCE'`
   e.g. update chaincode `emissionscontract` to version 2: `./network.sh deployCC -ccv 2.0 -ccs 2`
3. Check help, if further infomation is needed. Run: `./network.sh -h`

### Hyperledger explorer

You can start Hyperledger Explorer by running this from `docker-compose-setup/` 
```bash
$ ./network.sh startBlockchainExplorer
```

You can access it at http://localhost:8080 with username `exploreradmin` and password `exploreradminpw` 

To stop it:

```bash
$ ./network.sh stopBlockchainExplorer
```

### Automated Tests

In order to run the automated tests, the local Hardhat network needs to be started as:
```bash
$ cd ../net-emissions-token-network/
$ npm install
$ npx hardhat node --show-accounts
```

If you are running the tests for the first time, run the test setup script after navigating to the `typescript_app` directory. This inserts mock data and configures the Vault server for testing.
```bash
$ npm run test:setup
```

When the network/API and the local Hardhat network have fully started, you can run the automated tests by navigating to the `typescript_app` directory and running the tests as:


```bash
$ npm run test
```