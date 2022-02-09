// npm install ups-nodejs-sdk
var upsAPI = require('ups-nodejs-sdk');
require('dotenv').config();

const args = process.argv.slice(2);
if (args.length != 1) {
  console.error('The tracking number argument is required!');
  return 1;
}
const trackingNumber = args[0];

const conf = {
  environment: process.env.UPS_ENV,
  username: process.env.UPS_USER,
  password: process.env.UPS_PASSWORD,
  access_key: process.env.UPS_KEY,
  imperial: 'true' === process.env.UPS_IMPERIAL
}
console.log(conf);

var ups = new upsAPI(conf);

ups.track(trackingNumber, {latest: false}, (err, res) => {
  if (err) console.error('An error occurred: ', err);
  else console.log(JSON.stringify(res, null, 4));
})
