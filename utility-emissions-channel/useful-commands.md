# Useful commands for testing

Copy and paste these commands in the directory `utility-emissions-channel/docker-compose-setup/` to test certain functions and tasks of the chaincode, Express API (source code in `./typescript_app/`), and `egrid-data-loader.js` in `./docker-compose-setup/`.

## Resetting, starting, and starting the Express API

```bash
# It's often a good idea to reset everything before starting
sudo sh ./scripts/reset.sh

# Starts all services, including Express API
sudo sh start.sh

# Ctrl+C the terminal where you ran start.sh, and restart the Express API with:
./scripts/startApi.sh
```

## egrid-data-loader.js - Importing seed data

```bash
# import all utility emissions data
node egrid-data-loader.js load_utility_emissions all

# import utility emissions data individually
node egrid-data-loader.js load_utility_emissions eGRID2018_Data_v2.xlsx NRL18
node egrid-data-loader.js load_utility_emissions eGRID2018_Data_v2.xlsx ST18
node egrid-data-loader.js load_utility_emissions 2019-RES_proxies_EEA.csv Sheet1
node egrid-data-loader.js load_utility_emissions co2-emission-intensity-6.csv Sheet1

# import utility identifiers
node egrid-data-loader.js load_utility_identifiers Utility_Data_2019.xlsx
```

## Express API - Registering admin and user, recording US emissions, auditing emissions to ERC1155 token

```bash
curl -X POST "http://localhost:9000/api/v1/utilityemissionchannel/registerEnroll/admin" -H  "accept: */*" -H  "Content-Type: application/json" -d "{\"orgName\":\"auditor1\"}"

curl -X POST "http://localhost:9000/api/v1/utilityemissionchannel/registerEnroll/user" -H  "accept: */*" -H  "Content-Type: application/json" -d "{\"userId\":\"testuser1\",\"orgName\":\"auditor1\",\"affiliation\":\"auditor1.department1\"}"

curl -X POST "http://localhost:9000/api/v1/utilityemissionchannel/emissionscontract/recordEmissions" -H  "accept: */*" -H  "Content-Type: multipart/form-data" -F "userId=testuser1" -F "orgName=auditor1" -F "utilityId=11208" -F "partyId=1234567890" -F "fromDate=2016-04-06T10:10:09Z" -F "thruDate=2017-04-06T10:10:09Z" -F "energyUseAmount=200" -F "energyUseUom="

# Replace {emissionsRecordsToAudit} with returned IDs of emissions record(s) separated by commas
curl -X POST "http://localhost:9000/api/v1/utilityemissionchannel/emissionscontract/recordAuditedEmissionsToken/testuser1/auditor1/0xd32e793008b0fbd13c889e291bc049483da316ba/{emissionsRecordsToAudit}/{automaticRetireDate}" -H  "accept: */*"
```

## Upgrading the chaincode

```bash
# Make sure to increment the '2' for every upgrade
docker exec cli bash -c "./network.sh deployCC -ccv 2.0 -ccs 2"
```

## Import and get sample US utility identifier

```bash
./scripts/invokeChaincode.sh '{"function":"'importUtilityIdentifier'","Args":["15497","2019","15497","Puerto_Rico_Electric_Pwr_Authority","USA","PR","{\"division_type\":\"NERC_REGION\",\"division_id\":\"PR\"}"]}' 1 2

./scripts/invokeChaincode.sh '{"function":"'getUtilityIndentifier'","Args":["15497"]}' 1
```

## Get all utility identifiers

```bash
./scripts/invokeChaincode.sh '{"function":"'getAllUtilityIndentifiers'","Args":[]}' 1
```

## Import dummy German utility identifier and record dummy emissions

```bash
sudo bash ./scripts/invokeChaincode.sh '{"function":"'importUtilityIdentifier'","Args":["999999","2019","999999","Fake_Germany_Power_Company","Germany","","{\"division_type\":\"Country\",\"division_id\":\"Germany\"}"]}' 1 2

sudo bash ./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["999999","Meinklimatgesellschaft","2019-06-01","2019-06-30","150","KWH","url","md5"]}' 1 2
```
