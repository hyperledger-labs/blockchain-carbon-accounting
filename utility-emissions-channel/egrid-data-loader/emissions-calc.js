
const UOM_FACTORS = {
    'wh': 1.0,
    'kwh': 1000.0,
    'mwh': 1000000.0,
    'gwh': 1000000000.0,
    'twh': 1000000000000.0,
    'kg': 1.0,
    't': 1000.0,
    'ton': 1000.0,
    'tons': 1000.0,
    'g': 0.001,
    'kt': 1000000.0,
    'mt': 1000000000.0,
    'pg': 1000000000.0,
    'gt': 1000000000000.0,
}

exports.get_uom_factor = function(uom) {
    if (uom) {
        let uoml = uom.toLowerCase();
        let f = UOM_FACTORS[uoml];
        if (f) return f;
    }
    throw new Error('Unknown UOM [' + uom + ']');
}

exports.get_year_from_date = function(date) {
    var year = null;
    if (typeof date === 'number') {
        year = date;
    } else if (date.length) {
        // for YYYY-mm-dd or YYYY-dd-mm or YYYY/mm/dd ...
        var r = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;
        // for reverse: mm-dd-YYYY
        var r2 = /^\d{1,2}[\/\-]\d{1,2}[\/\-\d{4}]$/;
        if (r.test(date)) {
            year = date.substring(date.length-4);
        }
    }
    return year;
}


exports.get_emmissions_factor = function(db, utility, thru_date, opts) {
    // Find Utility using #3
    opts.verbose && console.log('Get Utility ' + utility + ' ...');
    var utility_id = 'UTILITY_LOOKUP_' + utility;
    return new Promise(function(resolve, reject) {
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
                    var year = exports.get_year_from_date(thru_date);
                    // Get Utility Emissions Factors from #2 with Division_type and Year of Thru_date
                    const sel = {  DocType: 'UTILITY_EMISSION_FACTORS', Division_type: division.Division_type, Division_id: division.Division_id  };
                    if (year) {
                        sel.Year = year;
                    }
                    opts.verbose && console.log('** Query Utility Emissions Factors', sel);
                    db.mango(opts.database, {selector: sel}, {}).then(({data, headers, status}) => {
                        opts.verbose && console.log('** Got Utility Emissions Factors for utility [' + utility + ']', status, data);
                        if (data.docs && data.docs.length) {
                            return resolve(data.docs[0]);
                        } else {
                            opts.verbose && console.log('** No Utility Emissions Factors for utility [' + utility + '] found');
                            return resolve();
                        }
                    }, err => {
                        console.error('Cannot get Utility Emissions Factors for utility [' + utility + ']', err);
                        return reject(err);
                    });
                    
                } else {
                    return reject('Utility [' + utility + '] does not have a Division ID');
                }

            } else {
                return reject('Utility [' + utility + '] does not have a Division Type');
            }
        }, err => {
            // either request error occured
            // ...or err.code=EDOCMISSING if document is missing
            // ...or err.code=EUNKNOWN if statusCode is unexpected
            console.error(err);
            return reject('Error Getting Utility [' + utility + ']');
        });
    });
}

exports.get_co2_emissions = function(db, utility, thru_date, usage, opts) {
    // Calculate Emissions = Utility Emissions Factors.CO2_Equivalent_Emissions / Net_Generation * Usage * (Usage_UOM/Net_Generation_UOM) * (CO2_Equivalent_Emissions_UOM / Emissions_UOM)
    // Return Emissions, Division_type
    return new Promise(function(resolve, reject) {
        exports.get_emmissions_factor(db, utility, thru_date, opts).then(res => {
            if (res) {
                let Division_type = res.Division_type;
                let usage_uom_conversion = exports.get_uom_factor(opts.usage_uom) / exports.get_uom_factor(res.Net_Generation_UOM);
                let emissions_uom_conversion = exports.get_uom_factor(res.CO2_Equivalent_Emissions_UOM) / exports.get_uom_factor(opts.emssions_uom);
                let Emissions = res.CO2_Equivalent_Emissions / res.Net_Generation * usage * usage_uom_conversion * emissions_uom_conversion;
                return resolve({
                    Emissions: {
                        value: Emissions,
                        uom: opts.emssions_uom
                    },
                    Division_type: Division_type
                });
            } else {
                return reject('No Utility Emissions Factors for utility [' + utility + '] and date ' + thru_date + ' found');
            }
        }).catch(err => {
            console.error(err)
            return reject('Error Getting Utility Emissions Factor for [' + utility + ']');
        });
    });
}