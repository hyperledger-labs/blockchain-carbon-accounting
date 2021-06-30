# Voluntary Carbon Offsets Directory

This is an initial implementaiton of the [Voluntary Carbon Offsets Directory](https://wiki.hyperledger.org/display/CASIG/Voluntary+Carbon+Offsets+Directory+Research+Project) using a database.  See https://wiki.hyperledger.org/display/CASIG/Voluntary+Carbon+Offsets+Directory+-+Implementation for more details.

## Setup

### Init the Postgresql Database

Create a Postgres database as configured in `node-server/app/config/db.config.js` by default this should be `voluntary-carbon-offsets`

```
createdb voluntary-carbon-offsets
```

Then initialize the schema using `node-server/init-schema.sql`

```
psql voluntary-carbon-offsets < node-server/init-schema.sql
```

Finally import the projects data from the CSV sample file `node-server/projects.csv` (this data is from https://gspp.berkeley.edu/faculty-and-impact/centers/cepp/projects/berkeley-carbon-trading-project/offsets-database)

```
cat node-server/projects.csv | psql voluntary-carbon-offsets -c "$(cat node-server/import-csv.sql)"
```

## Running the App

Install dependencies and start the API server:
```
cd node-server
npm install
npm start
```

Install dependencies and start the React App:
```
cd react
npm install
npm start
```
