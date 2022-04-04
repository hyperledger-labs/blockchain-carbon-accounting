# Setting Up the PostgreSQL database

Create your database:
```
createdb "blockchain-carbon-accounting"
```

Install the dependencies in the parent folder (`data`):
```
npm install
```

Download the emissions factors in flat file for automatic processing format from the [UK Government Greenhouse Gas Reporting: Conversion factors 2021](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2021)

Load the data with the `dataLoader` script:
```
npm run dataLoader load_emissions_factors conversion-factors-2021-flat-file-automatic-processing.xls
```

Test the results:
```
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
