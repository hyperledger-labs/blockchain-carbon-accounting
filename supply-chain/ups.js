// npm install ups-nodejs-sdk
var upsAPI = require('ups-nodejs-sdk');

var ups = new upsAPI({
  environment: 'live', // sandbox or live
  username: 'xxxxxxx', 
  password: 'xxxxxxx',
  access_key: 'xxxxxxxxxxxxxxxx', // 
  imperial: true // set to false for metric
});

ups.track('ups-tracking-number', {latest: false}, (err, res) => {
  console.log('err? ', err);
  console.log('res? ', JSON.stringify(res, null, 4));
})
