import { Client, LatLngLiteral, UnitSystem } from "@googlemaps/google-maps-services-js";
import { Distance, OutputError } from './common-types';

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

export async function calc_ground_distance(origin: string, dest: string, client: Client = null): Promise<Distance|OutputError> {

  if (!client) client = get_gclient();

  return new Promise((resolve) => {
    client.distancematrix({
      params: {
        origins: [origin],
        destinations: [dest],
        units: UnitSystem.metric,
        key: process.env.GOOGLE_KEY || ''
      }
    }).then((results)=>{
      const dist = results.data.rows[0].elements[0].distance;
      // the value is always in meter, need to convert into either km or mi
      const dist_m = dist.value / 1000;
      const res: Distance = {
        origin: {
          address: origin,
        },
        destination: {
          address: dest,
        },
        value: dist_m,
        unit: 'km'
      };

      resolve(res);
    }).catch((error)=>{
      const res: OutputError = {error}
      resolve(res);
    });
  });
}

export async function calc_flight_distance(origin: string, dest: string, client: Client = null): Promise<Distance|OutputError> {

  if (!client) client = get_gclient();

  return new Promise((resolve) => {
    client.geocode({
      params: {
        address: origin,
        key: process.env.GOOGLE_KEY || ''
      }
    }).then((results)=>{
        const origin_r = results.data.results[0].geometry.location;
        client.geocode({
          params: {
            address: dest,
            key: process.env.GOOGLE_KEY || ''
          }
        }).then((results)=>{
            const dest_r = results.data.results[0].geometry.location;
            const res: Distance = {
              origin: {
                address: origin,
                coords: origin_r
              },
              destination: {
                address: dest,
                coords: dest_r
              },
              value: calc_coord_distance(origin_r, dest_r),
              unit: 'km'
            };
            resolve(res);
          }).catch((error)=>{
            const res: OutputError = {error}
            resolve(res);
          });
      }).catch((error)=>{
        const res: OutputError = {error}
        resolve(res);
      });
  });
}

export async function calc_distance(origin: string, dest: string, mode: 'ground' | 'flight') {
  if (mode === 'ground') {
    return calc_ground_distance(origin, dest);
  }
  return calc_flight_distance(origin, dest);
}
