const XLSX = require('xlsx');
const NodeCouchDb = require('node-couchdb');
const async = require('async');

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
  .command('load_utility_emissions <file> <sheet>', 'load data from XLSX file', (yargs) => {
    yargs
      .positional('file', {
        describe: 'XLSX file to load from',
      })
      .positional('sheet', {
        describe: 'name of the worksheet to load from',
      })
  }, (argv) => {
    import_utility_emissions(argv.file, argv)
  })
  .command('load_utility_identifiers <file> [sheet]', 'load data from XLSX file', (yargs) => {
    yargs
      .positional('file', {
        describe: 'XLSX file to load from',
      })
      .positional('sheet', {
        describe: 'name of the worksheet to load from',
      })
  }, (argv) => {
    import_utility_identifiers(argv.file, argv)
  })
  .command('get_emmissions_factor <utility> <thru_date>', 'get Utility Emissions Factors', (yargs) => {
    yargs
      .positional('utility', {
        describe: 'the Utility Number',
      })
      .positional('thru_date', {
        describe: 'name of the worksheet to load from',
      })
  }, (argv) => {
    get_emmissions_factor(argv.utility, argv.thru_date, argv)
  })
  .option('database', {
    alias: 'd',
    default: DB_NAME,
    description: 'CouchDB Database name'
  })
  .option('username', {
    alias: 'u',
    default: 'admin',
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
    db.createDatabase(opts.database).then(() => {
        console.log('Created CouchDB Database: ' + opts.database);
        return;
    }, err => {
        console.error(err);
    });
}

function deletedb(opts) {
    const db = connectdb(opts);
    opts.verbose && console.log('Deleting DB...');
    db.dropDatabase(opts.database).then(() => {
        console.log('Deleted CouchDB Database: ' + opts.database);
        return;
    }, err => {
        console.error(err);
    });
}


function parse_worksheet(file_name, opts, cb) {
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
        var header_row = 1;
        if (opts.skip_rows && opts.skip_rows >= header_row) {
            header_row = opts.skip_rows + 1;
        }
        opts.verbose && console.log('-- opts.skip_rows = ', opts.skip_rows, ' header_row = ', header_row);

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
            if (opts.skip_rows && opts.skip_rows >= row) continue;
            //opts.verbose && console.log('--> ', row, col, value);

            //store header names
            if(row == header_row && value) {
                headers[col] = value;
                continue;
            }

            if(!data[row]) data[row]={};
            data[row][headers[col]] = value;
        }
        return cb(data);
    });
}

function import_utility_emissions(file_name, opts) {
    const db = connectdb(opts);
    var data = parse_worksheet(file_name, opts, function(data) {
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
        async.eachSeries(data, function iterator(row, callback) {
            // skip empty rows
            if (!row || !row['Data Year']) return callback();
            // skip header rows
            if (row['Data Year'] == 'YEAR') return callback();
            //opts.verbose && console.log('-- Prepare to insert from ', row);

            var d = {};
            d['DocType'] = 'UTILITY_EMISSION_FACTORS';
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
            var document_id = d['DocType'] + '_' + d['Country'] + '_' + d['Year'] + '_' + d['Division_type'] + '_' + d['Division_id'];
            d['_id'] = document_id;

            couchdb_insert(db, opts, d, callback);
        });

    });
}

function import_utility_identifiers(file_name, opts) {
    const db = connectdb(opts);
    opts.skip_rows = 2
    var data = parse_worksheet(file_name, opts, function(data) {
        // import data for each valid row, eg:
            // Utility_Number = value from 'Utility Number'
            // Utility_Name = value from 'Utility Name'
            // State_Province = value from 'State'
            // Country = USA
            // Divisions = an array of ojects
            // -- Division_type = NERC_REGION
            // -- Division_id = value from 'NERC Region'
        async.eachSeries(data, function iterator(row, callback) {
            if (!row || !row['Data Year']) return callback();
            //opts.verbose && console.log('-- Prepare to insert from ', row);

            var d = {};
            d['DocType'] = 'UTILITY_LOOKUP';
            d['Utility_Number'] = row['Utility Number'];
            d['Utility_Name'] = row['Utility Name'];
            d['Country'] = 'USA';
            d['State_Province'] = row['State'];
            d['Divisions'] = [{
                'Division_type': 'NERC_REGION',
                'Division_id': row['NERC Region']
            }];
            // generate a unique for the row
            d['_id'] = d['DocType'] + '_' + d['Utility_Number'];

            couchdb_insert(db, opts, d, callback);

        });

    });
}

