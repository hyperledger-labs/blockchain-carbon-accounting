import upsAPI from 'ups-nodejs-sdk';
import {Client, UnitSystem} from "@googlemaps/google-maps-services-js";
import * as dotenv from 'dotenv';
dotenv.config();

const args = process.argv.slice(2);
if (args.length < 1) {
  throw new Error('At least one tracking number argument is required!');
}
const trackingNumbers = args;
// check there are no duplicates
if (new Set(trackingNumbers).size !== trackingNumbers.length) {
  throw new Error('Cannot pass duplicate trackingNumbers!');
}

const conf = {
  environment: process.env.UPS_ENV,
  username: process.env.UPS_USER,
  password: process.env.UPS_PASSWORD,
  access_key: process.env.UPS_KEY,
}

const ups = new upsAPI(conf);

function get_addresses(res: any) {
  const shipment = res['Shipment'];
  if (shipment && shipment.ShipTo && shipment.ShipTo.Address) {
    const pack = shipment.Package;
    if (pack && pack.Activity) {
      const a = pack.Activity.find((a: any)=>a.Status&&a.Status.StatusCode&&a.Status.StatusCode.Code==='OR');
      const b = pack.Activity.find((a: any)=>a.Status&&a.Status.StatusType&&a.Status.StatusType.Code==='D');
      const origin = [];
      const dest = [];
      if (a && a.ActivityLocation && a.ActivityLocation.Address && b && b.ActivityLocation && b.ActivityLocation.Address) {
        const o = a.ActivityLocation.Address;
        const d = b.ActivityLocation.Address;
        for (const p in o) {
          origin.push(o[p]);
        }
        for (const p in d) {
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

function is_ground(res: any) {
  const shipment = res['Shipment'];
  if (shipment && shipment.Service && shipment.Service.Code) {
    return shipment.Service.Code.toLowerCase().indexOf('03') > -1;
  } else {
    return true;
  }
}

function calc_distance(o: any, d: any) {
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
  return 6371.0 * c;
}

// wrap UPS api call into a promise
const ups_track = (trackingNumber: string) => new Promise((resolve, reject) => ups.track(trackingNumber, {latest: false}, (err: any, res: any) => {
  if (err) reject(err);
  else resolve(res);
}));

type Output = {
  ups?: any | undefined,
  weight?: any | undefined,
  distance?: any | undefined,
  emissions?: any | undefined,
  geocode?: any | undefined,
}

// return a promise with the output object for a shipment
function get_shipment(trackingNumber: string) {
  return new Promise((resolve, reject) => {
  ups_track(trackingNumber)
    .then((res: any) => {
      const isGround = is_ground(res);
      const output: Output = { ups: res };
      const result = { trackingNumber, output };
      let weight = 0.0;
      if (res.Shipment && res.Shipment.ShipmentWeight) {
        const w = res.Shipment.ShipmentWeight;
        weight = w.Weight;
        if (w.UnitOfMeasurement.Code === 'LBS') {
          weight *= 0.453592;
        }
        output.weight = {
          value: weight,
          unit: 'kg'
        }
        const emissions = weight * 0.001 * (isGround ? 0.52218 : 2.37968);
        output.emissions = { value: emissions, unit: 'kgCO2e' }
      }
      const addresses = get_addresses(res);
      if (addresses) {
        const client = new Client({});
        const address_o = addresses.origin.join(' ');
        const address_d = addresses.dest.join(' ');
        if (isGround) {
          client.distancematrix({
            params: {
              origins: [address_o],
              destinations: [address_d],
              units: UnitSystem.metric,
              key: process.env.GOOGLE_KEY || ''
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
                value: dist_m,
                unit: 'km'
              };
              resolve(result);
          }).catch((err)=>{
              output.distance = {error: err.response.data};
              resolve(result);
          });
        } else {
          client.geocode({
            params: {
              address: address_o,
              key: process.env.GOOGLE_KEY || ''
            }
          }).then((results)=>{
              const origin_r = results.data.results[0].geometry.location;
              client.geocode({
                params: {
                  address: address_d,
                  key: process.env.GOOGLE_KEY || ''
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
                    unit: 'km'
                  };
                  resolve(result);
              }).catch((err)=>{
                  output.distance = {error: err.response.data};
                  resolve(result);
              });
          }).catch((err)=>{
              output.geocode = {error: err.response.data};
              resolve(result);
          });
        }
      } else {
        resolve(result);
      }
    })
    .catch(error => {
      reject({trackingNumber, error});
    })
  });
}



// allow multiple tracking numbers to be used
// so we return an object with "shipments": as an array of objects, each like { "trackingNumber": "xxxxxx", "output" | "error" : {} }
// and "emissons": { sum of emissions }
Promise.allSettled(trackingNumbers.map(get_shipment))
  .then(promises => {
    const shipments = promises.map(p=>(p.status === 'fulfilled')?p.value:p.reason);
    const total_emissions = shipments.reduce((prev, current) => {
      if (!current.output || !current.output.emissions) return prev;
      return prev + current.output.emissions.value;
    }, 0);
    console.log(JSON.stringify({ shipments, emissions: { value: total_emissions, unit: 'kgCO2e'}}, null, 4));
  });
