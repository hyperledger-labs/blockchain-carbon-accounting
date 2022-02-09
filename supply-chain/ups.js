const upsAPI = require('ups-nodejs-sdk');
const {Client} = require("@googlemaps/google-maps-services-js");
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

var ups = new upsAPI(conf);

function get_addresses(res) {
  const shipment = res['Shipment'];
  if (shipment && shipment.ShipTo && shipment.ShipTo.Address) {
    const pack = shipment.Package;
    if (pack && pack.Activity) {
      const a = pack.Activity.find(a=>a.Status&&a.Status.StatusCode&&a.Status.StatusCode.Code==='OR');
      const b = pack.Activity.find(a=>a.Status&&a.Status.StatusType&&a.Status.StatusType.Code==='D');
      const origin = [];
      const dest = [];
      if (a && a.ActivityLocation && a.ActivityLocation.Address && b && b.ActivityLocation && b.ActivityLocation.Address) {
        const o = a.ActivityLocation.Address;
        const d = b.ActivityLocation.Address;
        for (let p in o) {
          origin.push(o[p]);
        }
        for (let p in d) {
          dest.push(d[p]);
        }
        if (dest && origin) {
          return {dest, origin };
        }
      }
    }
  }
  return null;
}

function is_ground(res) {
  const shipment = res['Shipment'];
  if (shipment && shipment.Service && shipment.Service.Description) {
    return shipment.Service.Description.toLowerCase().indexOf('ground') > -1;
  } else {
    return true;
  }
}

function calc_distance(o, d) {

  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  const lon1 = Math.PI / 180 * (o.lng);
  const lon2 = Math.PI / 180 * (d.lng);
  const lat1 = Math.PI / 180 * (o.lat);
  const lat2 = Math.PI / 180 * (d.lat);

  // Haversine formula
  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;
  const a = Math.pow(Math.sin(dlat / 2), 2)
    + Math.cos(lat1) * Math.cos(lat2)
      * Math.pow(Math.sin(dlon / 2),2);

  const c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth
  const use_miles = conf.imperial;
  const r = (use_miles ? 3958.8 : 6371) * c;
  return r;
}

ups.track(trackingNumber, {latest: false}, (err, res) => {
  if (err) console.error('An error occurred: ', err);
  else {
    const output = { ups: res };
    if (res.Shipment && res.Shipment.ShipmentWeight) {
      const w = res.Shipment.ShipmentWeight;
      output.weight = {
        value: w.Weight,
        unit: w.UnitOfMeasurement.Code
      }
    }
    const addresses = get_addresses(res);
    const isGround = is_ground(res);
    if (addresses) {
      console.log('Calculating distances : ', addresses);
      const client = new Client({});
      const address_o = addresses.origin.join(' ');
      const address_d = addresses.dest.join(' ');
      if (isGround) {
        client.distancematrix({
          params: {
            origins: [address_o],
            destinations: [address_d],
            units: conf.imperial ? 'imperial' : 'metric',
            key: process.env.GOOGLE_DISTANCE_KEY
          }
        }).then((results)=>{
            const dist = results.data.rows[0].elements[0].distance;
            // the value is always in meter, need to convert into either km or mi
            const dist_m = dist.value / 1000;

            output.distance = {
              origin: {
                address: address_o,
              },
              destination: {
                address: address_d,
              },
              value: (conf.imperial ? (dist_m * 0.621371) : dist_m),
              unit: (conf.imperial ? 'mi' : 'km')
            };
            console.log(JSON.stringify(output, null, 4));
        }).catch((err)=>{
            output.distance = {error: err.response.data};
            console.log(JSON.stringify(output, null, 4));
        });
      } else {
        client.geocode({
          params: {
            address: address_o,
            key: process.env.GOOGLE_GEOCODE_KEY
          }
        }).then((results)=>{
            const origin_r = results.data.results[0].geometry.location;
            client.geocode({
              params: {
                address: address_d,
                key: process.env.GOOGLE_GEOCODE_KEY
              }
            }).then((results)=>{
                const dest_r = results.data.results[0].geometry.location;
                output.distance = {
                  origin: {
                    address: address_o,
                    coords: origin_r
                  },
                  destination: {
                    address: address_d,
                    coords: dest_r
                  },
                  value: calc_distance(origin_r, dest_r),
                  unit: (conf.imperial ? 'mi' : 'km')
                };
                console.log(JSON.stringify(output, null, 4));
            }).catch((err)=>{
                output.distance = {error: err.response.data};
                console.log(JSON.stringify(output, null, 4));
            });
        }).catch((err)=>{
            output.geocode = {error: err.response.data};
            console.log(JSON.stringify(output, null, 4));
        });
      }
    } else {
      console.log(JSON.stringify(output, null, 4));
    }
  }
})
