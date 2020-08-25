# utility-emissions-channel

This project implements the [Utility Emissions Channel](https://wiki.hyperledger.org/display/CASIG/Utility+Emissions+Channel) use case in a docker-compose setup.

Running the Code
================

## Get the blockchain network up and running
1. Install Prerequisites (https://hyperledger-fabric.readthedocs.io/en/release-2.2/prereqs.html)
2. Cd to `docker-compose-setup``
3. Start network: Run `./network.sh up createChannel`
4. Deploy and invoke `emissionscontract` chaincode (JS): Run `./network.sh deployCC`
5. Start Hyperledger Explorer (http://localhost:8080/, username: exploreradmin, pw: exploreradminpw): Run `./network.sh startBlockchainExplorer`

##### Play with the chaincode and have a look at the blockchain-explorer. 
```shell
# Record emission to utilityemissionchannel
./scripts/invokeChaincode.sh '{"function":"'recordEmissions'","Args":["SmallUtility","MyCompany","2020-06-01","2020-06-30","150","KWH"]}' 1 2 3

# Query emission data 
./scripts/invokeChaincode.sh '{"function":"'getEmissionsData'","Args":["SmallUtility","MyCompany","2020-06-01","2020-06-30"]}' 1
```

## Use node.js to interact with blockchain
1. cd to application
2. Install npm packages: Run `npm i`
3. Create wallet for User1 of org auditor 1: Run `node createWallet.js`
4. Invoke chaincode (at the moment static function): 
```shell
# Invoke chaincode 
node invoke.js`

# Should print similar output
Wallet path: /Users/robinklemens/Documents/GitHub/blockchain-carbon-accounting/utility-emissions-channel/docker-compose-setup/application/wallet
{"class":"org.hyperledger.blockchain-carbon-accounting.emissionsrecord","key":"\"MediumUtility\":\"MyCompany\":\"2020-06-01\":\"2020-06-30\"","currentState":null,"emissionsAmount":150,"emissionsUom":"TONS","fromDate":"2020-06-01","partyId":"MyCompany","thruDate":"2020-06-30","utilityId":"MediumUtility"}```
    