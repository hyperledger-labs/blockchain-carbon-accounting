import upsAPI from 'ups-nodejs-sdk';
import {Client, LatLngLiteral, UnitSystem} from "@googlemaps/google-maps-services-js";
import * as dotenv from 'dotenv';
import * as crypto from "crypto";
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
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


function print_usage() {
  console.log('Usage: node ups.js [-f tracking_number_file.txt] [-pk privatekey.pem] [-pubk pubkey1.pem] [-pubk pubkey2.pem] ... [tracking_number1] [tracking_number2] ...');
  console.log('  -f tracking_number_file.txt: should be a text file with one tracking number per line.');
  console.log('  -pubk pubkey.pem: is used to encrypt content put on IPFS (can use multiple keys to encrypt for multiple users).');
  console.log('  -pk privatekey.pem: is used to decrypt content (only when fetching content from IPFS).');
  console.log('  -generatekeypair name: generates a name-privatekey.pem and name-publickey.pem which can be used as -pk and -pubk respectively.');
  console.log('  -fetch objectpath: fetch the ipfs://<objectpath> object, if -pk is given will decrypt the file with it.');
  console.log('  -h or --help displays this message.');
}

function encryptRSA(toEncrypt: string, pubkeyPath: string) {
  const absolutePath = resolve(pubkeyPath)
  const publicKey = readFileSync(absolutePath, 'utf8')
  const buffer = Buffer.from(toEncrypt, 'utf8')
  const encrypted = crypto.publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

function decryptRSA(toDecrypt: string, privkeyPath: string) {
  const absolutePath = resolve(privkeyPath)
  const privateKey = readFileSync(absolutePath, 'utf8')
  const buffer = Buffer.from(toDecrypt, 'base64')
  const decrypted = crypto.privateDecrypt(
  {
    key: privateKey.toString(),
    passphrase: '',
  },
  buffer,
  )
  return decrypted.toString('utf8')
}

function encryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  const data = cipher.update(buffer);
  const encrypted = Buffer.concat([data, cipher.final()]);
  return encrypted.toString('hex')
}

function decryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
  const data = decipher.update(buffer)
  const decrpyted = Buffer.concat([data, decipher.final()]);
  return decrpyted;
}


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
const ups_track = (ups:any, trackingNumber: string) => new Promise((resolve, reject) => ups.track(trackingNumber, {latest: false}, (err: any, res: UpsResponse) => {
  if (err) reject(err);
  else resolve(res);
}));

