# Methane Emissions Reduction App

This application is designed to connect an extensive set of oil and gas industry data to the Net Emission Token Network.

This includes a federal data of U.S. and Canadian oil & gas assets and their operators as well as public data on oil and natural gas production and assocaited emissions. 

## Run the application

```npm run client```
```npm run server```

Seed the postgres databse with data as [described below](oil-and-gas-data)

## Platform Features

 *Work in progress*

### Register Operator

### Register Investor/Lender account

### Request emission  certificates for operator and/or operator assets

Audit of product data by auditors reigstered with the NetEmissionToken (NET)network and CarbonTrack auditors auditors 

For example of certificates issued within NET run the app as described in [../frontend/README.md](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/app/README.md)

### Transfer of emission certificates to investor/lender account

Compliance with sustainable investments instruments
- sustainability linked loans (SLL)
- sustainability linked bonds (SLB)


## Oil and gas data

The data used by the applcation can be downloaded as follows:
``
cd ../data/oil_and_gas
sh download.sh
``

To load the data into postgres (from root):
```
npm run loadSeeds:OG
```
An easier way to seed the database is to download current state of the [postgres database stored here](https://drive.google.com/file/d/1go6zRkMzS4Q7P-DBgkbiXplL4SKaZFe7/view?usp=sharing) and restore the initialized postgres database after running from project root
```
npm run pg:init 
```
*Assuming no changes are made to the ../data/src/dataLoader.ts `load_og_assets` or `load_product_data` scripts*

Data is available both at an aggregate scale for major oil and gas production basins and states, and at the asset or facility level. There are millions of data points ...

The data schemas located in [*data/src/models/*](https://github.com/hyperledger-labs/blockchain-carbon-accounting/tree/main/data/src/models) are as follows

### Oil And Gas Asset: *./oilAndGasAsset.ts*

**Required**
- type: (e.g., oil/gas well)
- lat/long: coordinates (double precision)

**Relations**
 - asset_operators: [AssetOperator](#asset-operator) schema below
 - products: [Product](#product) schema below

A range of optional attributes, including country, name, operator, division, product api, source, validation method

The primary source of this data is [US HIFLD geoplatform](https://hifld-geoplatform.opendata.arcgis.com/datasets/geoplatform::oil-and-natural-gas-wells/explore)

### Operator: *./operator.ts*

**Required**
- wallet: Wallet class used for signing up with the NET platform *./wallet.ts*
- name (unique)
- asset_count: number of assets

**Relations**
 - products: [Product](#product) schema below. Generally used for aggregate product quantities assigned to operator, and NOT products associated to specific assets of the operator
 - asset_operators: [AssetOperator](#asset-operator) schema below

The primary sources of the data are 

[CATF U.S. benchmarking report](https://www.sustainability.com/globalassets/sustainability.com/thinking/pdfs/2022/2022-og-benchmarking-report-data.xlsx)

[Flare Monitor Detailed](https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_detailed_observations.csv)

### Product: *./product.ts*

*This schema is different from ProductToken!*

Holds raw data, both production and emissions, associated to assets and operators.

The data is audited and used to issue 
 - emission certificates within NET 
 - product tokens within the Carbon Tracker contract 
 *emission and product tokens are combined into emission certificates as desicribed in the [Carbon Tracker contractrac README](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat/docs/carbon-tracker.md)* 

**Required attributes**
- type: emissions label, fuel extraction, etc .. 
- name: of the product
- amount
- unit

**Relations**
- assets: for linking product to specific asset 
- operator: for linking aggregate products to operator

Sources: all files listed in /data/oil_and_gas/README.md

### AssetOperator: *./assetOperator.ts*

custom join table linking [Asset](#oil-and-gas-asset) to [Operator](#operator)
- from_date : start date of operation
- thru_date : end date of operation
- share: double precision numebr betweemn 0 and 1

@Unique(['asset', 'operator', 'from_date' ])
@Unique(['asset', 'operator', 'thru_date' ])

The database schema allows more than one operator to be assigned to an asset.
This is to express join operation of the asset quantifed by the share attribute.
The *../assetOperator.repo.ts* `putAssetOperator` method specifies rules for creating this relation. Rules to be implemented

- Only one operator assigned during an active relation (thur_date == null)
- Total share for single asset in overlapping from/thru periods == 1

An operator can have multiple asset_operator relations to represetn change in ownership structure.

Associations are built when running CATF U.S. benchmarking report or Flare Monitor Detailed files through
```
npm run dataLoader load_product_data ...
```

