import { BigNumber } from "bignumber.js";
import { readFileSync } from 'fs';
import BCGatewayConfig from "emissions_data/src/blockchain-gateway/config";
import {
  IEthNetEmissionsTokenIssueInput,
  IEthTxCaller,
} from "emissions_data/src/blockchain-gateway/I-gateway";
import EthNetEmissionsTokenGateway from "emissions_data/src/blockchain-gateway/netEmissionsTokenNetwork";
import Signer from "emissions_data/src/blockchain-gateway/signer";
import { setup } from "emissions_data/src/utils/logger";
import { PostgresDBService } from "blockchain-carbon-accounting-data-postgres/src/postgresDbService";
import { EmissionsRequestPayload } from "blockchain-carbon-accounting-data-postgres/src/repositories/common";
import {
  Activity,
  ActivityResult,
  Distance,
  EmissionFactor,
  Emissions,
  FlightActivity,
  is_shipment_activity,
  is_shipment_flight,
  ProcessedActivity,
  ShipmentActivity,
  ValueAndUnit,
} from "./common-types";
import { hash_content } from "./crypto-utils";
import { calc_direct_distance, calc_distance } from "./distance-utils";
import { uploadFileEncrypted } from "./ipfs-utils";
import { get_ups_client, get_ups_shipment } from "./ups-utils";
import { getEmissionsAuditors } from './token-query-utils';
import * as carrier_emission_factors from "../data/carrier_service_mapping.json"
import * as flight_emission_factors from "../data/flight_service_mapping.json"

let logger_setup = false;
const LOG_LEVEL = "silent";
let _db: PostgresDBService = null;

async function getDBInstance() {
  if (_db) return _db;
  _db = await PostgresDBService.getInstance();
  return _db;
}

export function weight_in_kg(weight: number, uom?: string) {
  if (!weight) throw new Error(`Invalid weight ${weight}`);
  if (!uom) return weight;
  // check supported UOMs
  const u = uom.toLowerCase();
  if (u === "kg") return weight;
  if (u === "lb" || u === "lbs" || u === "pound") return weight * 0.453592;
  if (u === "t" || u === "tonne") return weight * 1000.0;
  if (u === "g") return weight / 1000.0;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported`);
}

// use this to convert kg into the emission factor uom, most should be 'tonne.kg'
// but also support different weight uoms
function get_convert_kg_for_uom(uom: string) {
  if (uom.includes('.')) {
    return get_convert_kg_for_uom(uom.split('.')[0]);
  }

  const u = uom.toLowerCase();
  if (u === "kg") return 1;
  if (u === "lb" || u === "lbs" || u === "pound") return 2.20462;
  if (u === "t" || u === "tonne") return 0.001;
  if (u === "g") return 1000.0;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported`);
}

export function distance_in_km(distance: Distance): number {
  if (!distance.unit || distance.unit === "km") return distance.value;
  if (distance.unit === "mi") return distance.value * 1.60934;
  // not recognized
  throw new Error(`Distance UOM ${distance.unit} not supported`);
}

export function get_freight_emission_factor(mode: string): EmissionFactor {
  const f = carrier_emission_factors[mode];
  if (!f) {
    throw new Error(`Distance mode ${mode} not supported`);
  }
  return f;
}

export function get_flight_emission_factor(seat_class: string): EmissionFactor {
  const f = flight_emission_factors[seat_class];
  if (!f) {
    throw new Error(`Flight class ${seat_class} not supported`);
  }
  return f;
}

async function getEmissionFactor(f: EmissionFactor) {
  const db = await getDBInstance();
  const factors = await db.getEmissionsFactorRepo().getEmissionsFactors(f);
  console.log(factors);
  if (!factors || !factors.length) throw new Error('No factor found for ' + JSON.stringify(f));
  if (factors.length > 1) throw new Error('Found more than one factor for ' + JSON.stringify(f));
  return factors[0];
}

export async function calc_flight_emissions(
  passengers: number,
  seat_class: string,
  distance: Distance
): Promise<Emissions> {
  const distance_km = distance_in_km(distance);
  // lookup the factor for different class
  const f = get_flight_emission_factor(seat_class);
  // assume the factor uom is in passenger.km here
  if (f.activity_uom !== 'passenger.km') {
    throw new Error(`Expected flight emission factor uom to be passenger.km but got ${f.activity_uom}`);
  }
  const factor = await getEmissionFactor(f);
  const emissions = passengers * distance_km * parseFloat(factor.co2_equivalent_emissions);
  // assume all factors produce kgCO2e
  return { amount: { value: emissions, unit: "kgCO2e" }, factor };
}

