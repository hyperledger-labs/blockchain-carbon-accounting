/**
 * This is to manage the Database and test the method get_co2_emissions from the command line.
 *
 * Start by setting up the AWS credentials
 *  - in ../chaincode/node/lib/aws-config.js for an account that has DynamoDB access.
 *
 * Download the eGRID2 data, for example in a data/ directory
 * - eGRID2018_Data_v2.xlsx
 * - Utility_Data_2019_Data_Early_Release.xlsx
 * 
 * - Run "node index.js initdb" to create the tables
 * - Run "node index.js load_utility_emissions data/eGRID2018_Data_v2.xlsx NRL18" to load the utility emissions data
 * - Run "node index.js load_utility_identifiers data/Utility_Data_2019_Data_Early_Release.xlsx" to load the utility lookup data
 * - Run "node index.js get_co2_emissions 11208 2018-05-21 3000" to test
 */

const XLSX = require('xlsx');
const AWS = require("aws-sdk");
const async = require('async');
const yargs = require('yargs');

const EmissionsCalc = require('../chaincode/node/lib/emissions-calc.js');

yargs
  .command('initdb', 'initialize the Database', (yargs) => {
  }, (argv) => {
    initdb(argv)
  })
  .command('deletedb', 'delete the Database', (yargs) => {
  }, (argv) => {
    deletedb(argv)
  })
  .command('list [table]', 'list the data from the Database', (yargs) => {
    yargs
      .positional('table', {
        describe: 'the DB table to list from',
      })
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
        describe: 'thru date in YYYY-mm-dd, dd-mm-YYYY, YYYY/mm/dd or dd/mm/YYYY',
      })
  }, (argv) => {
    get_emmissions_factor(argv.utility, argv.thru_date, argv)
  })
  .command('get_co2_emissions <utility> <thru_date> <usage> [usage_uom] [emssions_uom]', 'get Utility CO2 Emissions', (yargs) => {
    yargs
      .positional('utility', {
        describe: 'the Utility Number',
      })
      .positional('thru_date', {
        describe: 'thru date in YYYY-mm-dd, dd-mm-YYYY, YYYY/mm/dd or dd/mm/YYYY',
      })
      .positional('usage', {
        describe: 'the Utility usage energy',
      })
      .positional('usage_uom', {
        describe: 'the usage unit of measure',
        default: 'KWH'
      })
      .positional('emssions_uom', {
        describe: 'the emissions unit of measure',
        default: 'tons'
      })
  }, (argv) => {
    get_co2_emissions(argv.utility, argv.thru_date, argv.usage, argv)
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .demandCommand()
  .recommendCommands()
  .showHelpOnFail(true)
  .strict()
  .argv

function _create_db_table(db, opts, params, updateParams) {

    return new Promise(function(resolve, reject) {
        opts.verbose && console.log("-- Creating Table " + params.TableName + " ...");
        db.createTable(params, function(err, data) {
            if (err) {
                if (updateParams && err && err.code === 'ResourceInUseException') {
                    opts.verbose && console.log("-- Table exists, running the update instead...");
                    db.updateTable(updateParams, function(err, data) {
                        if (err) {
                            console.error("Unable to create table " + params.TableName + ". Error:", err);
                            return reject(err);
                        } else {
                            opts.verbose && console.log("-- Updated Table description:", data);
                            return resolve(data);
                        }
                    });
                } else {
                    console.error("Table " + params.TableName + " already exists.");
                    return resolve();
                }
            } else {
                console.log("Created table " + params.TableName + ".");
                opts.verbose && console.log("-- Table description:", data);
                return resolve(data);
            }
        });
    });
}

async function initdb(opts) {
    const db = EmissionsCalc.connectdb(AWS, opts);
    opts.verbose && console.log('Creating DB tables...');

    try {
        await _create_db_table(db, opts, {
            TableName: "UTILITY_EMISSION_FACTORS",
            AttributeDefinitions: [
                { AttributeName: "_id", AttributeType: "S" },
                { AttributeName: "Division_id", AttributeType: "S" },
                { AttributeName: "Division_type", AttributeType: "S" },
            ], 
            KeySchema: [       
                { AttributeName: "_id", KeyType: "HASH"}
            ],
            BillingMode: 'PAY_PER_REQUEST',
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'DIVISON_LOOKUP',
                    KeySchema: [
                      { AttributeName: 'Division_id', KeyType: 'HASH' },
                      { AttributeName: 'Division_type', KeyType: 'RANGE' }
                    ],
                    Projection: { ProjectionType: 'ALL' }
                }
            ]
        }, {
            TableName: "UTILITY_EMISSION_FACTORS",
            AttributeDefinitions: [
                { AttributeName: "_id", AttributeType: "S" },
                { AttributeName: "Division_id", AttributeType: "S" },
                { AttributeName: "Division_type", AttributeType: "S" },
            ], 
            BillingMode: 'PAY_PER_REQUEST',
            GlobalSecondaryIndexUpdates: [
                {
                  Create:
                    {
                        IndexName: 'DIVISON_LOOKUP',
                        KeySchema: [
                          { AttributeName: 'Division_id', KeyType: 'HASH' },
                          { AttributeName: 'Division_type', KeyType: 'RANGE' }
                        ],
                        Projection: { ProjectionType: 'ALL' }
                    }
                }
            ]
        });
    } catch (err) {

    }

    try {
        await _create_db_table(db, opts, {
            TableName: "UTILITY_LOOKUP",
            AttributeDefinitions: [
                { AttributeName: "_id", AttributeType: "S" }
            ], 
            KeySchema: [       
                { AttributeName: "_id", KeyType: "HASH"}
            ],
            BillingMode: 'PAY_PER_REQUEST'
        }, {
            TableName: "UTILITY_LOOKUP",
            AttributeDefinitions: [
                { AttributeName: "_id", AttributeType: "S" }
            ], 
            BillingMode: 'PAY_PER_REQUEST'
        });
    } catch (err) {
        
    }
}

