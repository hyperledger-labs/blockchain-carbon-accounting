import { Activity, ActivityResult, Distance, FlightActivity, is_shipment_activity, is_shipment_flight, ProcessedActivity, ShipmentActivity, ValueAndUnit } from './common-types';
import BCGatewayConfig from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/config';
import Signer from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/signer';
import EthNetEmissionsTokenGateway from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/netEmissionsTokenNetwork';
import {
    IEthTxCaller,
    IEthNetEmissionsTokenIssueInput,
} from '../../utility-emissions-channel/typescript_app/src/blockchain-gateway/I-gateway';
import { setup } from '../../utility-emissions-channel/typescript_app/src/utils/logger';
import { BigNumber } from 'bignumber.js';
import { hash_content } from './crypto-utils';
import { uploadFileEncrypted } from './ipfs-utils';
import { get_ups_client, get_ups_shipment } from './ups-utils';
import { calc_direct_distance, calc_distance } from './distance-utils';


let logger_setup = false;
const LOG_LEVEL = 'silent';

export function weight_in_kg(weight: number, uom?: string) {
  if (!weight) throw new Error(`Invalid weight ${weight}`);
  if (!uom) return weight;
  // check supported UOMs
  const u = uom.toLowerCase();
  if (u === 'kg') return weight;
  if (u === 'lb'||u === 'lbs'||u === 'pound') return weight * 0.453592;
  if (u === 'pound') return weight * 0.453592;
  if (u === 't') return weight * 1000.0;
  if (u === 'g') return weight / 1000.0;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported`);
}

export function distance_in_km(distance: Distance): number {
  if (!distance.unit||distance.unit === 'km') return distance.value;
  if (distance.unit === 'mi') return distance.value * 1.60934;
  // not recognized
  throw new Error(`Distance UOM ${distance.unit} not supported`);
}

export function calc_emissions(weight_kg: number, distance: Distance): ValueAndUnit {
  const distance_km = distance_in_km(distance);
  const w_d = weight_kg * 0.001 * distance_km;
  // for difference 'mode'
  let emissions = w_d;
  if (distance.mode === 'air') {
    emissions *= 2.37968;
  } else if (distance.mode === 'ground') {
    emissions *= 0.52218;
  } else {
    throw new Error(`Distance mode ${distance.mode} not supported`);
  }
  return { value: emissions, unit: 'kgCO2e' };
}

export async function issue_emissions_tokens(total_emissions: number, metadata: string, hash: string, ipfs_path: string) {
  if (!logger_setup) {
    setup(LOG_LEVEL, LOG_LEVEL);
    logger_setup = true;
  }
  const tokens = new BigNumber(Math.round(total_emissions));
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
    quantity: tokens.toNumber(),
    fromDate: nowTime,
    thruDate: nowTime,
    automaticRetireDate: 0,
    manifest: `ipfs://${ipfs_path} ${hash}`,
    metadata: metadata,
    description: 'Emissions from shipments',
  };
  const token = await gateway.issue(caller, input);
  return token;
}

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

export async function process_activity(activity: Activity) {
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

export async function process_activities(activities: Activity[]): Promise<ProcessedActivity[]> {
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

export function group_processed_activities(activities: ProcessedActivity[]) {
  return activities.filter(a=>!a.error).reduce((prev:GroupedResults, a)=>{
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
}

export type GroupedResult = {
  total_emissions: ValueAndUnit,
  content: ProcessedActivity[],
  token?: any,
};

export type GroupedResults = {[key: string]: GroupedResult | GroupedResults | ProcessedActivity[]};


export async function issue_tokens(doc: GroupedResult, activity_type: string, publicKeys: string[], mode = null) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const h = hash_content(content);
  // save into IPFS
  const ipfs_res = await uploadFileEncrypted(content, publicKeys);
  // issue tokens
  const total_emissions_rounded = Math.round(total_emissions*1000)/1000;
  
  // target format [{key: "key", value: "value"}, {,,,}]
  const metadata = [
    {key: "Total emissions", value: total_emissions_rounded},
    {key: "UOM", value: "kgCO2e"},
    {key: "Scope", value: 3},
    {key: "Type", value: activity_type}
  ];
  if(mode) {
    metadata.push({
      key: "Mode", value: mode
    });
  }

  const token_res = await issue_emissions_tokens(total_emissions, JSON.stringify(metadata), `${h.type}:${h.value}`, ipfs_res.path);
  doc.token = token_res;
  return token_res;
}

