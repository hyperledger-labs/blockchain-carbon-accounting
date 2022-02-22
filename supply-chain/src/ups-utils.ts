import upsAPI from 'ups-nodejs-sdk';
import { UpsAPI, UpsResponse } from './ups-types';
import { Output } from './common-types';
import { calc_distance } from './distance-utils';
import { calc_flight_emissions, calc_ground_emissions } from './emissions-utils';

function get_addresses(res: UpsResponse) {
  const shipment = res.Shipment;
  if (shipment && shipment.ShipTo && shipment.ShipTo.Address) {
    const pack = shipment.Package;
    if (pack && pack.Activity) {
      const a = pack.Activity.find((a)=>a.Status&&a.Status.StatusCode&&a.Status.StatusCode.Code==='OR');
      const b = pack.Activity.find((a)=>a.Status&&a.Status.StatusType&&a.Status.StatusType.Code==='D');
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

function is_ground(res: UpsResponse) {
  const shipment = res.Shipment;
  if (shipment && shipment.Service && shipment.Service.Code) {
    return shipment.Service.Code.toLowerCase().indexOf('03') > -1;
  } else {
    return true;
  }
}

// wrap UPS api call into a promise
const ups_track = (ups:UpsAPI, trackingNumber: string) => new Promise((resolve, reject) => ups.track(trackingNumber, {latest: false}, (err, res) => {
  if (err) reject(err);
  else resolve(res);
}));

type UpsShipmentOutput = {
  trackingNumber: string,
  output: Output,
}

// return a promise with the output object for a shipment
export function get_ups_shipment(ups:UpsAPI, trackingNumber: string): Promise<UpsShipmentOutput> {
  return new Promise((resolve, reject) => {
    ups_track(ups, trackingNumber)
      .then((res: UpsResponse) => {
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
          const emissions = isGround ? calc_ground_emissions(weight) : calc_flight_emissions(weight);
          output.emissions = emissions;
        }
        const addresses = get_addresses(res);
        if (addresses) {
          const address_o = addresses.origin.join(' ');
          const address_d = addresses.dest.join(' ');
          calc_distance(address_o, address_d, isGround ? 'ground' : 'flight').then((distance) => {
            output.distance = distance;
            resolve(result);
          });
        } else {
          resolve(result);
        }
      })
      .catch(error => {
        reject({trackingNumber, error});
      })
  });
}

export function get_ups_client() {

  const conf = {
    environment: process.env.UPS_ENV,
    username: process.env.UPS_USER,
    password: process.env.UPS_PASSWORD,
    access_key: process.env.UPS_KEY,
  }

  const ups: UpsAPI = new upsAPI(conf);
  return ups;

}
