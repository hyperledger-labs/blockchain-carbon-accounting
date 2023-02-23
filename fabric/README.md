# fabric emissions-data channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) Hyperledger Fabric network in a docker-compose setup and provides a REST API to interact with the blockchain. To see how it works, check out [this video](https://youtu.be/zIYfjF4U2G8).

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
We already have smart contracts under [net-emissions-token](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/4a8c8c916127bdabed7734074fb9ae78e44e27cc/hardhat/README.md) network.
The Express API that connects to ethereum will call that to create emissions tokens. Please check the instructions for the `hardhat` [here](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/4a8c8c916127bdabed7734074fb9ae78e44e27cc/hardhat/docs/using-the-react-application.md).
Note for the `CONTRACT_ADDRESS` you can use the address of Ethereum contract required to connect to on the Goerli testnet, this can be found in the Settings section of your Infura project.
In particular, checkout the section "With Goerli testnet" below after following the instructions for installing the React application above therein.

4.  Install the right binaries. You will need the linux binaries to run inside of docker, as well as the binaries for your operating system.

```bash
$ cd docker-compose-setup
```

Install binaries for linux distribution.

```bash
$ ./bootstrap.sh  2.4.2 1.5.2 -d -s
```

If you are using a Mac, you will also need to get the Mac binaries. In a separate directory, follow the steps from [Hyperledger Fabric Install Samples and Binaries](https://hyperledger-fabric.readthedocs.io/en/release-2.2/install.html) to install `fabric-samples` with a `bin/` directory. Then move that `bin/` directory over to a `bin_mac/` directory inside `docker-compose-setup`. For example, I had installed `fabric-samples` in a `hyperledger` directory, so:

```bash
$ mv ~/hyperledger/fabric-samples/bin/ ./bin_mac/
```

Then modify the file `fabric/docker-compose-setup/scripts/invokeChaincode.sh` and change `./bin/peer` to `./bin_mac/peer`

5.  Install the dependencies for the
    server. This is a temporary fix as reported in [issue #71](https://github.com/hyperledger-labs/blockchain-carbon-accounting/issues/71)


6. If you have not already, seed the blockchain-carbon-accounting Postgres databse used to recordEmissions. From root
```
npm run loadSeeds
```

7.  From `utilities-emissions-channel/docker-compose-setup`, run the [`start.sh`](#start.sh) or [`startDev.sh`](#startDev.sh) script to Start network, create channel, and deployCC.

**Warning**: We're currently working on fixing `start.sh`, so use `startDev.sh` for now.

TO-DO: update the chaincode container images to reflect changes to the `fabric/chaincode/emissionscontract` seting up connection to the oracle proxy.

```bash
sh startDev.sh {local|docker} {[<db_host>]}
- local : will start API server without docker container, it will read  envs from `typescript_app/.env`
- docker : will start API server within a docker container , compose file at `docker/application/docker-compose.yaml`
```

Set optional db_host to override the `host.docker.internal` value set in `fabric/docker-compose/.env.api-server`. Set to `postgres` when running tests on github CI to direct the api-server (see below) to postgres container.

In order to run API in local mode, Paste following inside `/etc/hosts` file
```text
127.0.0.1       auditor1.carbonAccounting.com
127.0.0.1       auditor2.carbonAccounting.com
127.0.0.1       peer1.auditor1.carbonAccounting.com
127.0.0.1       peer1.auditor2.carbonAccounting.com
127.0.0.1       peer1.auditor1.carbonAccounting.com
```
These scripts will start all the fabric network services as docker containers configure in `docker-compose-setup/docker/application/docker-compose.yaml` and described [below](#containers)

### startDev.sh: 

Used for Chaincode development

If you would like to install the chaincode on the peers in your local network (ideal for chaincode development where you can test out your chaincode by installing it locally), run the startDev.sh script.

### start.sh:

Used for production deployments.

The start.sh script is designed to run the chaincode as an external service, in case of a production deployment. 

If you are doing it for the first time, run the start.sh either in local or docker mode. Run in local mode if you want to use hardhat ethereum node for testing locally or run in docker mode when you want to use the ethereum network via Infura.

### Restart the network 

Too clean out the fabric docker containers and services if you change the network config and chaincode files
```bash
sh ./scripts/fabricNetwork.sh reset
```


### Containers
- oracle 
implementing the /app/api-orcacle proxy service used to request an emissionsRecord response of type `CO2EmissionFactorInterface` from external postgres db. Calls sent to the fabric emissionsRecordContract chaincode point to one of the oracle enpoint paths. e.g.: `http://oracle:3002/emissionsRecord`

- api-server implmenting /app/api-server service called from the oracle. Connection to the postgres database is configured in `fabric/docker-compose/.env.api-server`

- vault for cloud based key and certificate storage used to interact with fabric and EVM networks

- ws-identify for conecting to client side key storage 

- postgres used for testing purposes.

*Updating the source code of the oracle and api-server will requires rebuidiong the docker images. See the project directories for instructions*


### Viewing the state DB
Check the CouchDB interface at [`http://localhost:5984/_utils/`](http://localhost:5984/_utils/) and look in the `emissions-data__emissions` for the data stored in your ledger. The default CouchDB username and password are `admin` and `adminpw`.

More complex queries can be run with Mango at [`http://localhost:5984/_utils/#database/emissions-data_emissionscontract/_find`](http://localhost:5984/_utils/#database/emissions-data_emissionscontract/_find). See [tutorial on running Mango queries](https://docs.couchdb.org/en/stable/intro/tour.html?highlight=gte#running-a-mango-query).

## Recording emissions with chain code

From the `fabric/docker-compose-setup` directory, you can run a script to record and get the emissions:

```shell
# Record emission to emissions-data
$ sudo bash ./scripts/invokeChaincode.sh '{"function":"recordEmissions","Args":["http://oracle:3002/emissionsRecord",'{"uuid":"0702624c-bfc3-4215-97d7-a6543c4ad218","usage":"100","usageUOM":"kWh","thruDate":"2021-05-07T10:10:09Z"}',"MyCompany","2018-06-01T10:10:09Z","2018-06-30T10:10:09Z","url","md5"]}' 1 2
```

You will get a result that looks like this:

```shell
2021-06-16 09:09:25.305 PDT [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200 payload:"{\"uuid\":\"7fe9ccb94fb1b0ee302b471cdfafbd4c\",\"utilityId\":\"USA_EIA_11208\",\"partyId\":\"5568748226281c705e79f668100c0c4ec6c727b7c1b91314e0530a841d11c569\",\"fromDate\":\"2018-06-01T10:10:09Z\",\"thruDate\":\"2018-06-30T10:10:09Z\",\"emissionsAmount\":0.0316521654748084,\"renewableEnergyUseAmount\":65.26895319095316,\"nonrenewableEnergyUseAmount\":84.73104680904684,\"energyUseUom\":\"KWH\",\"factorSource\":\"eGrid 2018 STATE CA\",\"url\":\"url\",\"md5\":\"md5\",\"tokenId\":null,\"class\":\"org.hyperledger.blockchain-carbon-accounting.emissionsrecord\",\"key\":\"\\\"USA_EIA_11208\\\":\\\"5568748226281c705e79f668100c0c4ec6c727b7c1b91314e0530a841d11c569\\\":\\\"2018-06-01T10:10:09Z\\\":\\\"2018-06-30T10:10:09Z\\\"\"}"
===================== Invoke transaction successful on peer1.auditor1 peer1.auditor2 on channel 'emissions-data' =====================
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

This is normally done for you in the `start.sh` script, but you can also start it manually. From the `fabric/` directory:

```bash
$ cd typescript_app
$ npm i
$ npm run build
$ npm run start
```

Go to `http://localhost:8080/api-docs/` to use the API.

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

Now you can record emissions with different energyUseAmount over different dates with `/emissionscontract/recordEmissions`. Be sure that your dates do not overlap. For testing, you may use utilityId 11208 for [Los Angeles Department of Water and Power](https://ladwp.com).

You can verify that that your emissions can be successfully retrieved using `/emissionscontract/getAllEmissionsDataByDateRange`.

## Shutting Down

From the `docker-compose-setup/` directory:

```bash
$ ./network.sh down
```

To shut down and then reset everything:

```bash
$ sudo sh ./scripts/fabricNetwork.sh reset
```

## Integrating with the Net Emissions Token Network integration

Through an endpoint in the REST API, you can retrieve a series of emissions records by date range and issue an Audited Emissions Token based on this data. This currently works with public Ethereum networks, such as the [Goerli testnet](https://goerli.net/).

To set it up, Edit `typescript_app/src/config/networkConfig.ts`:

-   Set `IS_GOERLI` to `true`.
-   Set the contract address on Goerli, your Infura keys, and the private key of your audited emissions dealer wallet.

Reset and restart the API if it is running.

After some emissions are recorded via calls to `recordEmissions`, call `recordAuditedEmissionsToken` to issue audited tokens to the contract on Goerli.

Then you can see them on [goerli.etherscan.io](https://goerli.etherscan.io/) by searching for the contract address, or on [emissionstokens.opentaps.org/](https://emissionstokens.opentaps.org/) by logging in with your Goerli wallet.

### Using recordAuditedEmissionsToken Endpoint

`recordAuditedEmissionsToken` endpoint require communication with both HL Fabric and Ethereum. For signing the ethereum transaction server has to know the client's address and private kye. There is two way of provide ethereum keys to the server

1. Send address and private key along with the `recordAuditedEmissionsToken` request,

Endpoint : `/api/v1/emissions-data/emissionscontract/recordAuditedEmissionsToken`

Input :

-   header
    -   eth_address : client's ethereum address
    -   eth_private : client's private key

2. Store address and private key inside vault key-value storage, use `vault-identity` server @`../secure-identity/README.md#api-endpoints`

In this scenario client's ethereum key will automatically be fetched from vault server.

## Other Useful Things

### Updating the Chaincode

From the `docker-compose-setup/` directory:

2. Update Chaincode:
   Run `./network.sh deployCC -ccv 'VERSION' -ccs 'SEQUENCE'`
   e.g. update chaincode `emissionscontract` to version 2: `./network.sh deployCC -ccv 2.0 -ccs 2`
3. Check help, if further information is needed. Run: `./network.sh -h`

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
$ cd ../hardhat/
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
$ npm run coverage
```
