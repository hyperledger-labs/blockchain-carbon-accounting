import * as dotenv from 'dotenv';
import { readFileSync } from 'fs'
import { generateKeyPair, hash_content } from './src/crypto-utils';
import { downloadFileEncrypted, uploadFileEncrypted } from './src/ipfs-utils';
import { issue_emissions_tokens } from './src/emissions-utils';
import { get_ups_client, get_ups_shipment } from './src/ups-utils';

function print_usage() {
  console.log('Usage: node ups.js [-f tracking_number_file.txt] [-pk privatekey.pem] [-pubk pubkey1.pem] [-pubk pubkey2.pem] ... [tracking_number1] [tracking_number2] ...');
  console.log('  -f tracking_number_file.txt: should be a text file with one tracking number per line.');
  console.log('  -pubk pubkey.pem: is used to encrypt content put on IPFS (can use multiple keys to encrypt for multiple users).');
  console.log('  -pk privatekey.pem: is used to decrypt content (only when fetching content from IPFS).');
  console.log('  -generatekeypair name: generates a name-privatekey.pem and name-publickey.pem which can be used as -pk and -pubk respectively.');
  console.log('  -fetch objectpath: fetch the ipfs://<objectpath> object, if -pk is given will decrypt the file with it.');
  console.log('  -verify: when fetching from IPFS, outputs the hash.');
  console.log('  -h or --help displays this message.');
}
// common config
dotenv.config();

// for encryption and decryption
const publicKeys = [];
let privateKey = null;
let fetchObjectPath = null;
let verify = false;
const generatedKeypairs = [];

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
    generateKeyPair(a);
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
  } else if (a === '-verify') {
    verify = true;
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
    const result = res.toString('utf8');
    if (verify) {
      const h = hash_content(result);
      console.log(`HASH: ${h.type}:${h.value}`);
      console.log('');
    }
    console.log(result);
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

  const ups = get_ups_client();

  // allow multiple tracking numbers to be used
  // so we return an object with "shipments": as an array of objects, each like { "trackingNumber": "xxxxxx", "output" | "error" : {} }
  // and "emissons": { sum of emissions }
  Promise.allSettled(trackingNumbers.map((tn)=>get_ups_shipment(ups, tn)))
    .then(async (promises) => {
      const failures = promises.filter(p=>p.status!=='fulfilled').map(p=>(p.status === 'fulfilled')?p.value:p.reason);
      if (failures.length && 'Y'!==process.env.UPS_SKIP_ERRORS) {
        console.log(JSON.stringify({error:'Some request failed!', failures}, null, 4));
        return;
      }
      const shipments = promises.map(p=>(p.status === 'fulfilled')?p.value:p.reason);
      // calculate total_emissions
      let total_emissions: number = shipments.reduce((prev, current) => {
        if (!current.output || !current.output.emissions) return prev;
        return prev + current.output.emissions.value;
      }, 0);
      // convert to token amount in kgCo2e
      if (process.env.EMISSIONS_SHIFT) {
        total_emissions *= 10**parseInt(process.env.EMISSIONS_SHIFT);
      }
      if (total_emissions < 1) {
        throw new Error('Cannot issue tokens as the total emissions for the given shipments ('+total_emissions+') are less than 1 kgCO2e. Try adding more shipments to the request.');
      }
      // create a hash
      const doc = {shipments, total_emissions: { value: total_emissions, unit: 'kgCO2e'}};
      const content = JSON.stringify(doc);
      const h = hash_content(content);
      // save into IPFS
      const ipfs_res = await uploadFileEncrypted(content, publicKeys);
      // issue tokens
      const token_res = await issue_emissions_tokens(total_emissions, `${h.type}:${h.value}`, ipfs_res.path);
      // print output in JSON
      console.log(JSON.stringify({
        shipments,
        hash: h,
        token: token_res,
        ipfs: ipfs_res,
        total_emissions: { value: total_emissions, unit: 'kgCO2e'}
      }, null, 4));
    });
}
