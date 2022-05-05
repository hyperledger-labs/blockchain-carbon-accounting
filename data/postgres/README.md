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
npm run dataLoader load_emissions_factors egrid2019_data.xlsx NRL19 -- --format egrid_data --source https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
npm run dataLoader load_emissions_factors egrid2019_data.xlsx ST19 -- --format egrid_data --source https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
npm run dataLoader load_emissions_factors egrid2019_data.xlsx US19 -- --format egrid_data --source https://www.epa.gov/sites/production/files/2021-02/egrid2019_data.xlsx
```

Source is an optional tag to record where you downloaded the data from.

For 2020 data, you will need the 2020 spreadsheet and change the sheets to `NRL20`, `ST20`, and `US20`.

The [U.S. Energy Information Administration's Utility Identifiers](https://www.eia.gov/electricity/data/eia861) can be downloaded, and then the Utility_Data spreadsheet contains the utility identifiers, which can be loaded with
```
npm run dataLoader load_utility_identifiers Utility_Data_2020.xlsx
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