// return a promise with the output object for a shipment
function get_shipment(ups:any, trackingNumber: string) {
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
              output.distance = {error: err};
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
                  output.distance = {error: err};
                  resolve(result);
              });
          }).catch((err)=>{
              output.geocode = {error: err};
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

async function downloadFileEncrypted(ipfspath: string, pk: string) {
  try {
    const ipfs_client = create({url: process.env.IPFS_URL});
    const data = [];
    for await (const chunk of ipfs_client.cat(ipfspath)) {
      data.push(chunk);
    }
    const edata0 = Buffer.concat(data);

    // first contains the number of keys
    // then each key is 684
    // then the IV is 16
    // then finally the encrypted content
    const kcount = edata0.readUInt8(0);
    const edata = edata0.slice(1);
    const keys: string[] = [];
    for (let i=0; i<kcount; i++) {
      try {
        const kbuff = edata.slice(684*i, 684*(i+1));
        const key = decryptRSA(kbuff.toString('utf8'), pk);
        keys.push(key);
      } catch (err) {
        // note: if not our key, it might just fail to decrypt here
        // so don't print anything
      }
    }
    if (!keys.length) {
      throw new Error('Cannot decrypt the content with the given private key.');
    }
    const iv = edata.slice(684*kcount, 684*kcount+16).toString('utf8');
    const econtent = edata.slice(684*kcount+16).toString('utf8');
    const ebuf = Buffer.from(econtent, 'hex');
    // try all the keys?
    let content = null;
    for (const key of keys) {
      try {
        content = decryptAES(ebuf, key, iv);
        break;
      } catch (err) {
        // if the wrong key is used this might fail
        console.error('Error in trying to decrypt the content with key: '+key);
        console.error(err);
      }
    }

    return content
  } catch (err) {
    console.log(err)
    throw err;
  }
}

async function uploadFileEncrypted(plain_content: string, pubkeys: string[]) {
  try {
    const ipfs_client = create({url: process.env.IPFS_URL});
    const buff = Buffer.from(plain_content, 'utf8');
    const key = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 chars
    const iv = crypto.randomBytes(8).toString('hex');   // 8 bytes -> 16 chars
    const buffArr = [];
    // note: we need to keep track of the number of keys stored
    const countBuff = Buffer.allocUnsafe(1);
    countBuff.writeUInt8(pubkeys.length);
    buffArr.push(countBuff);
    for (const pubkey of pubkeys) {
      const ekey = encryptRSA(key, pubkey); // 32 chars -> 684 chars
      buffArr.push(Buffer.from(ekey, 'utf8'));
    }
    const ebuff = encryptAES(buff, key, iv);
    buffArr.push(Buffer.from(iv, 'utf8'));     // char length: 16
    buffArr.push(Buffer.from(ebuff, 'utf8'));

    const content = Buffer.concat(buffArr);

    const ipfs_res = await ipfs_client.add({content});
    return ipfs_res;
  } catch (err) {
    console.error(err)
    throw err;
  }
}

// common config
dotenv.config();
setup('silent', 'silent');

// for encryption and decryption
const publicKeys = [];
let privateKey = null;
let fetchObjectPath = null;
let generatedKeypairs = [];

const args = process.argv.slice(2);
if (args.length < 1) {
  throw new Error('At least one tracking number argument is required!');
}
let trackingNumbers = [];
// parse arguments
// -h or --help -> show usage
// -f <filename>
// -privateKey <filename>
// -publicKey <filename>
// -generatekeypair <name>
for (let i=0; i<args.length; i++) {
  let a = args[i];
  if (a === '-f') {
    i++;
    if (i == args.length) throw new Error('Missing argument filename after -f');
    const file = args[i];
    try {
      const data = readFileSync(file, 'utf8');
      // filter empty lines (including possible end of line characters)
      const tns = data.split(/\r?\n/).filter(l=>l.length>5);
      trackingNumbers = trackingNumbers.concat(tns);
    } catch (err) {
      console.error('Could not read the file: ' + file);
      throw err;
    }
  } else if (a === '-generatekeypair') {
    i++;
    if (i == args.length) throw new Error('Missing argument name after -generatekeypair');
    a = args[i];
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: '',
      },
    });

    writeFileSync(`${a}-private.pem`, privateKey);
    writeFileSync(`${a}-public.pem`, publicKey);
    generatedKeypairs.push(a);
  } else if (a === '-pk') {
    i++;
    if (i == args.length) throw new Error('Missing argument filename after -pk');
    a = args[i];
    if (privateKey) throw new Error('Cannot define multiple privateKey');
    privateKey = a;
  } else if (a === '-pubk') {
    i++;
    if (i == args.length) throw new Error('Missing argument filename after -pubk');
    a = args[i];
    publicKeys.push(a);
  } else if (a === '-fetch') {
    i++;
    if (i == args.length) throw new Error('Missing argument objectpath after -fetch');
    if (fetchObjectPath) throw new Error('Cannot define multiple objects to fetch');
    a = args[i];
    fetchObjectPath = a;
  } else if (a === '-h' || a === '--help') {
    print_usage();
    process.exit();
  } else {
    // check for unknown flag arguments
    if (a[0] === '-') {
      throw new Error('Unknown argument: ' + a);
    }
    trackingNumbers.push(a);
  }
}
// check if we are fetching an object from ipfs
if (fetchObjectPath) {
  // if also given tracking numbers, error out
  if (trackingNumbers.length) {
    throw new Error('Cannot both fetch from IPFS and fetch shipments from tracking numbers at the same time!');
  }
  if (!privateKey) {
    throw new Error('A privatekey is required, specify one with -pk <privatekey.pem>');
  }
  downloadFileEncrypted(fetchObjectPath, privateKey).then((res) => {
    //const buff = Buffer.from(res.toString(), 'hex');
    console.log(res.toString('utf8'));
  });
} else if (!trackingNumbers.length) {
  if(!generatedKeypairs.length) {
    console.error('No tracking number given to fetch.');
  } else {
    console.log('Keypairs generated: ');
    for (const k of generatedKeypairs) {
      console.log(`  ${k}-public.pem and ${k}-private.pem`);
    }
  }
} else {

  if (!publicKeys.length) {
    throw new Error('No publickey was given for encryption, specify at least one with the -pubk <public.pem> argument.');
  }

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

  // allow multiple tracking numbers to be used
  // so we return an object with "shipments": as an array of objects, each like { "trackingNumber": "xxxxxx", "output" | "error" : {} }
  // and "emissons": { sum of emissions }
  Promise.allSettled(trackingNumbers.map((tn)=>get_shipment(ups, tn)))
    .then(async (promises) => {
      const failures = promises.filter(p=>p.status!=='fulfilled').map(p=>(p.status === 'fulfilled')?p.value:p.reason);
      if (failures.length && 'Y'!==process.env.UPS_SKIP_ERRORS) {
        console.log(JSON.stringify({error:'Some request failed!', failures}, null, 4));
        return;
      }
      const shipments = promises.map(p=>(p.status === 'fulfilled')?p.value:p.reason);
      // create a hash
      const algo = 'sha256';
      const content = JSON.stringify(shipments);
      const h = crypto.createHash(algo).update(content).digest('hex');
      // calculate total_emissions
      let total_emissions: number = shipments.reduce((prev, current) => {
        if (!current.output || !current.output.emissions) return prev;
        return prev + current.output.emissions.value;
      }, 0);
      // convert to token amount in kCo2e
      if (process.env.EMISSIONS_SHIFT) {
        total_emissions = total_emissions *= 10**parseInt(process.env.EMISSIONS_SHIFT);
      }
      if (total_emissions < 1) {
        throw new Error('Cannot issue tokens as the total emissions for the given shipments are less than 1 kCO2e ('+total_emissions+') try adding more shipments to the request.');
      }
      // save into IPFS
      const ipfs_res = await uploadFileEncrypted(content, publicKeys);
      // issue tokens
      const tokens = new BigNumber(Math.round(total_emissions));
      const token_res = await issue_tokens(tokens, `${algo}:${h}`, ipfs_res.path);
      // print output in JSON
      console.log(JSON.stringify({
        shipments,
        hash: { type: algo, value: h },
        token: token_res,
        ipfs: ipfs_res,
        emissions: { value: total_emissions, unit: 'kgCO2e'}
      }, null, 4));
    });
}
