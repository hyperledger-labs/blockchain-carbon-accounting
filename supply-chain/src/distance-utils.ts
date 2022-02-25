import { Client, LatLngLiteral, UnitSystem } from "@googlemaps/google-maps-services-js";
import { Address, Distance, is_address_object, ShippingMode } from './common-types';

export function get_gclient() {
  return new Client({});
}

export function calc_coord_distance(o: LatLngLiteral, d: LatLngLiteral) {
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

function get_address_string(address: Address): string {
  if (is_address_object(address)) { 
    const fields = [];
    for (const p in address) {
      fields.push(address[p]);
    }
    return fields.join(' ');
  } else {
    return address;
  }
}

export async function calc_ground_distance(origin: Address, dest: Address, client: Client = null): Promise<Distance> {

  if (!client) client = get_gclient();
  const o = get_address_string(origin);
  const d = get_address_string(dest);

  return new Promise((resolve, reject) => {
    client.distancematrix({
      params: {
        origins: [o],
        destinations: [d],
        units: UnitSystem.metric,
        key: process.env.GOOGLE_KEY || ''
      }
    }).then((results)=>{
      if (!results.data||!results.data.rows||!results.data.rows.length||!results.data.rows[0].elements||!results.data.rows[0].elements.length) {
        return reject(`No distancematrix results for address [${o}]`);
      }
      const dist = results.data.rows[0].elements[0].distance;
      // the value is always in meter, need to convert into either km or mi
      const dist_km = dist.value / 1000;
      const res: Distance = {
        origin: {
          address: o,
        },
        destination: {
          address: d,
        },
        value: dist_km,
        unit: 'km',
        mode: 'ground'
      };

      resolve(res);
    });
  });
}

export async function calc_direct_distance(origin: Address, dest: Address, mode: ShippingMode, client: Client = null): Promise<Distance> {

  if (!client) client = get_gclient();
  const o = get_address_string(origin);
  const d = get_address_string(dest);

  return new Promise((resolve, reject) => {
    client.geocode({
      params: {
        address: o,
        key: process.env.GOOGLE_KEY || ''
      }
    }).then((results)=>{
        if (!results.data||!results.data.results||!results.data.results.length) {
          return reject(`No geocode results for address [${o}]`);
        }
        const origin_r = results.data.results[0].geometry.location;
        client.geocode({
          params: {
            address: d,
            key: process.env.GOOGLE_KEY || ''
          }
        }).then((results)=>{
            if (!results.data||!results.data.results||!results.data.results.length) {
              return reject(`No geocode results for address [${d}]`);
            }
            const dest_r = results.data.results[0].geometry.location;
            const res: Distance = {
              origin: {
                address: o,
                coords: origin_r
              },
              destination: {
                address: d,
                coords: dest_r
              },
              value: calc_coord_distance(origin_r, dest_r),
              unit: 'km',
              mode
            };
            resolve(res);
          });
      });
  });
}

export async function calc_distance(origin: Address, dest: Address, mode: ShippingMode) {
  if (mode === 'ground') {
    return calc_ground_distance(origin, dest);
  } else {
    return calc_direct_distance(origin, dest, mode);
  }
}