export async function calc_freight_emissions(
  weight_kg: number,
  distance: Distance
): Promise<Emissions> {
  const distance_km = distance_in_km(distance);
  // lookup factor for different 'mode'
  const f = get_freight_emission_factor(distance.mode);
  // most uom should be in tonne.km here
  const convert = get_convert_kg_for_uom(f.activity_uom);
  const factor = await getEmissionFactor(f);
  const emissions = weight_kg * convert * distance_km * parseFloat(factor.co2_equivalent_emissions);
  // assume all factors produce kgCO2e
  return { amount: { value: emissions, unit: "kgCO2e" }, factor };
}

export async function issue_emissions_tokens(
  activity_type: string,
  from_date: Date,
  thru_date: Date,
  total_emissions: number,
  metadata: string,
  hash: string,
  ipfs_path: string,
  publicKey: string
) {
  return await issue_emissions_tokens_with_issuee(
    activity_type,
    from_date,
    thru_date,
    process.env.ETH_ISSUE_FROM_ACCT || "",
    process.env.ETH_ISSUE_TO_ACCT || "",
    total_emissions,
    metadata,
    hash,
    ipfs_path,
    publicKey
  );
}

export async function issue_emissions_tokens_with_issuee(
  activity_type: string,
  from_date: Date,
  thru_date: Date,
  issuedFrom: string,
  issuedTo: string,
  total_emissions: number,
  metadata: string,
  hash: string,
  ipfs_path: string,
  publicKey: string
) {
  if (!logger_setup) {
    setup(LOG_LEVEL, LOG_LEVEL);
    logger_setup = true;
  }
  const tokens = new BigNumber(Math.round(total_emissions));
  const f_date = from_date || new Date();
  const t_date = thru_date || new Date();
  const fd = Math.floor(f_date.getTime() / 1000);
  const td = Math.floor(t_date.getTime() / 1000);
  const manifest = create_manifest(publicKey, ipfs_path, hash);
  const description = `Emissions from ${activity_type}`;

  return await gateway_issue_token(issuedFrom, issuedTo, tokens.toNumber(), fd, td, JSON.stringify(manifest), metadata, description);
}

async function gateway_issue_token(
  issuedFrom: string,
  issuedTo: string,
  quantity: number,
  fromDate: number,
  thruDate: number,
  manifest: string,
  metadata: string,
  description: string
) {

  const bcConfig = new BCGatewayConfig();
  const ethConnector = await bcConfig.ethConnector();
  const signer = new Signer("vault", bcConfig.inMemoryKeychainID, "plain");
  const gateway = new EthNetEmissionsTokenGateway({
    contractStoreKeychain: ethConnector.contractStoreKeychain,
    ethClient: ethConnector.connector,
    signer: signer,
  });
  const caller: IEthTxCaller = {
    address: process.env.ETH_ISSUE_BY_ACCT,
    private: process.env.ETH_ISSUE_BY_PRIVATE_KEY,
  };

  const input: IEthNetEmissionsTokenIssueInput = {
    issuedFrom: issuedFrom,
    issuedTo: issuedTo,
    quantity: quantity,
    fromDate: fromDate,
    thruDate: thruDate,
    manifest: JSON.stringify(manifest),
    metadata: metadata,
    description: description
  };
  try {
    const token = await gateway.issue(caller, input);
    return token;
  } catch (error) {
    console.log("gateway_issue_token, error", error)
    new Error(error);
  }
}

export async function process_shipment(
  a: ShipmentActivity
): Promise<ActivityResult> {
  if (a.carrier === "ups") {
    const uc = get_ups_client();
    const shipment = await get_ups_shipment(uc, a.tracking);
    const { distance, weight, emissions, ups } = shipment.output;
    return {
      distance,
      weight,
      emissions,
      details: ups,
    };
  } else {
    // mode is required here
    if (!a.mode) throw new Error(`Shipment mode field value is required`);
    // calculate distance from the address fields ...
    const distance = await calc_distance(a.from, a.to, a.mode);
    // then calc emissions ...
    const weight = weight_in_kg(a.weight, a.weight_uom);
    const emissions = await calc_freight_emissions(weight, distance);
    return { distance, weight: { value: weight, unit: "kg" }, emissions };
  }
}

export async function process_flight(
  a: FlightActivity
): Promise<ActivityResult> {
  const distance = await calc_direct_distance(a.from, a.to, "air");
  // use default values when missing
  const number_of_passengers = a.number_of_passengers || 1;
  const seat_class = a.class || 'economy';
  const emissions = await calc_flight_emissions(number_of_passengers, seat_class, distance);
  return { distance, flight: { number_of_passengers, class: seat_class }, emissions };
}

export async function process_activity(activity: Activity) {
  // all activity must have an ID
  if (!activity.id) {
    throw new Error("Activity must have an id");
  }
  if (is_shipment_activity(activity)) {
    return await process_shipment(activity);
  } else if (is_shipment_flight(activity)) {
    return await process_flight(activity);
  } else {
    throw new Error("activity not recognized");
  }
}

