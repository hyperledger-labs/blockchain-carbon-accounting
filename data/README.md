# PostgreSQL database component

## Query the database

Those commands should be run in the repository root directory.

The script `getData` can be used to query the database specific rows of the database, like this:
```
npm run pg:getData activity-emissions 'scope 1' 'REFRIGERANT & OTHER' 'KYOTO PROTOCOL - STANDARD' 'PERFLUOROBUTANE (PFC-3-1-10)' '' '' 12 'kg'
....
{ emission: { value: 106320, uom: 'kg' }, year: 2021 }

npm run pg:getData  activity-emissions 'scope 3' 'HOTEL STAY' 'HOTEL STAY' 'ROMANIA' '' '' 4 'Room per night'
....
{ emission: { value: 102, uom: 'kg' }, year: 2021 }

npm run pg:getData  activity-emissions 'scope 3' 'WTT- business travel- air' 'WTT- flights' 'International, to/from non-UK' 'First class' 'With RF' 2500 'passenger.km'
{ emission: { value: 153.975, uom: 'kg' }, year: 2021 }

npm run pg:getData  activity-emissions 'scope 3' 'WTT- business travel- air' 'WTT- flights' 'International, to/from non-UK' 'Premium economy class' 'With RF' 2500 'passenger.km
{ emission: { value: 61.599999999999994, uom: 'kg' }, year: 2021 }
```

## Reference

### Emissions Factors

#### Sources

All needed factors are in this directory, for other versions of those files the sources are:

* [UK Government Greenhouse Gas Reporting: Conversion factors 2021](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021)
  * `conversion-factors-2021-flat-file-automatic-processing.xls`
* [U.S. Environmental Protection Agency eGRID data](https://www.epa.gov/egrid)
  * `egrid2019_data.xlsx`
  * `egrid2020_data.xlsx`
* [U.S. Energy Information Administration's Utility Identifiers](https://www.eia.gov/electricity/data/eia861)
  * `Utility_Data_2019.xlsx`
  * `Utility_Data_2020.xlsx`
* [Share of Renewables](https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2016-res_proxies_eea_csv)
  * `2016-RES_proxies_EEA.csv`
  * `2017-RES_proxies_EEA.csv`
  * `2018-RES_proxies_EEA.csv`
  * `2019-RES_proxies_EEA.csv`
* [CO2 Intensity of Electricity Generation](https://www.eea.europa.eu/data-and-maps/daviz/sds/co2-emission-intensity-from-electricity-generation-5/download.csv)
  * `co2-emission-intensity-from-electricity-generation-5.csv`
  * `co2-emission-intensity-6.csv`

#### Load scripts

The data is loaded with `pg:dataLoader` command from repository root directory:

* Year is required parameter for UK conversion-factors format and it is ignored in other formats.
* Source is an optional tag to record where you downloaded the data from.
* EEA proxies must be loaded before the intensity factors.

```
npm run pg:dataLoader load_emissions_factors Conversion_Factors_2020_-_Flat_file__for_automatic_processing_only_.xlsx "Factors by Category" -- -- --format conversion-factors-uk --year 2020 --source conversion-factors-uk-2020
npm run pg:dataLoader load_emissions_factors conversion-factors-2021-flat-file-automatic-processing.xls "Factors by Category" -- -- --format conversion-factors-uk --year 2021 --source conversion-factors-uk-2021

npm run pg:dataLoader load_emissions_factors egrid2019_data.xlsx NRL19 -- -- --format egrid_data --source egrid2019_data.xlsx
npm run pg:dataLoader load_emissions_factors egrid2019_data.xlsx ST19 -- -- --format egrid_data --source egrid2019_data.xlsx
npm run pg:dataLoader load_emissions_factors egrid2019_data.xlsx US19 -- -- --format egrid_data --source egrid2019_data.xlsx

npm run pg:dataLoader load_emissions_factors egrid2020_data.xlsx NRL20 -- -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run pg:dataLoader load_emissions_factors egrid2020_data.xlsx ST20 -- -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx
npm run pg:dataLoader load_emissions_factors egrid2020_data.xlsx US20 -- -- --format egrid_data --source https://www.epa.gov/system/files/documents/2022-01/egrid2020_data.xlsx

npm run pg:dataLoader load_utility_identifiers Utility_Data_2019.xlsx
npm run pg:dataLoader load_utility_identifiers Utility_Data_2020.xlsx

npm run dataLoader load_emissions_factors 2016-RES_proxies_EEA.csv -- -- --format eea_res_proxies --source https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2016-res_proxies_eea_csv
npm run dataLoader load_emissions_factors 2017-RES_proxies_EEA.csv -- -- --format eea_res_proxies --source https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2017-res_proxies_eea_csv
npm run dataLoader load_emissions_factors 2018-RES_proxies_EEA.csv -- -- --format eea_res_proxies --source https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2018-res_proxies_eea_csv
npm run dataLoader load_emissions_factors 2019-RES_proxies_EEA.csv -- -- --format eea_res_proxies --source https://www.eea.europa.eu/data-and-maps/data/approximated-estimates-for-the-share-4/eea-2017-res-share-proxies/2019-res_proxies_eea_csv

npm run dataLoader load_emissions_factors co2-emission-intensity-from-electricity-generation-5.csv -- -- --format eea_intensity --source https://www.eea.europa.eu/data-and-maps/daviz/sds/co2-emission-intensity-from-electricity-generation-5
npm run dataLoader load_emissions_factors co2-emission-intensity-6.csv -- -- --format eea_intensity --source https://www.eea.europa.eu/data-and-maps/daviz/sds/co2-emission-intensity-6
```

### Other Seed Data

The seed data is in the `seeds/` directory and could also be loaded like this:
```
psql blockchain-carbon-accounting < seeds/*
```