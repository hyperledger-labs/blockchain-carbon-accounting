const UOM_FACTORS = {
  wh: 1.0,
  kwh: 1000.0,
  mwh: 1000000.0,
  gwh: 1000000000.0,
  twh: 1000000000000.0,
  kg: 1.0,
  t: 1000.0,
  ton: 1000.0,
  tons: 1000.0,
  mtco2e: 1000.0,
  g: 0.001,
  kt: 1000000.0,
  mt: 1000000000.0,
  pg: 1000000000.0,
  gt: 1000000000000.0,
};

const AWS_CONFIG = require("./aws-config");

const AWS_REGION = AWS_CONFIG.AWS_REGION || "us-east-1";
const AWS_ENDPOINT = AWS_CONFIG.AWS_ENDPOINT || "http://localdynamodb:8000";
// const AWS_ENDPOINT ='https://dynamodb.' + AWS_REGION + '.amazonaws.com'
exports.connectdb = function(AWS, opts) {
  opts && opts.verbose && console.log("Connecting to AWS DynamoDB ...");
  var conf = {
    region: AWS_REGION,
    endpoint: AWS_ENDPOINT,
  };
  opts && opts.verbose && console.log("Connecting to AWS DynamoDB config ", conf);
  if (AWS_CONFIG.AWS_ACCESS_KEY_ID) conf.accessKeyId = AWS_CONFIG.AWS_ACCESS_KEY_ID;
  if (AWS_CONFIG.AWS_SECRET_ACCESS_KEY) conf.secretAccessKey = AWS_CONFIG.AWS_SECRET_ACCESS_KEY;
  AWS.config.update(conf);
  var db = new AWS.DynamoDB();
  opts && opts.verbose && console.log("Connected to DynamoDB.");
  return db;
};

exports.get_uom_factor = function(uom) {
  if (uom) {
    let uoml = uom.toLowerCase();
    let f = UOM_FACTORS[uoml];
    if (f) return f;
  }
  throw new Error("Unknown UOM [" + uom + "]");
};

exports.get_year_from_date = function(date) {
  var year = null;
  if (typeof date === "number") {
    year = date;
  } else if (date.length) {
    // for YYYY-mm-dd or YYYY-dd-mm or YYYY/mm/dd ...
    var r = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;
    // for reverse: mm-dd-YYYY
    var r2 = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
    if (r.test(date)) {
      year = date.substring(0, 4);
    } else if (r2.test(date)) {
      year = date.substring(date.length - 4);
    } else {
      year = Number(date);
    }
  }
  return year;
};

exports.get_emmissions_factor = function(db, utility, thru_date, opts) {
  // Find Utility using #3
  opts && opts.verbose && console.log("Get Utility " + utility + " ...");
  return new Promise(function(resolve, reject) {
    db.getItem({ TableName: "UTILITY_LOOKUP", Key: { _id: { S: "" + utility } } }, function(err, data) {
      if (err) {
        console.error(err);
        return reject("Error Getting Utility [" + utility + "] " + err);
      }
      opts && opts.verbose && console.log("Found Utility ", data);
      var division = null;
      if (!data.Item || !data.Item.Divisions) {
        return reject("Utility [" + utility + "] does not have a Division Type");
      }
      opts && opts.verbose && console.log("-- found Utility Divisions = ", data.Item.Divisions);

      division = data.Item.Divisions.M;
      opts && opts.verbose && console.log("-- found Utility Division = ", division);

      if (!division.Division_id) {
        return reject("Utility [" + utility + "] does not have a Division ID");
      }
      // extract the year from thru_date ..
      var year = exports.get_year_from_date(thru_date);
      // Get Utility Emissions Factors from #2 with Division_type and Year of Thru_date
      var params = {
        TableName: "UTILITY_EMISSION_FACTORS",
        IndexName: "DIVISON_LOOKUP",
        KeyConditionExpression: "Division_id = :divId and Division_type = :divType",
        ExpressionAttributeValues: {
          ":divId": division.Division_id,
          ":divType": division.Division_type,
        },
      };
      if (year) {
        params.FilterExpression = "#y = :year";
        params.ExpressionAttributeNames = { "#y": "Year" };
        params.ExpressionAttributeValues[":year"] = { N: "" + year };
      }
      opts && opts.verbose && console.log("** Query Utility Emissions Factors", params);
      db.query(params, function(err, data) {
        if (err) {
          console.error(err);
          return reject("Error Getting Utility [" + utility + "] " + err);
        }
        opts && opts.verbose && console.log("** Got Utility Emissions Factors for utility [" + utility + "]", data);
        if (data.Items && data.Items.length) {
          // convert odd DynamoDB format to a "normal" JS object
          let res = data.Items[0];
          var r = {};
          for (var f in res) {
            r[f] = res[f].S || (res[f].N ? Number(res[f].N) : "");
          }
          return resolve(r);
        } else {
          opts && opts.verbose && console.log("** No Utility Emissions Factors for utility [" + utility + "] found");
          return resolve();
        }
      });
    });
  });
};

exports.get_co2_emissions = function(db, utility, thru_date, usage, opts) {
  // Calculate Emissions = Utility Emissions Factors.CO2_Equivalent_Emissions / Net_Generation * Usage * (Usage_UOM/Net_Generation_UOM) * (CO2_Equivalent_Emissions_UOM / Emissions_UOM)
  // Return Emissions, Division_type
  return new Promise(function(resolve, reject) {
    exports
      .get_emmissions_factor(db, utility, thru_date, opts)
      .then((res) => {
        if (res) {
          let usage_uom = "KWH";
          if (opts && opts.usage_uom) usage_uom = opts.usage_uom;
          let emssions_uom = "MtCO2e";
          if (opts && opts.emssions_uom) emssions_uom = opts.emssions_uom;
          let Division_type = res.Division_type;
          let division_id = res.Division_id;
          let usage_uom_conversion = exports.get_uom_factor(usage_uom) / exports.get_uom_factor(res.Net_Generation_UOM);
          let emissions_uom_conversion =
            exports.get_uom_factor(res.CO2_Equivalent_Emissions_UOM) / exports.get_uom_factor(emssions_uom);
          let Emissions =
            (Number(res.CO2_Equivalent_Emissions) / Number(res.Net_Generation)) *
            usage *
            usage_uom_conversion *
            emissions_uom_conversion;
          let total_generation = res.Non_Renewables + res.Renewables;
          let renewable_energy_use_amount = usage * (res.Renewables / total_generation);
          let nonrenewable_energy_use_amount = usage * (res.Non_Renewables / total_generation);
          let year = res.Year;
          return resolve({
            Emissions: {
              value: Emissions,
              uom: emssions_uom,
            },
            Division_type: Division_type,
            divisionId: division_id,
            renewableEnergyUseAmount: renewable_energy_use_amount,
            nonRenewableEnergyUseAmount: nonrenewable_energy_use_amount,
            year: year,
          });
        } else {
          return reject("No Utility Emissions Factors for utility [" + utility + "] and date " + thru_date + " found");
        }
      })
      .catch((err) => {
        console.error(err);
        return reject("Error Getting Utility Emissions Factor for [" + utility + "] " + err);
      });
  });
};
