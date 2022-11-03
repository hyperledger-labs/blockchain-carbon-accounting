# Methane Emissions Reduction App

This application connects an extensive set of oil and gas industry data to the Net Emission Token Network and Carbon Tracker contracts. The latter is used to issue emission performance certificates for oil & gas producers, by tokenizing  emission and production data.

The app includes a list of U.S. and Canadian oil & gas assets linked to registered operators, as well as public data on oil and natural gas production and associated emissions. 

## Run the application

```npm run server```
*Backend to handle requests from the oil & gas database tables (`Operator`, `OilAndGasAsset`, `Product`)*


```npm run client```
Front end to interact with oil 7 gas data and issue perfomance certifcates described below.

Using the application requres seeding the postgres database [described below](oil-and-gas-data)

## Auditing of operator product data

### Single product audit request for emission certificates 

Use `createEmissionsRequest` of the /app/frontend/react-app/src/api-service to request NET audits for oil & gas operator products, as described in [../frontend/README.md](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/app/README.md)

Called from the methane client frontend `RequestProductAudit` component. Sets up a new form submission for the industry `activity_type`. Triggers the api-server to call the supply-chain-lib `process_industry`. Requests can specific:
    GHG type: CO2, CH4, N2O
    GWP: global warming potential of the gas
    Source: methane flaring, venting, leakage. 

`process-industry` can also be used by an auditor to calculate emissions from oil-and-gas data points for flaring, venting, or leakage. Rather than submitting a request, the auditor receives corresponding emission attributes ( kgCOe, scope, manifest, etc ...) used to seed IssueForm and ad NET tokens to an emission performance certificates (carbon tracker token). 

The form is seeded by setting `localStorage` items.

### Multi-product audit 

Request the audit of an oil & gas operators emissions using a combination of data points. E.g., upper bounds on satellite emission measurements from individual assets belonging to the operator.

Multiple data points are submitted to an audit request using the `other` `activity_type` of `RequestAudit` component form of the react-app. 

In this case the complete attributes of the selected product data points are compiled into a single file submitted to a request. The Auditor is then tasked to review the file stored encrypted within IPFS and assess the correct amount of emission tokens to issue.

### Oil & gas production data

Single and multi-product audit requests described above apply to data points of the emissions `ProductType`. There is no audit request functionality for oil and gas production `ProductType` data points stored in the oil & gas [`Product` model](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/data/src/models/product.ts). Production can only be directly converted to product-tokens issued to perfromance certificates by auditors. 

Is done using the `ProductForm` component and calling the `productUpdate` contract-function provided by the react-app. The final step in issuing a perfromance certificate is calling the `verifyTracker` contract-function.

## Transfer of emission certificates to investor/lender account

Once emission perfromance certificates are issued, they can be transferred to to investors and or lenders of the oil & gas operators. These certificates are exchanged to reflect compliance with sustainability criteria linked to the financing of oil & gas operators, such as Sustaainability Linked Loand or Bonds. 

Investor/lender accounts can participate in these networks to receive tokens by aquiring their own wallet address:
1. using their own wallet connected to NET/Carbon Tracker networks
2. by registering a consumer wallet through the `SignUp` form of the react-app.

### Tracking of embodied emissions

*FUTURE DEVELOPMENT*

Tracking of embodied emissions linked to  audited production quantities.

Product tokens can be transfered as inputs to new perfromance certificates representing the convesion of oil & gas products into intermediate and end consumer products like refined fuels and petrochemicals.


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

**Relations**
 - products: [Product](#product) schema below. Generally used for aggregate product quantities assigned to operator, and NOT products associated to specific assets of the operator
 - asset_operators: [AssetOperator](#asset-operator) schema below

The primary sources of the data are 

[CATF U.S. benchmarking report](https://www.sustainability.com/globalassets/sustainability.com/thinking/pdfs/2022/2022-og-benchmarking-report-data.xlsx)

[Flare Monitor Detailed](https://raw.githubusercontent.com/flaringmonitor/viirs-flare-data/main/processed/flaring_monitor_detailed_observations.csv)

### Product: *./product.ts*

*This schema is different from ProductToken*

Holds raw data, both production and emissions, connected to assets and operators.

The data is audited and used to issue 
 - emission certificates within NET 
 - product tokens within the Carbon Tracker contract 
 *emission and product tokens are combined into emission certificates as desicribed in the [Carbon Tracker contractrac README](https://github.com/hyperledger-labs/blockchain-carbon-accounting/blob/main/hardhat/docs/carbon-tracker.md)* 

**Required attributes**
- type: ProductType (emissions, production quantities, fuel extraction ...)
- name: of the product
- amount:
- unit:

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
This is to express joint operation of the asset measured by the `share` attribute.
The *../assetOperator.repo.ts* `putAssetOperator` method specifies rules for creating this relation.

- Only one operator assigned during an active relation (thur_date == null)
- Total share for single asset in overlapping from/thru periods == 1

An operator can have multiple asset_operator relations to represetn change in ownership structure.

Associations are built when running CATF U.S. benchmarking report or Flare Monitor Detailed files through
```
npm run dataLoader load_product_data ...
```

