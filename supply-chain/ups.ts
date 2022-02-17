import upsAPI from 'ups-nodejs-sdk';
import {Client, LatLngLiteral, UnitSystem} from "@googlemaps/google-maps-services-js";
import * as dotenv from 'dotenv';
import * as crypto from "crypto";
import { create } from 'ipfs-http-client';
import { setup } from '../utility-emissions-channel/typescript_app/src/utils/logger';
import BCGatewayConfig from '../utility-emissions-channel/typescript_app/src/blockchain-gateway/config';
import Signer from '../utility-emissions-channel/typescript_app/src/blockchain-gateway/signer';
import EthNetEmissionsTokenGateway from '../utility-emissions-channel/typescript_app/src/blockchain-gateway/netEmissionsTokenNetwork';
import {
    IEthTxCaller,
    IEthNetEmissionsTokenIssueInput,
} from '../utility-emissions-channel/typescript_app/src/blockchain-gateway/I-gateway';
import { BigNumber } from 'bignumber.js';
dotenv.config();
setup('silent', 'silent');

type UpsAddress = {
  AddressLine1?: string,
  AddressLine2?: string,
  City?: string,
  StateProvinceCode?: string,
  CountryCode?: string,
  PostalCode?: string,
}
type UpsActivity = {
  ActivityLocation: {
    Address: UpsAddress,
    Code: string,
    Description: string,
  },
  Status: {
    StatusType: {
      Code: string,
      Description: string,
    },
    StatusCode: {
      Code: string
    }
  },
  Date: string,
  Time: string
}
type UpsResponse = {
  Response: {
    ResponseStatusCode: string,
    ResponseStatusCodeDescription: string,
  },
  Shipment: {
    Shipper: {
      Address: UpsAddress,
      ShipperNumber: string,
    },
    ShipTo: {
      Address: UpsAddress,
    },
    ShipmentWeight: {
      UnitOfMeasurement: {
        Code: string,
      },
      Weight: number
    },
    Service: {
      Code: string,
      Description: string,
    },
    Package: {
      Activity: UpsActivity[],
    }

  }
}

type OutputValue = {
  value: number,
  unit: string
}
type OutputDistanceAddress = {
  address: string,
  coords?: LatLngLiteral
}
type OutputDistance = {
  origin: OutputDistanceAddress,
  destination: OutputDistanceAddress,
  value: number,
  unit: string
}
type OutputError = {
  error: string
}
type Output = {
  ups?: UpsResponse,
  weight?: OutputValue,
  distance?: OutputDistance | OutputError,
  emissions?: OutputValue,
  geocode?: OutputError,
}


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

async function issue_tokens(emissions: BigNumber, hash: string, ipfs_path: string) {
  const bcConfig = new BCGatewayConfig();
  const ethConnector = await bcConfig.ethConnector();
  const signer = new Signer('vault', bcConfig.inMemoryKeychainID, 'plain');
  const nowTime = Math.floor(new Date().getTime() / 1000);

  const gateway = new EthNetEmissionsTokenGateway({
    contractStoreKeychain: ethConnector.contractStoreKeychain,
    ethClient: ethConnector.connector,
    signer: signer,
  });
  const caller: IEthTxCaller = {
    address: process.env.ETH_ISSUER_ACCT,
    private: process.env.ETH_ISSUER_PRIVATE_KEY,
  };
  const input: IEthNetEmissionsTokenIssueInput = {
    addressToIssue: process.env.ETH_ISSUEE_ACCT || '',
    quantity: emissions.toNumber(),
    fromDate: nowTime,
    thruDate: nowTime,
    automaticRetireDate: 0,
    metadata: `ipfs://${ipfs_path}`,
    manifest: hash,
    description: 'Emissions from shipments',
  };
  const token = await gateway.issue(caller, input);
  return token;
}

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

function calc_distance(o: LatLngLiteral, d: LatLngLiteral) {
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
const ups_track = (trackingNumber: string) => new Promise((resolve, reject) => ups.track(trackingNumber, {latest: false}, (err: any, res: UpsResponse) => {
  if (err) reject(err);
  else resolve(res);
}));

// return a promise with the output object for a shipment
function get_shipment(trackingNumber: string) {
  return new Promise((resolve, reject) => {
  ups_track(trackingNumber)
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
  .then(async (promises) => {
    const failures = promises.filter(p=>p.status!=='fulfilled').map(p=>(p.status === 'fulfilled')?p.value:p.reason);
    if (failures.length) {
      console.log(JSON.stringify({error:'Some request failed!', failures}, null, 4));
      return;
    }
    const shipments = promises.map(p=>(p.status === 'fulfilled')?p.value:p.reason);
    // create a hash
    const algo = 'sha256';
    const content = JSON.stringify(shipments);
    const h = crypto.createHash(algo).update(content).digest('hex');
    // calculate total_emissions
    const total_emissions: number = shipments.reduce((prev, current) => {
      if (!current.output || !current.output.emissions) return prev;
      return prev + current.output.emissions.value;
    }, 0);
    // save into IPFS
    const ipfs_client = create({url: process.env.IPFS_URL});
    const ipfs_res = await ipfs_client.add({content});
    // convert to token amount, 1 tCo2e = 1e18 token
    const tokens = new BigNumber(total_emissions).shiftedBy(15);
    const token_res = await issue_tokens(tokens, `${algo}:${h}`, ipfs_res.path);
    console.log(JSON.stringify({
      shipments,
      hash: { type: algo, value: h },
      token: token_res,
      ipfs: ipfs_res,
      emissions: { value: total_emissions, unit: 'kgCO2e'}
    }, null, 4));
  });
