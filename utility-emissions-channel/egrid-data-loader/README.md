# egrid-data-loader

This project imports the Data from https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip into the Fabric network. Install the dependencies with `npm`:

    $ npm install

# Steps to seed the Fabric database

1. Download and extract the data:

    $ wget https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip
    $ unzip egrid2018_all_files.zip

2. Download the utility identifiers from [Form EIA-861](https://www.eia.gov/electricity/data/eia861/) and unzip:

    $ wget https://www.eia.gov/electricity/data/eia861/zip/f8612019.zip
    $ unzip f8612019.zip

3. Load utility emissions data from the XLSX files (for now two different sheets are supported):

    $ node index.js load_utility_emissions eGRID2018_Data_v2.xlsx NRL18
    $ node index.js load_utility_emissions eGRID2018_Data_v2.xlsx ST18

4. Unzip and load utility lookup data from the XLSX file Utility_Data_2019.xlsx:

    $ node index.js load_utility_identifiers Utility_Data_2019.xlsx

## Viewing the data

Check the CouchDB interface at `http://localhost:5984/_utils/` to see new records added under the database utilityemissionchannel_emissionscontract.

## Testing get_emissions_factor and get_co2_emissions

Query the chaincode for an emissions factor for a given utility from its utility number and year to test if imports were successful, for example:

    $ node index.js get_emissions_factor 34 2018

    $ node index.js get_emissions_factor 11208 2018

Query for CO2 emssions factor for a given utility given the usage, for example::

    $ node index.js get_co2_emissions 34 2018 1500

    $ node index.js get_co2_emissions 11208 2018 3000 MWh KG