function _get_emmissions_factor(utility, thru_date, opts, cb) {
    const db = connectdb(opts);
    // Find Utility using #3
    opts.verbose && console.log('Get Utility ' + utility + ' ...');
    var utility_id = 'UTILITY_LOOKUP_' + utility;
    db.get(opts.database, utility_id).then(({data, headers, status}) => {
        opts.verbose && console.log('Found Utility ', data);
        var division = null;
        // if Division_type=BALANCING_AUTHORITY is available
        // then Division_type = BALANCING_AUTHORITY
        // else if Division_type=NERC_REGION is available
        // then Division_type = NERC_REGION
        // could have others here like COUNTRY, STATE_PROVINCE, etc.
        if (data.Divisions && data.Divisions.length) {

            division = (x => {
                var d = x.find(e => e.Division_type == 'BALANCING_AUTHORITY');
                if (d) return d;
                d = x.find(e => e.Division_type == 'NERC_REGION');
                if (d) return d;
                return x.find(e => e.Division_type);
            })(data.Divisions);
            opts.verbose && console.log('-- found Utility Division = ', division);

            if (division.Division_id) {
                // extract the year from thru_date ..
                var year = null;
                if (typeof thru_date === 'number') {
                    year = thru_date;
                } else if (thru_date.length) {
                    // for YYYY-mm-dd or YYYY-dd-mm or YYYY/mm/dd ...
                    var r = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;
                    // for reverse: mm-dd-YYYY
                    var r2 = /^\d{1,2}[\/\-]\d{1,2}[\/\-\d{4}]$/;
                    if (r.test(thru_date)) {
                        year = thru_date.substring(thru_date.length-4);
                    }
                }
                // Get Utility Emissions Factors from #2 with Division_type and Year of Thru_date
                const sel = {  DocType: 'UTILITY_EMISSION_FACTORS', Division_type: division.Division_type, Division_id: division.Division_id  };
                if (year) {
                    sel.Year = year;
                }
                opts.verbose && console.log('** Query Utility Emissions Factors', sel);
                db.mango(opts.database, {selector: sel}, {}).then(({data, headers, status}) => {
                    opts.verbose && console.log('** Got Utility Emissions Factors for utility [' + utility + ']', status, data);
                    if (data.docs && data.docs.length) {
                        return cb(null, data.docs[0]);
                    } else {
                        opts.verbose && console.log('** No Utility Emissions Factors for utility [' + utility + '] found');
                        return cb();
                    }
                }, err => {
                    console.error('Cannot get Utility Emissions Factors for utility [' + utility + ']', err);
                    return cb(err);
                });
                
            } else {
                return cb('Utility [' + utility + '] does not have a Division ID');
            }

        } else {
            return cb('Utility [' + utility + '] does not have a Division Type');
        }
    }, err => {
        // either request error occured
        // ...or err.code=EDOCMISSING if document is missing
        // ...or err.code=EUNKNOWN if statusCode is unexpected
        console.error(err);
        return cb('Error Getting Utility [' + utility + ']');
    });
}

function get_emmissions_factor(utility, thru_date, opts) {
    _get_emmissions_factor(utility, thru_date, opts, (res, err) => {
        if (err) {
            console.error(err);
        } else if (res) {
            console.log('Got Utility Emissions Factors for utility [' + utility + '] : ', res);
        } else {
            console.log('No Utility Emissions Factors for utility [' + utility + '] found');
        }
    });
}


function list_data(opts) {
    const db = connectdb(opts);
    opts.verbose && console.log('Listing data ...  ');
    db.mango(opts.database, {selector: {}}, {}).then(({data, headers, status}) => {
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

function _couchdb_insert(db, opts, d, callback) {
    opts.verbose && console.log('-- TRY INSERT ', d);
    db.insert(DB_NAME, d).then(({data, headers, status}) => {
        // data is json response
        // headers is an object with all response headers
        // status is statusCode number
        opts.verbose && console.log('** INSERT: ', status, data, headers);
        console.log('Imported document [' + d['_id']  + ']')
        return callback();
    }, err => {
        // either request error occured
        // ...or err.code=EDOCCONFLICT if document with the same id already exists
        if (err.code == 'EDOCCONFLICT') {
            console.error('Document [' + d['_id']  + '] already exists');
        } else {
            console.error('ERROR Inserting Document [' + d['_id']  + '] -- Retrying');
            return callback(err);
        }
        return callback();
    });
}

function couchdb_insert(db, opts, d, callback) {
    // Note: on large imports this can overload the DB with opened file as
    // the data is written to disk, to workaround that wrap the insert into 
    // a retry loop
    // try calling apiMethod 10 times with exponential backoff
    // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
    async.retry({
      times: 5,
      interval: function(retryCount) {
        return 50 * Math.pow(2, retryCount);
      }
    }, cb => { _couchdb_insert(db, opts,d, cb) }, err => {
        if (err) console.error('ERROR Inserting Document [' + d['_id']  + ']', err);
        return callback(err);
    });
}