export async function process_activities(
  activities: Activity[]
): Promise<ProcessedActivity[]> {
  return await Promise.all(
    activities.map(async (activity) => {
      try {
        const result = await process_activity(activity);
        return { activity, result };
      } catch (error) {
        // console.error("Error in process_activities: ", error);
        return { activity, error: error.message || error };
      }
    })
  );
}

function read_date(v: string | Date, default_date?: Date) {
  if (!v) return default_date || new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v as string);
  throw new Error('Cannot read as a Date: ' + v);
}

export function group_processed_activities(activities: ProcessedActivity[]) {
  return activities
    .filter((a) => !a.error)
    .reduce((prev: GroupedResults, a) => {
      const t = a.activity.type;
      const fd = read_date(a.activity.from_date);
      const td = read_date(a.activity.thru_date, fd);
      if (t === "shipment") {
        const m = a.result.distance.mode;
        const g = prev[t] || ({} as GroupedResults);
        prev[t] = g;
        g[m] = g[m] || {
          total_emissions: { value: 0.0, unit: "kgCO2e" },
          content: [],
        };
        const d = (g[m] || {
          total_emissions: { value: 0.0, unit: "kgCO2e" },
          content: [],
        }) as GroupedResult;
        d.total_emissions.value += a.result.emissions.amount.value;
        d.content.push(a);
        if (!d.from_date || d.from_date > fd) {
          d.from_date = fd;
        }
        if (!d.thru_date || d.thru_date < td) {
          d.thru_date = td;
        }
        g[m] = d;
      } else {
        const d = (prev[t] || {
          total_emissions: { value: 0.0, unit: "kgCO2e" },
          content: [],
        }) as GroupedResult;
        const v = d.total_emissions as ValueAndUnit;
        v.value += a.result.emissions.amount.value;
        d.content.push(a);
        if (!d.from_date || d.from_date > fd) {
          d.from_date = fd;
        }
        if (!d.thru_date || d.thru_date < td) {
          d.thru_date = td;
        }
        prev[t] = d;
      }
      return prev;
    }, {});
}

export type GroupedResult = {
  total_emissions: ValueAndUnit;
  content: ProcessedActivity[];
  from_date?: Date,
  thru_date?: Date,
  token?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type GroupedResults = {
  [key: string]: GroupedResult | GroupedResults | ProcessedActivity[];
};

export async function issue_tokens(
  doc: GroupedResult,
  activity_type: string,
  publicKeys: string[],
  queue: boolean,
  input_data: string,
  mode = null
) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const h = hash_content(content);
  // save into IPFS
  const ipfs_res = await uploadFileEncrypted(content, publicKeys);
  // issue tokens
  const total_emissions_rounded = Math.round(total_emissions * 1000) / 1000;
  
  const metadata = {
    "Total emissions": total_emissions_rounded,
    "UOM": "kgCO2e",
    "scope": 3,
    "type": activity_type
  }
  if(mode) {
    metadata['Mode'] = mode;
  }

  if (queue) {
    await create_emissions_request(
      activity_type,
      doc.from_date,
      doc.thru_date,
      total_emissions,
      JSON.stringify(metadata),
      `${h.value}`,
      ipfs_res.path,
      input_data,
      publicKeys[0],
      null);
    return {"tokenId": "queued"};
  } else {
    const token_res = await issue_emissions_tokens(
      activity_type,
      doc.from_date,
      doc.thru_date,
      total_emissions,
      JSON.stringify(metadata),
      `${h.value}`,
      ipfs_res.path,
      publicKeys[0]
    );
    doc.token = token_res;
    return token_res;
  }
}

export async function issue_tokens_with_issuee(
  issuedFrom: string,
  issuedTo: string,
  doc: GroupedResult,
  activity_type: string,
  publicKeys: string[],
  mode = null
) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const h = hash_content(content);
  // save into IPFS
  const ipfs_res = await uploadFileEncrypted(content, publicKeys);
  // issue tokens
  const total_emissions_rounded = Math.round(total_emissions * 1000) / 1000;
  
  const metadata = {
    "Total emissions": total_emissions_rounded,
    "UOM": "kgCO2e",
    "Scope": 3,
    "Type": activity_type
  }
  if(mode) {
    metadata['Mode'] = mode;
  }

  const token_res = await issue_emissions_tokens_with_issuee(
    activity_type,
    doc.from_date,
    doc.thru_date,
    issuedFrom,
    issuedTo,
    total_emissions,
    JSON.stringify(metadata),
    `${h.value}`,
    ipfs_res.path,
    publicKeys[0]
  );
  doc.token = token_res;
  return token_res;
}

