// eslint-disable-next-line
// @ts-ignore
import upsAPI from 'ups-nodejs-sdk';
import { UpsAPI, UpsResponse } from './ups-types';
import { Output, Path } from './common-types';
import { calc_distance } from './distance-utils';
import { calc_freight_emissions } from './emissions-utils';

function get_path(res: UpsResponse): Path|undefined {
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
        for (const [,v] of Object.entries(o)) {
          origin.push(v);
        }
        for (const [,v] of Object.entries(d)) {
          dest.push(v);
        }
        if (dest && origin) {
          return { from: origin.join(' '), to: dest.join(' ') };
        }
      }
    }
  }
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
const ups_track = (ups:UpsAPI, trackingNumber: string) => new Promise<UpsResponse>((resolve, reject) => ups.track(trackingNumber, {latest: false}, (err, res) => {
  if (err) reject(err);
  else resolve(res);
}));

type UpsShipmentOutput = {
  trackingNumber: string,
  output: Output,
}

// return a promise with the output object for a shipment
export async function get_ups_shipment(ups:UpsAPI, trackingNumber: string, year?: string | undefined): Promise<UpsShipmentOutput> {
  const res = await ups_track(ups, trackingNumber);
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
  }
  const path = get_path(res);
  if (path) {
    output.from = path.from;
    output.to = path.to;
    const distance = await calc_distance(path.from, path.to, isGround ? 'ground' : 'air');
    output.distance = distance;
    const emissions = await calc_freight_emissions(weight, distance, year);
    output.emissions = emissions;
    return result;
  } else {
    throw new Error('Package not delivered yet!');
  }
}


let ups_client: UpsAPI;

export function get_ups_client() {

  if (ups_client) return ups_client;

  const conf = {
    environment: process.env.UPS_ENV,
    username: process.env.UPS_USER,
    password: process.env.UPS_PASSWORD,
    access_key: process.env.UPS_KEY,
  }

  ups_client = new upsAPI(conf);
  return ups_client;

}
