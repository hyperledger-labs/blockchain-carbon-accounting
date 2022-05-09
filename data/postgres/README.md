# Setting Up the PostgreSQL database

Create your database:
```
createdb "blockchain-carbon-accounting"
```

Install the dependencies in the parent folder (`data`):
```
npm install
```

Copy the `.env.SAMPLE` into `.env` if you need any custom DB connection configuration.


## Load Data

### Emissions Factors

Download the emissions factors in flat file for automatic processing format from the [UK Government Greenhouse Gas Reporting: Conversion factors 2021](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021)

Load the data with the `dataLoader` script:
```
npm run dataLoader load_emissions_factors conversion-factors-2021-flat-file-automatic-processing.xls "Factors by Category" -- --format conversion-factors-uk
```

Download the [U.S. Environmental Protection Agency eGRID data](https://www.epa.gov/egrid) and .  Then load them with:
```
npm run dataLoader load_emissions_factors egrid2020_data.xlsx NRL20 -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run dataLoader load_emissions_factors egrid2020_data.xlsx ST20 -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run dataLoader load_emissions_factors egrid2020_data.xlsx US20 -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
```

Source is an optional tag to record where you downloaded the data from.

For 2020 data, you will need the 2020 spreadsheet and change the sheets to `NRL20`, `ST20`, and `US20`.

The [U.S. Energy Information Administration's Utility Identifiers](https://www.eia.gov/electricity/data/eia861) can be downloaded, and then the `Utility_Data` spreadsheet contains the utility identifiers, which can be loaded with
```
npm run dataLoader load_utility_identifiers Utility_Data_2020.xlsx
```

For the European Data download the [CO2 Intensity of Electricity Generation](https://www.eea.europa.eu/data-and-maps/daviz/sds/co2-emission-intensity-from-electricity-generation-5/download.csv) and save it as `co2-emission-intensity-from-electricity-generation-5.csv`.
Then get the [Share of Renewables](https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2016-res_proxies_eea_csv) and extract the `2019-RES_proxies_EEA.csv`.

```
npm run dataLoader load_emissions_factors 2019-RES_proxies_EEA.csv -- --format eea_res_proxies --source https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2016-res_proxies_eea_csv
npm run dataLoader load_emissions_factors co2-emission-intensity-from-electricity-generation-5.csv -- --format eea_intensity --source https://www.eea.europa.eu/data-and-maps/daviz/sds/co2-emission-intensity-from-electricity-generation-5
```

### Other Seed Data

Load the rest of the seed data:
```
psql blockchain-carbon-accounting < seeds/*
```


## Test

Test the results:

The script `getData` can be used to query the database specific rows of the database, like this:
```
npm run getData activity-emissions 'scope 1' 'REFRIGERANT & OTHER' 'KYOTO PROTOCOL - STANDARD' 'PERFLUOROBUTANE (PFC-3-1-10)' '' '' 12 'kg'
....
{ emission: { value: 106320, uom: 'kg' }, year: 2021 }

npm run getData  activity-emissions 'scope 3' 'HOTEL STAY' 'HOTEL STAY' 'ROMANIA' '' '' 4 'Room per night'
....
{ emission: { value: 102, uom: 'kg' }, year: 2021 }

npm run getData  activity-emissions 'scope 3' 'WTT- business travel- air' 'WTT- flights' 'International, to/from non-UK' 'First class' 'With RF' 2500 'passenger.km'
{ emission: { value: 153.975, uom: 'kg' }, year: 2021 }

npm run getData  activity-emissions 'scope 3' 'WTT- business travel- air' 'WTT- flights' 'International, to/from non-UK' 'Premium economy class' 'With RF' 2500 'passenger.km
{ emission: { value: 61.599999999999994, uom: 'kg' }, year: 2021 }
```