export async function create_emissions_request(
  activity_type: string,
  from_date: Date,
  thru_date: Date,
  total_emissions: number,
  metadata: string,
  hash: string,
  ipfs_path: string,
  input_data: string,
  publickey_name: string,
  issuee: string
) {
  issuee = issuee || process.env.ETH_ISSUE_TO_ACCT;
  const status = 'CREATED';
  const publickey = readFileSync(publickey_name, 'utf8');

  console.log('Create Emissions Request ...');

  const f_date = from_date || new Date();
  const t_date = thru_date || new Date();
  const tokens = new BigNumber(Math.round(total_emissions));

  const manifest = create_manifest(publickey_name, ipfs_path, hash);

  const payload: EmissionsRequestPayload = {
    input_data: input_data,
    public_key: publickey,
    public_key_name: publickey_name,
    issuee: issuee,
    status: status,
    token_from_date: f_date,
    token_thru_date: t_date,
    token_total_emissions: tokens.toNumber(),
    token_metadata: metadata,
    token_manifest: JSON.stringify(manifest),
    token_description: `Emissions from ${activity_type}`
  }

  const db = await getDBInstance();
  await db.getEmissionsRequestRepo().insert(payload);
}

function create_manifest(publickey_name: string, ipfs_path: string, hash: string) {
  return {
    "Public Key": publickey_name,
    "Location": `ipfs://${ipfs_path}`,
    "SHA256": hash
  };
}

function get_random_auditor(auditors) {
  if (auditors && auditors.length > 0) {
    if (auditors.length == 1) {
      return auditors[0];
    } else {
      const idx = Math.floor(Math.random() * auditors.length);
      return auditors[idx];
    }
  }

  return null;
}

export async function process_emissions_requests() {
  const db = await getDBInstance();
  const emissions_requests = await db.getEmissionsRequestRepo().selectCreated();
  if (emissions_requests && emissions_requests.length > 0) {
      const auditors = await getEmissionsAuditors();
      if (auditors && auditors.length > 0) {
        // get auditors with public keys
        const active_auditors = [];
        for (const a in auditors) {
          if (auditors[a].public_key) {
            active_auditors.push(auditors[a]);
          }
        }
        if (active_auditors.length > 0) {
          // process from created to pending
          for (const e in emissions_requests) {
              const er = emissions_requests[e];
              console.log("Process emission request: ", er.uuid);
              const auditor = get_random_auditor(active_auditors);
              if (auditor) {
                console.log('Randomly selected auditor: ', auditor.address);
                // encode input_data and post it into ipfs
                const ipfs_res = await uploadFileEncrypted(er.input_data, [auditor.public_key], true);
                await db.getEmissionsRequestRepo().updateToPending(er.uuid, auditor.address, ipfs_res.path);
              } else {
                console.log('Cannot select auditor.');
              }
          }
        } else {
          console.log('There are no auditors with public key.');
        }
      } else {
         console.log('There are no auditors.');
      }
  } else {
      console.log('There are no emissions requests to process.');
  }
}

export async function decline_emissions_request(uuid: string) {
  const db = await getDBInstance();
  const emissions_request = await db.getEmissionsRequestRepo().selectEmissionsRequest(uuid);
  if (emissions_request) {
    // check status is correct
    if (emissions_request.status == 'PENDING') {
        await db.getEmissionsRequestRepo().updateToDeclined(uuid);
    } else {
        throw new Error(`Emissions request status is ${emissions_request.status}, expected PENDING`);
    }
  } else {
    throw new Error(`Cannot get emissions request ${uuid}`);
  }
}

export async function issue_emissions_request(uuid: string) {
  if (!logger_setup) {
    setup(LOG_LEVEL, LOG_LEVEL);
    logger_setup = true;
  }
  const db = await getDBInstance();
  const emissions_request = await db.getEmissionsRequestRepo().selectEmissionsRequest(uuid);
  if (emissions_request) {
    // check status is correct
    if (emissions_request.status == 'PENDING') {
      const fd = Math.floor(emissions_request.token_from_date.getTime() / 1000);
      const td = Math.floor(emissions_request.token_thru_date.getTime() / 1000);
      const token = await gateway_issue_token(
        emissions_request.issuedFrom,
        emissions_request.issuedTo,
        emissions_request.token_total_emissions,
        fd,
        td,
        emissions_request.token_manifest,
        emissions_request.token_metadata,
        emissions_request.token_description
      );
      if (token) {
        await db.getEmissionsRequestRepo().updateToIssued(uuid);
        return token;
      } else {
        throw new Error(`Cannot issue a token for emissions request ${uuid}`);
      }
    } else {
      throw new Error(`Emissions request status is ${emissions_request.status}, expected PENDING`);
    }
  } else {
    throw new Error(`Cannot get emissions request ${uuid}`);
  }
}

export async function get_auditor_emissions_requests(auditor: string) {
  const db = await getDBInstance();
  return await db.getEmissionsRequestRepo().selectByEmissionAuditor(auditor);
}

