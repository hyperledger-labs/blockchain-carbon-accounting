/**
 * This is a sample of how to use this as a AWS Lambda function.
 * Copy this file in the lambda index.js and copy the emissions-calc.js into a file of the same name in the lambda.
 * Using a Lambda allows to connect it to an AWS API Gateway nad make the functionalities available as a REST api (hence the operation argument here)
 */

const AWS = require("aws-sdk");

const EmissionsCalc = require('./emissions-calc.js');

const opts = {};

async function list_data(db, table) {
    return db.scan({TableName: table}).promise();
}

exports.handler = async (event) => {

    const db = EmissionsCalc.connectdb(opts);
    var operation = event.operation;
    var resCode = 200;
    var res = 'Unknown error';

    switch (operation) {
        case 'list_utility':
            res = await list_data(db, 'UTILITY_EMISSION_FACTORS');
            break;
        case 'get_emmissions_factor':
            if (!event.utility || !event.thru_date) {
                resCode = 400;
                res = {
                    error: 'utility and thru_date are required',
                    usage: {
                        method: 'get_emmissions_factor: get Utility CO2 Emissions',
                        params: {
                            utility: {description: 'the Utility Number', required: true},
                            thru_date: {description: 'thru date in YYYY-mm-dd, dd-mm-YYYY, YYYY/mm/dd or dd/mm/YYYY', required: true}
                        }
                    }
                };
            } else {
                 res = await EmissionsCalc.get_emmissions_factor(db, event.utility, event.thru_date, opts);
            }
            break;
        case 'get_co2_emissions':
            if (!event.utility || !event.thru_date || !event.usage) {
                resCode = 400;
                res = {
                    error: 'utility, thru_date and usage are required',
                    usage: {
                        method: 'get_co2_emissions: get Utility CO2 Emissions',
                        params: {
                            utility: {description: 'the Utility Number', required: true},
                            thru_date: {description: 'thru date in YYYY-mm-dd, dd-mm-YYYY, YYYY/mm/dd or dd/mm/YYYY', required: true},
                            usage: {description: 'the Utility usage energy', required: true},
                            usage_uom: {description: 'the usage unit of measure', required: false, default: 'KWH'},
                            emssions_uom: {description: 'the emissions unit of measure', required: false, default: 'tons'}
                        }
                    }
                };
            } else {
                opts.usage_uom = event.usage_uom || 'KWH';
                opts.emssions_uom = event.emssions_uom || 'tons';
                res = await EmissionsCalc.get_co2_emissions(db, event.utility, event.thru_date, event.usage, opts);
            }
            break;
        default:
            resCode = 400;
            res = 'Unknown operation: ${operation}';
    }

    return {
        statusCode: resCode,
        body: res,
    };
};
