import * as dotenv from 'dotenv';
import { readFileSync } from 'fs'
import { Activity, ActivityResult, FlightActivity, is_shipment_activity, is_shipment_flight, ProcessedActivity, ShipmentActivity, ValueAndUnit } from "./src/common-types";
import { hash_content } from './src/crypto-utils';
import { calc_direct_distance, calc_distance } from './src/distance-utils';
import { calc_emissions, issue_emissions_tokens, weight_in_kg } from './src/emissions-utils';
import { uploadFileEncrypted } from './src/ipfs-utils';
import { get_ups_client, get_ups_shipment } from "./src/ups-utils";

// common config
dotenv.config();


export async function process_shipment(a: ShipmentActivity): Promise<ActivityResult> {
  if (a.carrier === 'ups') {
    const uc = get_ups_client();
    const shipment = await get_ups_shipment(uc, a.tracking);
    const { distance, weight, emissions, ups } = shipment.output;
    return { 
      distance,
      weight,
      emissions,
      details: ups
    };
  } else {
    // mode is required here
    if (!a.mode) throw new Error(`Shipment mode field value is required`);
    // calculate distance from the address fields ...
    const distance = await calc_distance(a.from, a.to, a.mode);
    // then calc emissions ...
    const weight = weight_in_kg(a.weight, a.weight_uom);
    const emissions = calc_emissions(weight, distance);
    return { distance, weight: {value: weight, unit: 'kg'}, emissions };
  }
}

export async function process_flight(a: FlightActivity): Promise<ActivityResult> {
  const distance = await calc_direct_distance(a.from, a.to, 'air');
  const weight = 80; // arbitrary value here
  const emissions = calc_emissions(weight, distance);
  return { distance, weight: {value: weight, unit: 'kg'}, emissions };
}

async function process_activity(activity: Activity) {
  // all activity must have an ID
  if (!activity.id) {
    throw new Error('Activity must have an id');
  }
  if (is_shipment_activity(activity)) {
    return await process_shipment(activity);
  } else if (is_shipment_flight(activity)) {
    return await process_flight(activity);
  } else {
    throw new Error("activity not recognized");
  }
}

async function process_activities(activities: Activity[]): Promise<ProcessedActivity[]> {
  return await Promise.all(activities.map(async (activity)=>{
    try {
      const result = await process_activity(activity);
      return { activity, result }
    } catch (error) {
      // console.error("Error in process_activities: ", error);
      return { activity, error: error.message||error }
    }
  }));
}

async function issue_tokens(doc: GroupedResult, activity_type: string, publicKeys: string[], mode = null) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const h = hash_content(content);
  // save into IPFS
  const ipfs_res = await uploadFileEncrypted(content, publicKeys);
  // issue tokens
  const total_emissions_rounded = Math.round(total_emissions*1000)/1000;
  let metadata = `Total emissions: ${total_emissions_rounded} UOM: kgCO2e Scope: 3 Type: ${activity_type}`;
  if (mode) {
    metadata += ` Mode: ${mode}`;
  }
  const token_res = await issue_emissions_tokens(total_emissions, metadata, `${h.type}:${h.value}`, ipfs_res.path);
  doc.token = token_res;
}

function print_usage() {
  console.log('Usage: node emissions.js input.json [-pubk pubkey1.pem] [-pubk pubkey2.pem] ...');
  console.log('  -pubk pubkey.pem: is used to encrypt content put on IPFS (can use multiple keys to encrypt for multiple users).');
  console.log('  -h or --help displays this message.');
}

const args = process.argv.splice( /node$/.test(process.argv[0]) ? 2 : 1 );
const source = args.length > 0 ? args[0] : "/dev/stdin";
const data_raw = readFileSync(source, 'utf8');
const data = JSON.parse(data_raw);
const publicKeys: string[] = [];

for (let i=0; i<args.length; i++) {
  let a = args[i];
  if (a === '-pubk') {
    i++;
    if (i == args.length) throw new Error('Missing argument filename after -pubk');
    a = args[i];
    publicKeys.push(a);
  } else if (a === '-h' || a === '--help') {
    print_usage();
    process.exit();
  }
}
if (!publicKeys.length) {
  throw new Error('No publickey was given for encryption, specify at least one with the -pubk <public.pem> argument.');
}

type GroupedResult = {
  total_emissions: ValueAndUnit,
  content: ProcessedActivity[],
  token?: any,
};
type GroupedResults = {[key: string]: GroupedResult | GroupedResults};

process_activities(data.activities).then(async (activities)=>{
  // group the resulting emissions per activity type, and for shipment type group by mode:
  const grouped_by_type = activities.filter(a=>!a.error).reduce((prev:GroupedResults, a)=>{
    const t = a.activity.type;
    if (t === 'shipment') {
      const m = a.result.distance.mode;
      const g = prev[t] || {} as GroupedResults;
      prev[t] = g;
      g[m] = g[m] || { total_emissions: {value: 0.0, unit: 'kgCO2e'}, content: [] };
      const d = (g[m] || { total_emissions: {value: 0.0, unit: 'kgCO2e'}, content: [] }) as GroupedResult;
      d.total_emissions.value += a.result.emissions.value;
      d.content.push(a);
      g[m] = d;
    } else {
      const d = (prev[t] || { total_emissions: {value: 0.0, unit: 'kgCO2e'}, content: [] }) as GroupedResult;
      const v = d.total_emissions as ValueAndUnit;
      v.value += a.result.emissions.value;
      d.content.push(a);
      prev[t] = d;
    }
    return prev;
  }, {});
  // now we can emit the tokens for each group and prepare the relevant data for final output
  for (const t in grouped_by_type) {
    if (t === 'shipment') {
      const group = grouped_by_type[t] as GroupedResults;
      for (const mode in group) {
        const doc = group[mode] as GroupedResult;
        await issue_tokens(doc, t, publicKeys, mode);
      }
    } else {
      const doc = grouped_by_type[t] as GroupedResult;
      await issue_tokens(doc, t, publicKeys);
    }

  }
  return grouped_by_type;
}).then((output)=>{
  console.log(JSON.stringify(output, null, 4));
});
