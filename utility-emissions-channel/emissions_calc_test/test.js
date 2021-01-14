const EmissionsCalc = require("../chaincode/node/lib/emissions-calc.js");
const AWS = require("aws-sdk");

const utilityId = 11208;
const thruDate = "2020-06-01T10:10:09Z";
const energyUseAmount = 100;
const energyUseUom = "MWH";
const emissionsUom = "tc02e";

const db = EmissionsCalc.connectdb(AWS);
let calc = EmissionsCalc.get_co2_emissions(db, utilityId, thruDate, energyUseAmount, {
  usage_uom: energyUseUom,
  emssions_uom: emissionsUom,
}).then((response) => console.log(response));
