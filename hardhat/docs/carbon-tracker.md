# CarbonTracker token and Contract:

## Deploying the emission certificate contract and interface

Here we summarize the deployment process deploying the CarbonTracker contract and DAPP interface. This covers installation and configuration of software in different subdirectoreis of blockchain-carbon-accouting repository. You'll need to make sure you are running version of node >= 16.x.x

First run `npm install` of dependency libraries in the following subdirectories
- [data](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/data). This is where the postgres server and tables are configured for convenient storage for on and off-chain data. Follow the [readme](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/data/README.md) for instructions on setting up and seeding the postgres database.
- [fabric/typescript_app](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/fabric/typescript_app).
- [hardhat](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat). Follow the [using-the-contracts readme](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat/docs/using-the-contracts.md).
- [app/frontend](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/app/frontend).
- [app/api-server](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/app/api-server)
- [supply-chain](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat/supply-chain)
 
- Next run the hardhat node in hardhat subdirectory where the contracts (NET/CarbonTracker) are deployed locally
```
npx hardhat node
```
[using-the-react-applicaiton readme](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat/docs/using-the-contracts.md) provides instructions on seeding the network, e.g.:
```npx hardhat setTestAccountRoles --network localhost --contract <NetEmissionsTokeNetwork address>``` 
to assign roles to network addresses.
```npx hardhat issueOilAndGasTrackers --network localhost --contract <NetEmissionsTokeNetwork address>``` 
to issue example tracker tokens for oil and gas producers.

- Run the api-server for synchronizing postgres database with contract state in app/api-server
```npm run dev``` 
[README](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/app/api-server/README.md) provides instructions on seeding the postgres database with user and other data.

- Run the node.js react UI
```
cd app/frontend/react-app
npm run build
```




## ERC721 contract for carbon tracker NFTs

The Carbon Tracker Contract is used to issue non fungible tokenz (NFT) as emission certificates of a facility that produces industrial commodities or a commerical service such as international travel and transportation of goods.

The contract is implemented as ERC1155Holder of the [NET contract](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat/contracts/NetEmissionsTokenNetwork.sol). Each Carbon Tracker NFT describes the unique emission profile of a product/facility using different NET types as inputs/outputs:
    
- audited emission tokens (tokenTypeId = 4 as transferable emission tokens) 
- offset credits (retired or transferable)
- Renewable energy certificates

Each NFT is assigned product tokens used for tracking emissions in trade of goods or services. Multiple product tokens are issued to a certicate to describe the ditribution across a facility with multiple product types (e.g. a refinery that produces gasoline and deisel).

Product tokens also enable the tracking of emission certificates across the trade of goods, by seeding a new certificate. See the [CarbonTracker NFT example](#carbon-tracker-nft-example).


### Attribute description  

Each NFT is defined by a unique trackerId with the following attribtues:
- `_trackerData` details about the certificate
- `_trackerMappings` listing all the emission and products tokens issued to the certificate

`_trackerMappings` can also list  products tracked from other trackers as a way to bootstrap the emission certificate of derived products.

## Carbon tracker NFT applications

This service target industries, and their supply chain counterparts, with commercial advantage (and/or policy mandate) to provide embedded emission transparency. 

For example, the [Carbon Border Adjustement Mechanism drafted by the European Commission](https://ec.europa.eu/info/sites/default/files/carbon_border_adjustment_mechanism_0.pdf). It requires importers of targeted energy intensive commodities (e.g., steel, cement, alumininum, fertilizers) to disclose simple and complex (embedded) emissions. These will be subject to carbon import tariffs equivalent to the price of GHG allowances purchased under the European Unions Emission Trading System (EU ETS).  

Another application is the creation of emission performance certificates issued to fuel and other commodity producers. For exmaple, to certify that a producer has low gas flaring and methane leakage on its production. [Flare Intel](https://flareintel.com/) provoides a service that could be used to verify flaring from facilities on a global scale. The World Bank has also set up an [Imported Flared Gas (IFG) index](https://www.ggfrdata.org/#imported-flare-gas-index) as a measure of the embedded flared emission in international oil trade. The Carbon Tracker NFTs could be issued in conjunction with such an index to prove an importer has committed to lowering its IFG index.