function deletedb(opts) {
    const db = EmissionsCalc.connectdb(AWS, opts);
    opts.verbose && console.log('Deleting DB...');
    db.deleteTable({TableName : "UTILITY_EMISSION_FACTORS"}, function(err, data) {
        if (err) {
            console.error("Unable to delete table UTILITY_EMISSION_FACTORS. Error:", err);
        } else {
            console.log("Deleted table UTILITY_EMISSION_FACTORS.");
            opts.verbose && console.log("-- Table description:", data);
        }
    });
    db.deleteTable({TableName : "UTILITY_LOOKUP"}, function(err, data) {
        if (err) {
            console.error("Unable to delete table UTILITY_LOOKUP. Error:", err);
        } else {
            console.log("Deleted table UTILITY_LOOKUP.");
            opts.verbose && console.log("-- Table description:", data);
        }
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
    const db = EmissionsCalc.connectdb(AWS, opts);
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

            // generate a unique for the row
            var document_id = 'USA_' + row['Data Year'] + '_NERC_REGION_' + row['NERC region acronym'];
            var d = {
                '_id': { S : document_id },
                'Year': { N : '' + row['Data Year'] },
                'Country': { S : 'USA' },
                'Division_type': { S : 'NERC_REGION' },
                'Division_id': { S : row['NERC region acronym'] },
                'Division_name': { S : row['NERC region name '] || '' },
                'Net_Generation': { N : '' + row['NERC region annual net generation (MWh)'] },
                'Net_Generation_UOM': { S : 'MWH' },
                'CO2_Equivalent_Emissions': { N : '' + row['NERC region annual CO2 equivalent emissions (tons)'] },
                'CO2_Equivalent_Emissions_UOM': { S : 'tons' },
                'Source': { S : 'https://www.epa.gov/sites/production/files/2020-01/egrid2018_all_files.zip' },
                'Non_Renewables': { N: row['NERC region annual total nonrenewables net generation (MWh)'].toString()},
                'Renewables': { N: row['NERC region annual total renewables net generation (MWh)'].toString()},
            };

            db_insert(db, opts, {TableName: 'UTILITY_EMISSION_FACTORS', Item: d}, callback);
        });

    });
}

function import_utility_identifiers(file_name, opts) {
    const db = EmissionsCalc.connectdb(AWS, opts);
    opts.skip_rows = 1
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
            var d = {
                '_id' : { S : '' + row['Utility Number'] },
                'Year': { N : '' + row['Data Year'] },
                'Utility_Number' : { N : '' + row['Utility Number'] },
                'Utility_Name' : { S : row['Utility Name'] },
                'Country' : { S : 'USA' },
                'State_Province' : { S : row['State'] },
                'Divisions' : { M : {
                    'Division_type': { S : 'NERC_REGION' },
                    'Division_id': { S : row['NERC Region'] }
                } }
            }

            db_insert(db, opts, {TableName: 'UTILITY_LOOKUP', Item: d}, callback);

        });

    });
}

function get_co2_emissions(utility, thru_date, usage, opts) {
    const db = EmissionsCalc.connectdb(AWS, opts);
    EmissionsCalc.get_co2_emissions(db, utility, thru_date, usage, opts).then(res => {
        console.log('Got Utility CO2 Emissions for ' + usage + ' ' + opts.usage_uom + ' for utility [' + utility + '] and date ' + thru_date + ': ', res);
    }).catch(err => console.error(err));
}

function get_emmissions_factor(utility, thru_date, opts) {
    const db = EmissionsCalc.connectdb(AWS, opts);
    EmissionsCalc.get_emmissions_factor(db, utility, thru_date, opts).then(res => {
        if (res) {
            console.log('Got Utility Emissions Factors for utility [' + utility + '] and date ' + thru_date + ': ', res);
        } else {
            console.log('No Utility Emissions Factors for utility [' + utility + '] and date ' + thru_date + ' found');
        }
    }).catch(err => console.error(err));
}


function list_data(opts) {
    const db = EmissionsCalc.connectdb(AWS, opts);
    if (opts.table) {
        opts.verbose && console.log('Listing data tables ...');
        console.log('UTILITY_EMISSION_FACTORS');
        console.log('UTILITY_LOOKUP');
    } else {
        opts.verbose && console.log('Listing data from [' + opts.table + '] ...');        
    }
    if (opts.table) {
        db.scan({TableName: opts.table}, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data.Items);           // successful response
        });

    } else {
        db.listTables({}, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });
    }
}

function _db_insert(db, opts, d, callback) {
    opts.verbose && console.log('-- TRY INSERT ', d);
    db.putItem(d, function(err, data) {
         if (err) {
             console.error("Unable to insert", d.Item._id.S, ". Error:", err);
         } else {
             console.log("Imported document [", d.Item._id.S + ']');
         }
         return callback();
    });
}

function db_insert(db, opts, d, callback) {
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
    }, cb => { _db_insert(db, opts,d, cb) }, err => {
        if (err) console.error('ERROR Inserting Document [' + d['_id']  + ']', err);
        return callback(err);
    });
}