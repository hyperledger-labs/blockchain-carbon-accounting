import { BigNumber } from "bignumber.js";
import BCGatewayConfig from "../../emissions-data/typescript_app/src/blockchain-gateway/config";
import {
  IEthNetEmissionsTokenIssueInput,
  IEthTxCaller,
} from "../../emissions-data/typescript_app/src/blockchain-gateway/I-gateway";
import EthNetEmissionsTokenGateway from "../../emissions-data/typescript_app/src/blockchain-gateway/netEmissionsTokenNetwork";
import Signer from "../../emissions-data/typescript_app/src/blockchain-gateway/signer";
import { setup } from "../../emissions-data/typescript_app/src/utils/logger";
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
import * as carrier_emission_factors from "../data/carrier_service_mapping.json"
import * as flight_emission_factors from "../data/flight_service_mapping.json"

let logger_setup = false;
const LOG_LEVEL = "silent";

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

export function calc_flight_emissions(
  passengers: number,
  seat_class: string,
  distance: Distance
): Emissions {
  const distance_km = distance_in_km(distance);
  // lookup the factor for different class
  const f = get_flight_emission_factor(seat_class);
  // assume the factor uom is in person.km here
  const emissions = passengers * distance_km * f.amount;
  // assume all factors produce kgCO2e
  return { amount: { value: emissions, unit: "kgCO2e" }, factor: f };
}

export function calc_freight_emissions(
  weight_kg: number,
  distance: Distance
): Emissions {
  const distance_km = distance_in_km(distance);
  // lookup factor for different 'mode'
  const f = get_freight_emission_factor(distance.mode);
  // most uom should be in tonne.km here
  const convert = get_convert_kg_for_uom(f.uom);
  const emissions = weight_kg * convert * distance_km * f.amount;
  // assume all factors produce kgCO2e
  return { amount: { value: emissions, unit: "kgCO2e" }, factor: f };
}

export async function issue_emissions_tokens(
  total_emissions: number,
  metadata: string,
  hash: string,
  ipfs_path: string
) {
  if (!logger_setup) {
    setup(LOG_LEVEL, LOG_LEVEL);
    logger_setup = true;
  }
  const tokens = new BigNumber(Math.round(total_emissions));
  const bcConfig = new BCGatewayConfig();
  const ethConnector = await bcConfig.ethConnector();
  const signer = new Signer("vault", bcConfig.inMemoryKeychainID, "plain");
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
    addressToIssue: process.env.ETH_ISSUEE_ACCT || "",
    quantity: tokens.toNumber(),
    fromDate: nowTime,
    thruDate: nowTime,
    automaticRetireDate: 0,
    manifest: `ipfs://${ipfs_path} ${hash}`,
    metadata: metadata,
    description: "Emissions from shipments",
  };
  const token = await gateway.issue(caller, input);
  return token;
}

export async function issue_emissions_tokens_with_issuee(
  issuee: string,
  total_emissions: number,
  metadata: string,
  hash: string,
  ipfs_path: string
) {
  if (!logger_setup) {
    setup(LOG_LEVEL, LOG_LEVEL);
    logger_setup = true;
  }
  const tokens = new BigNumber(Math.round(total_emissions));
  const bcConfig = new BCGatewayConfig();
  const ethConnector = await bcConfig.ethConnector();
  const signer = new Signer("vault", bcConfig.inMemoryKeychainID, "plain");
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
    addressToIssue: issuee,
    quantity: tokens.toNumber(),
    fromDate: nowTime,
    thruDate: nowTime,
    automaticRetireDate: 0,
    manifest: `ipfs://${ipfs_path} ${hash}`,
    metadata: metadata,
    description: "Emissions from shipments",
  };
  try {
    const token = await gateway.issue(caller, input);
    return token;
  } catch (error) {
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
    const emissions = calc_freight_emissions(weight, distance);
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
  const emissions = calc_flight_emissions(number_of_passengers, seat_class, distance);
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

export function group_processed_activities(activities: ProcessedActivity[]) {
  return activities
    .filter((a) => !a.error)
    .reduce((prev: GroupedResults, a) => {
      const t = a.activity.type;
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
        g[m] = d;
      } else {
        const d = (prev[t] || {
          total_emissions: { value: 0.0, unit: "kgCO2e" },
          content: [],
        }) as GroupedResult;
        const v = d.total_emissions as ValueAndUnit;
        v.value += a.result.emissions.amount.value;
        d.content.push(a);
        prev[t] = d;
      }
      return prev;
    }, {});
}

export type GroupedResult = {
  total_emissions: ValueAndUnit;
  content: ProcessedActivity[];
  token?: any;
};

export type GroupedResults = {
  [key: string]: GroupedResult | GroupedResults | ProcessedActivity[];
};

export async function issue_tokens(
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
  
  // target format [{key: "key", value: "value"}, {,,,}]
  const metadata = [
    {key: "Total emissions", value: total_emissions_rounded},
    {key: "UOM", value: "kgCO2e"},
    {key: "Scope", value: 3},
    {key: "Type", value: activity_type}
  ];
  if(mode) {
    metadata.push({key: "Mode", value: mode});
  }
  
  const token_res = await issue_emissions_tokens(
    total_emissions,
    JSON.stringify(metadata),
    `${h.type}:${h.value}`,
    ipfs_res.path
  );
  doc.token = token_res;
  return token_res;
}

export async function issue_tokens_with_issuee(
  issuee: string,
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
  
  // target format [{key: "key", value: "value"}, {,,,}]
  const metadata = [
    {key: "Total emissions", value: total_emissions_rounded},
    {key: "UOM", value: "kgCO2e"},
    {key: "Scope", value: 3},
    {key: "Type", value: activity_type}
  ];
  if(mode) {
    metadata.push({key: "Mode", value: mode});
  }
  
  const token_res = await issue_emissions_tokens_with_issuee(
    issuee,
    total_emissions,
    JSON.stringify(metadata),
    `${h.type}:${h.value}`,
    ipfs_res.path
  );
  doc.token = token_res;
  return token_res;
}
