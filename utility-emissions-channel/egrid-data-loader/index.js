const XLSX = require('xlsx');
const NodeCouchDb = require('node-couchdb');

const DB_NAME = 'egrid_db';

const yargs = require('yargs');

yargs
  .command('initdb', 'initialize the Database', (yargs) => {
  }, (argv) => {
    initdb(argv)
  })
  .command('deletedb', 'initialize the Database', (yargs) => {
  }, (argv) => {
    deletedb(argv)
  })
  .command('list', 'list the data from the Database', (yargs) => {
  }, (argv) => {
    list_data(argv)
  })
  .command('load <file> <sheet>', 'load data from XLSX file', (yargs) => {
    yargs
      .positional('file', {
        describe: 'XLSX file to load from',
      })
      .positional('sheet', {
        describe: 'name of the worksheet to load from',
      })
  }, (argv) => {
    parse_worksheet(argv.file, argv)
  })
  .option('username', {
    alias: 'u',
    description: 'CouchDB username'
  })
  .option('password', {
    alias: 'p',
    description: 'CouchDB password'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .demandOption(['u','p'])
  .demandCommand()
  .recommendCommands()
  .showHelpOnFail(true)
  .strict()
  .argv


function connectdb(opts) {
    opts.verbose && console.log('Connecting to CouchDB ...');
    const db = new NodeCouchDb({
        auth: {
            user: opts.username,
            pass: opts.password
        }
    });
    opts.verbose && console.log('Connected to CouchDB.');
    return db;
}

function initdb(opts) {
    const db = connectdb(opts);
    opts.verbose && console.log('Creating DB...');
    db.createDatabase(DB_NAME).then(() => {
        console.log('Created CouchDB Database: ' + DB_NAME);
        return;
    }, err => {
        console.error(err);
    });
}

function deletedb(opts) {
    const db = connectdb(opts);
    opts.verbose && console.log('Deleting DB...');
    db.dropDatabase(DB_NAME).then(() => {
        console.log('Deleted CouchDB Database: ' + DB_NAME);
        return;
    }, err => {
        console.error(err);
    });
}


function parse_worksheet(file_name, opts) {
    const db = connectdb(opts);
    opts.verbose && console.log('Reading file ...  ', file_name);
    var workbook = XLSX.readFile(file_name);

    var sheet_name_list = workbook.SheetNames;
    sheet_name_list.forEach(function(y) {
        opts.verbose && console.log('Worksheet: ', y);
        if (opts.sheet && y != opts.sheet) {
            opts.verbose && console.log('-- not a match');
            return;
        }

        var worksheet = workbook.Sheets[y];
        var headers = {};
        var data = [];
        for(z in worksheet) {
            if(z[0] === '!') continue;
            //parse out the column, row, and value
            var tt = 0;
            for (var i = 0; i < z.length; i++) {
                if (!isNaN(z[i])) {
                    tt = i;
                    break;
                }
            };
            var col = z.substring(0,tt).trim();
            var row = parseInt(z.substring(tt));
            var value = worksheet[z].v;

            //store header names
            if(row == 1 && value) {
                headers[col] = value;
                continue;
            }

            if(!data[row]) data[row]={};
            data[row][headers[col]] = value;
        }
        // import data for each valid row, eg:
            // Year = 2018 from 'Data Year'
            // Country = USA
            // Division_type = NERC_REGION
            // Division_id = value from 'NERC region acronym'
            // Division_name = value from 'NERC region name'
            // Net_Generation = value from 'NERC region annual net generation (MWh)'
            // Net_Generation_UOM = MWH
            // CO2_Equivalent_Emissions = value from 'NERC region annual CO2 equivalent emissions (tons)'
            // CO2_Equivalent_Emissions_UOM = tons
            // Source = https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip
        
        //drop those first two rows which are empty
        // data.shift();
        // data.shift();
        for (var i=0; i < data.length; i++) {
            var row = data[i];
            // skip empty rows
            if (!row || !row['Data Year']) continue;
            // skip header rows
            if (row['Data Year'] == 'YEAR') continue;
            opts.verbose && console.log('-- Prepare to insert from ', row);

            var d = {};
            d['Year'] = row['Data Year'];
            d['Country'] = 'USA';
            d['Division_type'] = 'NERC_REGION';
            d['Division_id'] = row['NERC region acronym'];
            d['Division_name'] = row['NERC region name'];
            d['Net_Generation'] = row['NERC region annual net generation (MWh)'];
            d['Net_Generation_UOM'] = 'MWH';
            d['CO2_Equivalent_Emissions'] = row['NERC region annual CO2 equivalent emissions (tons)'];
            d['CO2_Equivalent_Emissions_UOM'] = 'tons';
            d['Source'] = 'https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip';
            // generate a unique for the row
            var document_id = d['Country'] + '_' + d['Year'] + '_' + d['Division_type'] + '_' + d['Division_id'];
            d['_id'] = document_id;

            db.insert(DB_NAME, d).then(({data, headers, status}) => {
                // data is json response
                // headers is an object with all response headers
                // status is statusCode number
                opts.verbose && console.log('** INSERT: ', status, data, headers);
            }, err => {
                // either request error occured
                // ...or err.code=EDOCCONFLICT if document with the same id already exists
                if (err.code == 'EDOCCONFLICT') {
                    console.error('Row already exists');
                } else {
                    console.error(err);
                }
            });
        }
        //opts.verbose && console.log(data);
    });
}


function list_data(opts) {
    const db = connectdb(opts);
    opts.verbose && console.log('Listing data ...  ');
    db.mango(DB_NAME, {selector: {}}, {}).then(({data, headers, status}) => {
        // data is json response
        // headers is an object with all response headers
        // status is statusCode number
        console.log('** ', status, data, headers);
    }, err => {
        // either request error occured
        // ...or err.code=EDOCMISSING if document is missing
        // ...or err.code=EUNKNOWN if statusCode is unexpected
        console.error(err);
    });
}