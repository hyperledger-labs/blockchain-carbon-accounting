import { Wallet } from "@blockchain-carbon-accounting/data-postgres/src/models/wallet";
import { PostgresDBService } from "@blockchain-carbon-accounting/data-postgres/src/postgresDbService";
import BCGatewayConfig from "@blockchain-carbon-accounting/blockchain-gateway-lib/src/blockchain-gateway/config";
import {
    IEthNetEmissionsTokenIssueInput,
    IEthTxCaller
} from "@blockchain-carbon-accounting/blockchain-gateway-lib/src/blockchain-gateway/I-gateway";
import EthNetEmissionsTokenGateway from "@blockchain-carbon-accounting/blockchain-gateway-lib/src/blockchain-gateway/netEmissionsTokenNetwork";
import Signer from "@blockchain-carbon-accounting/blockchain-gateway-lib/src/blockchain-gateway/signer";
import type { EmissionsFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib/src/emissionsFactor";
import { BigNumber } from "bignumber.js";
import { existsSync, readFileSync } from "fs";
import { extname, resolve } from "path";
import {
    Activity,
    ActivityResult,
    Distance, ElectricityActivity, Emissions,
    EmissionsFactorActivity, FlightActivity,
    is_electricity_activity, is_emissions_factor_activity,
    is_flight_activity, is_natural_gas_activity,
    is_other_activity, is_shipment_activity, MetadataType,
    NaturalGasActivity, OtherActivity, ProcessedActivity,
    ShipmentActivity, ShippingMode, ValueAndUnit
} from "./common-types";
import { hash_content } from "./crypto-utils";
import { calc_direct_distance, calc_distance } from "./distance-utils";
import { uploadFileRSAEncrypted, uploadFileWalletEncrypted } from "./ipfs-utils";
import { get_ups_client, get_ups_shipment } from "./ups-utils";

async function getDBInstance() {
  return await PostgresDBService.getInstance();
}

export function emissions_in_kg_to_tokens(emissions: number) {
  return new BigNumber(Math.round(emissions * 1000));
}

export function weight_in_uom(weight: number, uom: string, to_uom: string) {
  const w1 = weight_in_kg(weight, uom)
  const w2 = weight_in_kg(1, to_uom)
  //eg: 1 g is 0.001 kg
  //eg: 1 tonne is 1000 kg
  //eg: so 1g is 1*0.001/1000 tonne
  return w1 / w2;
}

export function weight_in_kg(weight?: number, uom?: string) {
  if (!weight) throw new Error(`Invalid weight ${weight}`);
  if (!uom) return weight;
  // check supported UOMs
  const u = uom.toLowerCase();
  if (u === "kg") return weight;
  if (u === "lb" || u === "lbs" || u === "pound") return weight * 0.453592;
  if (u === "t" || u === "tonne" || u === "tons") return weight * 1000.0;
  if (u === "g") return weight / 1000.0;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported`);
}

// use this to convert kg into the emission factor uom, most should be 'tonne.kg'
// but also support different weight uoms
function get_convert_kg_for_uom(uom: string): number {
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

export function distance_object_in_km(distance: Distance): number {
  return distance_in_km(distance.value, distance.unit);
}

export function distance_in_km(distance: number, unit?: string): number {
  if (!unit || unit === "km") return distance;
  if (unit === "mi" || unit === "miles") return distance* 1.60934;
  // not recognized
  throw new Error(`Distance UOM ${unit} not supported`);
}

export function distance_in_uom(distance: number, uom: string, to_uom: string) {
  const d1 = distance_in_km(distance, uom)
  const d2 = distance_in_km(1, to_uom)
  return d1 / d2;
}

export async function get_freight_emission_factor(mode: string) {
  const db = await getDBInstance();
  const f = await db.getActivityEmissionsFactorLookupRepo().getActivityEmissionsFactorLookup('carrier', mode);
  if (!f) {
    throw new Error(`Distance mode ${mode} not supported`);
  }
  return f;
}

export async function get_flight_emission_factor(seat_class: string) {
  const db = await getDBInstance();
  const f = await db.getActivityEmissionsFactorLookupRepo().getActivityEmissionsFactorLookup('flight', seat_class);
  if (!f) {
    throw new Error(`Flight class ${seat_class} not supported`);
  }
  return f;
}

async function getEmissionFactor(f: Partial<EmissionsFactorInterface>) {
  const db = await getDBInstance();
  const factors = await db.getEmissionsFactorRepo().getEmissionsFactors(f);
  if (factors && factors.length) {
    return factors[0];
  }

  return null;
}

export async function calc_flight_emissions(
  passengers: number,
  seat_class: string,
  distance: Distance,
  year?: string | undefined
): Promise<Emissions> {
  const distance_km = distance_object_in_km(distance);
  // lookup the factor for different class
  const f = await get_flight_emission_factor(seat_class);
  // assume the factor uom is in passenger.km here
  if (f.activity_uom !== 'passenger.km') {
    throw new Error(`Expected flight emission factor uom to be passenger.km but got ${f.activity_uom}`);
  }
  let factor;
  if (year) {
    const data = {...f} as Partial<EmissionsFactorInterface>;
    data.year = year;
    factor = await getEmissionFactor(data);
    if (!factor) {
      factor = await getEmissionFactor(f);
    }
  } else {
    factor = await getEmissionFactor(f);
  }

  if (!factor) {
    throw new Error(`Cannot find emissions factor for ${f}`);
  }
  if (!factor.co2_equivalent_emissions) {
    throw new Error(`Found factor does not have a co2_equivalent_emissions ${factor.uuid}`);
  }
  const emissions = passengers * distance_km * parseFloat(factor.co2_equivalent_emissions);
  // convert all factors into kgCO2e based on co2_equivalent_emissions_uom
  let uom = factor.co2_equivalent_emissions_uom
  if (uom) {
    // remove co2e from the weight uom if present
    uom = uom.toLowerCase().replace(/co2.*/, '')
  }
  return { amount: { value: weight_in_kg(emissions, uom), unit: "kgCO2e" }, factor };
}

export async function calc_freight_emissions(
  weight_kg: number,
  distance: Distance,
  year?: string | undefined
): Promise<Emissions> {
  const distance_km = distance_object_in_km(distance);
  // lookup factor for different 'mode'
  const f = await get_freight_emission_factor(distance.mode);

  // most uom should be in tonne.km here
  const convert = get_convert_kg_for_uom(f.activity_uom);
  let factor;

  if (year) {
    const data = {...f} as Partial<EmissionsFactorInterface>;
    data.year = year;
    factor = await getEmissionFactor(data);
    if (!factor) {
      factor = await getEmissionFactor(f);
    }
  } else {
    factor = await getEmissionFactor(f);
  }

  if (!factor) {
    throw new Error(`Cannot find emissions factor for ${f}`);
  }
  if (!factor.co2_equivalent_emissions) {
    throw new Error(`Found factor does not have a co2_equivalent_emissions ${factor.uuid}`);
  }
  const emissions = weight_kg * convert * distance_km * parseFloat(factor.co2_equivalent_emissions);
  // assume all factors produce kgCO2e
  return { amount: { value: emissions, unit: "kgCO2e" }, factor };
}

export async function issue_emissions_tokens(
  activity_type: string,
  from_date: Date,
  thru_date: Date,
  total_emissions_in_kg: number,
  metadata: string,
  hash: string,
  ipfs_path: string,
  publicKey: string,
  issued_from?: string,
  issued_to?: string,
) {
  return await issue_emissions_tokens_with_issuee(
    activity_type,
    from_date,
    thru_date,
    issued_from || process.env.ETH_ISSUE_FROM_ACCT || "",
    issued_to || process.env.ETH_ISSUE_TO_ACCT || "",
    total_emissions_in_kg,
    metadata,
    hash,
    ipfs_path,
    publicKey
  );
}

export async function issue_emissions_request(uuid: string) {
  const db = await getDBInstance();
  const emissions_request = await db.getEmissionsRequestRepo().selectEmissionsRequest(uuid);
  if (!emissions_request) {
    throw new Error(`Cannot get emissions request ${uuid}`);
  }
  // check status is correct
  if (emissions_request.status !== 'PENDING') {
    throw new Error(`Emissions request status is ${emissions_request.status}, expected PENDING`);
  }
  if (!emissions_request.issued_from) {
    throw new Error(`Emissions request does not have an issued_from set`);
  }
  const fd = emissions_request.token_from_date?Math.floor(emissions_request.token_from_date.getTime() / 1000):0;
  const td = emissions_request.token_thru_date?Math.floor(emissions_request.token_thru_date.getTime() / 1000):0;
  const token = await gateway_issue_token(
    emissions_request.issued_from,
    emissions_request.issued_to,
    emissions_request.token_total_emissions,
    fd,
    td,
    emissions_request.token_manifest||'',
    emissions_request.token_metadata||'',
    emissions_request.token_description||''
  );
  if (token) {
    return await db.getEmissionsRequestRepo().updateToIssued(uuid);
  } else {
    throw new Error(`Cannot issue a token for emissions request ${uuid}`);
  }
}

export async function issue_emissions_tokens_with_issuee(
  activity_type: string,
  from_date: Date,
  thru_date: Date,
  issuedFrom: string,
  issuedTo: string,
  total_emissions_in_kg: number,
  metadata: string,
  hash: string,
  ipfs_path: string,
  publicKey: string
) {
  const tokens = emissions_in_kg_to_tokens(total_emissions_in_kg);
  const f_date = from_date || new Date();
  const t_date = thru_date || new Date();
  const fd = Math.floor(f_date.getTime() / 1000);
  const td = Math.floor(t_date.getTime() / 1000);
  const manifest = create_manifest(publicKey, ipfs_path, hash);
  const description = `Emissions from ${activity_type}`;

  return await gateway_issue_token(issuedFrom, issuedTo, BigInt(tokens.toNumber()), fd, td, JSON.stringify(manifest), metadata, description);
}

async function gateway_issue_token(
  issuedFrom: string,
  issuedTo: string,
  quantity_of_tokens: bigint,
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
    quantity: quantity_of_tokens,
    fromDate: fromDate,
    thruDate: thruDate,
    manifest: manifest,
    metadata: metadata,
    description: description
  };
  try {
    return await gateway.issue(caller, input);
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message)
    else throw new Error(String(error));
  }
}

export async function process_shipment(
  a: ShipmentActivity
): Promise<ActivityResult> {
  let year;
  if (a.thru_date) {
     year = new Date(a.thru_date).getFullYear().toString();
  }
  if (a.carrier === "ups") {
    const uc = get_ups_client();
    const shipment = await get_ups_shipment(uc, a.tracking, year);
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
    const emissions = await calc_freight_emissions(weight, distance, year);
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
  let year;
  if (a.thru_date) {
    year = new Date(a.thru_date).getFullYear().toString();
  }
  const emissions = await calc_flight_emissions(number_of_passengers, seat_class, distance, year);
  return { distance, flight: { number_of_passengers, class: seat_class }, emissions };
}

export async function process_natural_gas(
  a: NaturalGasActivity
): Promise<ActivityResult> {
  return process_emissions_factor({
    ...a,
    activity_uom: 'cubic metres',
    activity_amount: Number(a.activity_amount) * 2.83,
    level_1: 'FUELS',
    level_2: 'GASEOUS FUELS',
    level_3: 'NATURAL GAS'
  })
}

export async function process_electricity(
  a: ElectricityActivity
): Promise<ActivityResult> {
  const from_year = a.from_date?.getFullYear()?.toString()
  const thru_year = a.thru_date?.getFullYear()?.toString()
  // for non UNITED STATES, use the emissions factor
  // from EEA EMISSIONS FACTORS
  if (a.country !== 'UNITED STATES') {
    return process_emissions_factor({
      ...a,
      level_1: 'EEA EMISSIONS FACTORS',
      level_2: a.country,
      level_3: 'COUNTRY: ' + a.country,
    })
  } else {
    // for UNITED STATES, use the Utility lookup
    if (!a.utility) throw new Error('Utility field is required');
    const db = await getDBInstance();
    const utility = await db.getUtilityLookupItemRepo().getUtilityLookupItem(a.utility);
    if (!utility) throw new Error(`Utility [${a.utility}] not found`);
    // if no state then use the country factor
    const level_1 = 'eGRID EMISSIONS FACTORS';
    const level_2 = 'USA';
    let level_3 = utility.state_province ? 'STATE: ' + utility.state_province : 'COUNTRY: USA';
    // not all states have a factor, so lookup the factor here and if not found use the country factor
    // those factors are in MWH instead of KWH
    const activity_uom = 'mwh'
    const activity_amount = Number(a.activity_amount) / 1000.0;
    let factor = await getEmissionFactor({
      ...a,
      from_year,
      thru_year,
      activity_uom,
      level_1,
      level_2,
      level_3,
    });
    if (!factor) {
      level_3 = 'COUNTRY: USA';
      factor = await getEmissionFactor({
        ...a,
        from_year,
        thru_year,
        activity_uom,
        level_1,
        level_2,
        level_3,
      });
    }

    // from Utility, go to Utility Lookup Item to look up the state_province, and then look for the emissions_factor
    // eGRID EMISSIONS FACTORS
    // USA
    // STATE: + state_province
    return process_emissions_factor({
      ...a,
      activity_amount,
      activity_uom,
      emissions_factor_uuid: factor?.uuid,
      level_1,
      level_2,
      level_3,
    })
  }
}

export async function process_emissions_factor(
  a: EmissionsFactorActivity
): Promise<ActivityResult> {

  let from_year;
  if (a.from_date) {
    from_year = new Date(a.from_date).getFullYear().toString()
  }
  let thru_year;
  if (a.thru_date) {
    thru_year = new Date(a.thru_date).getFullYear().toString()
  }
  const db = await getDBInstance();
  // support a lookup by given uuid or by levels/scope/text
  let factor;
  if (a.emissions_factor_uuid) {
    factor = await db.getEmissionsFactorRepo().getEmissionFactor(a.emissions_factor_uuid);
  } else {
    if (a.thru_date) {
      const data = {...a, from_year, thru_year} as Partial<EmissionsFactorInterface>;
      factor = await getEmissionFactor(data);
    }
    if (!factor) {
      factor = await getEmissionFactor(a);
    }
  }
  if (!factor) {
    if (a.emissions_factor_uuid) {
      throw new Error(`Emissions factor [${a.emissions_factor_uuid}] not found`)
    } else {
      throw new Error(`Emissions factor for [${JSON.stringify(a)}] not found`)
    }
  }
  if (!factor.co2_equivalent_emissions || !factor.co2_equivalent_emissions_uom) {
    throw new Error(`Found emissions factor does not have a co2_equivalent_emissions ${factor.uuid}`);
  }
  if (!factor.activity_uom) {
    throw new Error(`Found emissions factor does not have an activity_uom ${factor.uuid}`);
  }
  // figure out which UOMs are needed:
  const luoms = factor.activity_uom.toLowerCase().split('.')
  let amount = Number(factor.co2_equivalent_emissions);
  // normalize the outputs
  let distance_km = 0;
  let weight_kg = 0;

  let has_passengers = false;
  let has_weight = false;
  let has_amount = false;
  let has_distance = false;
  for (const uom of luoms) {
    if (uom === 'passenger') {
      if (!a.number_of_passengers) {
        throw new Error(`This emissions factor requires a number_of_passengers input`);
      }
      amount *= a.number_of_passengers;
      has_passengers = true;
    } else if (uom === 'kg' || uom === 'tonne' || uom === 'tons' || uom === 'lbs') {
      if (!a.weight || !a.weight_uom) {
        throw new Error(`This emissions factor requires a weight and weight_uom inputs`);
      }
      amount *= weight_in_uom(a.weight, a.weight_uom, uom)
      weight_kg = weight_in_kg(a.weight, a.weight_uom)
      has_weight = true;
    } else if (uom === 'km' || uom === 'miles' || uom === 'mi') {
      if (!a.distance || !a.distance_uom) {
        throw new Error(`This emissions factor requires a distance and distance_uom inputs`);
      }
      amount *= distance_in_uom(a.distance, a.distance_uom, uom)
      distance_km = distance_in_km(a.distance, a.distance_uom)
      has_distance = true;
    } else {
      if (!a.activity_amount || !a.activity_uom) {
        throw new Error(`This emissions factor requires an activity_amount and activity_uom inputs`);
      }
      amount *= a.activity_amount
      has_amount = true;
    }
  }
  // convert all factors into kgCO2e based on co2_equivalent_emissions_uom
  let uom = factor.co2_equivalent_emissions_uom
  if (uom) {
    // remove co2e from the weight uom if present
    uom = uom.toLowerCase().replace(/co2.*/, '')
  }
  const emissions: Emissions = {
    amount: {
      value: weight_in_kg(amount, uom),
      unit: "kgCO2e"
    },
    factor
  }
  const results: {
    emissions: Emissions,
    distance?: Distance,
    flight?: {number_of_passengers: number, class?: string},
    weight?: ValueAndUnit,
    amount?: ValueAndUnit,
  } = { emissions };
  if (has_distance) {
    const distance: Distance = {
      mode: 'air',
      unit: 'km',
      value: distance_km,
    }
    results.distance = distance;
  }
  if (has_passengers && a.number_of_passengers) {
    const flight = {
      number_of_passengers: a.number_of_passengers,
      class: a.class,
    }
    results.flight = flight;
  }
  if (has_amount && a.activity_uom && a.activity_amount) {
    const amount = {
      value: a.activity_amount,
      unit: a.activity_uom,
    }
    results.amount = amount;
  }
  if (has_weight) {
    const weight = {
      value: weight_kg,
      unit: 'kg',
    }
    results.weight = weight;
  }
  // handle other cases
  // the mode should be from factor levels
  if (!has_passengers && results.distance) results.distance.mode = get_mode_from_factor(factor)

  return results;
}

export async function process_other(
  a: OtherActivity
): Promise<ActivityResult> {

  const emissions: Emissions = {
    amount: {
      value: 0.00,
      unit: "kgCO2e"
    }
  }
  const results: {
    emissions: Emissions,
  } = { emissions };

  return results;
}

export async function process_activity(activity: Activity) {
  // all activity must have an ID
  if (!activity.id) {
    throw new Error("Activity must have an id");
  }
  if (is_shipment_activity(activity)) {
    return await process_shipment(activity);
  } else if (is_flight_activity(activity)) {
    return await process_flight(activity);
  } else if (is_emissions_factor_activity(activity)) {
    return await process_emissions_factor(activity);
  } else if (is_natural_gas_activity(activity)) {
    return await process_natural_gas(activity);
  } else if (is_electricity_activity(activity)) {
    return await process_electricity(activity);
  } else if (is_other_activity(activity)) {
    return await process_other(activity);
  } else {
    throw new Error('activity not recognized');
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
        const errMsg = (error instanceof Error)?error.message:JSON.stringify(error);
        return { activity, error: errMsg };
      }
    })
  );
}

function read_date(v: string | Date | undefined, default_date?: Date) {
  if (!v) return default_date || new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v as string);
  throw new Error('Cannot read as a Date: ' + v);
}

/** Group a list of processed activities by `activity_type`, and shipments are further grouped by mode.
    We then also need to group by `issued_from` which will be either the given `issued_from` or
    the carrier for activities that have carriers like shipments and flights looked up Wallet
    or the environment variable `ETH_ISSUE_FROM_ACCT`.
    @param activities: the list of activities to grouped
    @returns a map of `activity_type` (top map of shipment mode if activity type is "shipment") to map of `issued_from` to list of activities
*/
export async function group_processed_activities(activities: ProcessedActivity[], default_issued_from?: string) {
  const default_grouped_emissions = () => ({
    total_emissions: { value: 0.0, unit: "kgCO2e" },
    content: [],
  });
  const set_dates = (d: GroupedResult, fd: Date, td: Date) => {
    if (!d.from_date || d.from_date > fd) {
      d.from_date = fd;
    }
    if (!d.thru_date || d.thru_date < td) {
      d.thru_date = td;
    }
  }
  const add_emissions = (d: GroupedResult, a: ProcessedActivity) => {
    if (!a.result) return;
    d.total_emissions.value += a.result.emissions?.amount?.value??0;
    d.content.push(a);
  }
  const set_issued_from = async (a: ProcessedActivity) => {
    let issued_from: string | undefined = undefined;
    const activity = a.activity;
    if (activity.issued_from) {
      // activity already has an issued_from set
      return activity.issued_from;
    }
    const db = await getDBInstance();
    if (is_shipment_activity(activity)) {
      if (activity.carrier) {
        // lookup a shipment carrier
        const wallets = await db.getWalletRepo().lookupPaginated(0, 1, activity.carrier);
        if (wallets && wallets[0]?.address) {
          issued_from = wallets[0]?.address;
        }
      }
    } else if (is_flight_activity(activity)) {
      if (activity.carrier) {
        // lookup a shipment carrier
        const wallets = await db.getWalletRepo().lookupPaginated(0, 1, activity.carrier);
        if (wallets && wallets[0]?.address) {
          issued_from = wallets[0]?.address;
        }
      }
    }
    if (issued_from) {
      // we found a wallet from the carrier
      activity.issued_from = issued_from;
    } else {
      // else use the default from the env variable
      activity.issued_from = default_issued_from || '';
    }
    return activity.issued_from;
  }
  const activities_async = await Promise.all(activities
    .filter((a) => !a.error)
    .map(async (a) => {
      await set_issued_from(a);
      return a;
    }))
  return activities_async
    .reduce((prev: GroupedResults, a) => {
      const t = a.activity.type;
      if (!a.result) {
        return prev;
      }
      const fd = read_date(a.activity.from_date);
      const td = read_date(a.activity.thru_date, fd);
      if (t === "shipment") {
        if (!a.result.distance) {
          return prev;
        }
        const m = a.result.distance.mode;
        const gm = (prev[t] || {}) as GroupedResults;
        prev[t] = gm;
        const g = (gm[m] || {}) as GroupedResults;
        gm[m] = g;
        const issued_from = a.activity.issued_from || '';
        const d = (g[issued_from] || default_grouped_emissions()) as GroupedResult;
        add_emissions(d, a);
        set_dates(d, fd, td);
        g[issued_from] = d;
      } else {
        const g = (prev[t] || {}) as GroupedResults;
        prev[t] = g;
        const issued_from = a.activity.issued_from || '';
        const d = (g[issued_from] || default_grouped_emissions()) as GroupedResult;
        add_emissions(d, a);
        set_dates(d, fd, td);
        g[issued_from] = d;
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
  [key:string]: GroupedResult | GroupedResults | ProcessedActivity[];
};

export function make_emissions_metadata(total_emissions: number, activity_type: string, mode?: string) {
  const total_emissions_rounded = Math.round(total_emissions * 1000) / 1000;

  const metadata: MetadataType = {
    "Total emissions": total_emissions_rounded,
    "UOM": "kgCO2e",
    "Scope": 3,
    "Type": activity_type
  }
  if (mode) {
    metadata['Mode'] = mode;
  }
  return metadata;
}

export async function issue_tokens(
  doc: GroupedResult,
  activity_type: string,
  publicKeys: string[],
  encMode: string,
  mode?: string,
  issued_from?: string,
  issued_to?: string,
) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const metadata = make_emissions_metadata(total_emissions, activity_type, mode);

  const h = hash_content(content);
  // save into IPFS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ipfs_res: any = {};
  if (encMode === 'wallet') {
    // get enc pub key from wallet table, use either the metamask key (preferred) or the RSA key
    const db = await getDBInstance();
    const wallet = await db.getWalletRepo().findWalletByAddress(publicKeys[0]);
    if (!wallet) {
      const err = 'Wallet not found: ' + publicKeys[0];
      console.log(err);
      throw new Error(err);
    }
    const pubkey = wallet.metamask_encrypted_public_key || wallet.public_key;
    if (!pubkey) {
      const err = 'Wallet does not have a public key: ' + publicKeys[0];
      console.log(err);
      throw new Error(err);
    }
    if (wallet.metamask_encrypted_public_key) {
      ipfs_res = await uploadFileWalletEncrypted(content, [pubkey], true);
    } else {
      ipfs_res = await uploadFileRSAEncrypted(content, [pubkey], true);
    }
  } else if (encMode === 'metamask') {
    // get enc pub key from wallet table, here only use if it has a metamask key
    const db = await getDBInstance();
    const wallet = await db.getWalletRepo().findWalletByAddress(publicKeys[0]);
    if (!wallet) {
      const err = 'Wallet not found: ' + publicKeys[0];
      console.log(err);
      throw new Error(err);
    }
    const pubkey = wallet.metamask_encrypted_public_key;
    if (!pubkey) {
      const err = 'Wallet does not have a metamask public key: ' + publicKeys[0];
      console.log(err);
      throw new Error(err);
    }
    ipfs_res = await uploadFileWalletEncrypted(content, [pubkey], true);
  } else {
    ipfs_res = await uploadFileRSAEncrypted(content, publicKeys);
  }

  const token_res = await issue_emissions_tokens(
    activity_type,
    doc.from_date||new Date(),
    doc.thru_date||new Date(),
    total_emissions,
    JSON.stringify(metadata),
    `${h.value}`,
    ipfs_res.ipfs_path,
    publicKeys[0],
    issued_from,
    issued_to
  );
  // note: convert the returned issued_from from a BigInt to a string
  // eg: "344073830386746567427978432078835137280280269756" becomes "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"
  // this is because the contract uses an int16 instead of Address type although they are interchangeable
  // the int value allows empty (0).
  if (token_res.issuedFrom) {
    token_res.issuedFrom = '0x' + BigInt(token_res.issuedFrom).toString(16);
  }
  doc.token = token_res;
  return token_res;
}

export async function queue_issue_tokens(
  doc: GroupedResult,
  activity_type: string,
  mode?: string,
  issued_from?: string,
  issued_to?: string,
) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const metadata = make_emissions_metadata(total_emissions, activity_type, mode);

  const request = await create_emissions_request(
    activity_type,
    doc.from_date||new Date(),
    doc.thru_date||new Date(),
    total_emissions,
    JSON.stringify(metadata),
    content,
    issued_from,
    issued_to);
  return {"tokenId": "queued", request };
}

export async function issue_tokens_with_issuee(
  issuedFrom: string,
  issuedTo: string,
  doc: GroupedResult,
  activity_type: string,
  publicKeys: string[],
  mode?: string
) {
  const content = JSON.stringify(doc);
  const total_emissions = doc.total_emissions.value;
  const h = hash_content(content);
  // save into IPFS
  const ipfs_res = await uploadFileRSAEncrypted(content, publicKeys);
  // issue tokens
  const metadata = make_emissions_metadata(total_emissions, activity_type, mode);

  const token_res = await issue_emissions_tokens_with_issuee(
    activity_type,
    doc.from_date||new Date(),
    doc.thru_date||new Date(),
    issuedFrom,
    issuedTo,
    total_emissions,
    JSON.stringify(metadata),
    `${h.value}`,
    ipfs_res.ipfs_path,
    publicKeys[0]
  );
  doc.token = token_res;
  return token_res;
}

export async function create_emissions_request(
  activity_type: string,
  from_date: Date,
  thru_date: Date,
  total_emissions_in_kg: number,
  metadata: string,
  input_content: string,
  issuee_from?: string,
  issuee_to?: string,
) {
  issuee_from = issuee_from || process.env.ETH_ISSUE_FROM_ACCT as string;
  issuee_to = issuee_to || process.env.ETH_ISSUE_TO_ACCT as string;
  const status = 'CREATED';
  const f_date = from_date || new Date();
  const t_date = thru_date || new Date();
  const tokens = emissions_in_kg_to_tokens(total_emissions_in_kg);

  const db = await getDBInstance();
  const em_request = await db.getEmissionsRequestRepo().insert({
    node_id: process.env.APP_NODE_ID,
    input_content: input_content,
    issued_from: issuee_from,
    issued_to: issuee_to,
    status: status,
    token_from_date: f_date,
    token_thru_date: t_date,
    token_total_emissions: BigInt(tokens.toNumber()),
    token_metadata: metadata,
    token_description: `Emissions from ${activity_type}`
  });
  return em_request
}

function create_manifest(
  publickey_name: string | undefined,
  ipfs_path: string,
  hash: string,
  node_id?: string,
  request_uuid?: string
) {
  const manifest: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
    "Public Key": publickey_name ?? 'unknown',
    "Location": ipfs_path,
    "SHA256": hash,
  }
  if (node_id) {
   manifest["node_id"] = node_id;
  }
  if (request_uuid) {
    manifest["request_uuid"] = request_uuid;
  }

  return manifest;
}

function get_random_auditor(auditors: Wallet[]) {
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


function get_upload_doc_path() {
  const upload_dir = (process.env.DOC_UPLOAD_PATH || './upload/');
  // if upload_dir is absolute, always use it
  if (upload_dir.startsWith('/')) return upload_dir;
  // check the path exists
  let upload_doc_path = resolve(upload_dir);
  if (existsSync(upload_doc_path)) return upload_doc_path;
  console.log(`Upload directory ${upload_doc_path} does not exist.`);
  // check if a directory app/api-server exists
  const api_server_dir = resolve('./app/api-server');
  if (existsSync(api_server_dir)) {
    // resolve upload_dir from api_server_dir
    upload_doc_path = resolve(api_server_dir, upload_dir);
    if (existsSync(upload_doc_path)) return upload_doc_path;
    console.log(`Upload directory ${upload_doc_path} does not exist.`);
  }
  console.log(`Cannot find the upload directory, current directory: ${process.cwd()}`);
  return undefined;
}

export async function process_emissions_requests() {
  const db = await getDBInstance();
  const emissions_requests = await db.getEmissionsRequestRepo().selectCreated(true);
  if (!emissions_requests || !emissions_requests.length) {
    console.log('There are no emissions requests to process.');
    return;
  }
  const auditors = await db.getWalletRepo().getAuditorsWithPublicKey();
  if (!auditors || !auditors.length) {
    console.log('There are no auditors with public key.');
    return;
  }
  console.log('Found auditors', auditors.map(w=>`${w.address}: ${w.name || 'anonymous'} with key named ${w.public_key_name}`));
  // process from created to pending
  for (const e in emissions_requests) {
    const er = emissions_requests[e];
    console.log("Processing emission request: ", er.uuid);
    const auditor = get_random_auditor(auditors);
    const pubkey = auditor?.metamask_encrypted_public_key || auditor?.public_key;
    if (!auditor || !pubkey) {
      console.log('Cannot select an auditor with public key.');
      return;
    }
    const pubkey_name = auditor.metamask_encrypted_public_key ? 'metamask' : auditor.public_key_name;
    const encryptFn = auditor.metamask_encrypted_public_key ? uploadFileWalletEncrypted : uploadFileRSAEncrypted;
    console.log('Randomly selected auditor: ', auditor.address);

    // only upload one document
    let uploaded = false;
    let manifest;

    // check if we have a supporting Document for it
    const docs = await db.getEmissionsRequestRepo().selectSupportingDocuments(er);
    const supporting_docs_ipfs_paths: string[] = [];
    const upload_path = get_upload_doc_path();
    for (const doc of docs) {
      if (!upload_path) {
        throw new Error('Cannot find the upload directory.');
      }
      // resolve the file path
      const filename = resolve(upload_path, doc.file.uuid);
      const data = readFileSync(filename);
      // if we want the original filename use doc.file.name directly but this might be suitable
      // in all cases, we only need the file extension so that it can be opened once downloaded
      const file_ext = extname(doc.file.name);
      const ipfs_content = await encryptFn(data, [pubkey], true, `content${file_ext}`);
      const h_content = hash_content(data);
      supporting_docs_ipfs_paths.push(ipfs_content.path);
      console.log(`document [${doc.file.name}]: IPFS ${ipfs_content.path}, Hash: ${h_content.value}`)
      manifest = create_manifest(pubkey_name, ipfs_content.ipfs_path, h_content.value, er.node_id, er.uuid);
      // only upload one document
      uploaded = true;
      if (docs.length > 1) {
        console.error(`Found more than one supporting document, we only support uploading one, other ${docs.length-1} ignored.`)
      }
      break;
    }

    if (!uploaded) {
      // encode input_content and post it into ipfs
      const ipfs_content = await encryptFn(er.input_content, [pubkey], true);
      const h_content = hash_content(er.input_content);
      console.log(`input_content: IPFS ${ipfs_content.path}, Hash: ${h_content.value}`)
      manifest = create_manifest(pubkey_name, ipfs_content.ipfs_path, h_content.value, er.node_id, er.uuid);
    }

    await db.getEmissionsRequestRepo().updateToPending(
      er.uuid,
      auditor.address,
      pubkey,
      pubkey_name,
      JSON.stringify(manifest)
    );
  }
}

export function get_mode_from_factor(factor: EmissionsFactorInterface): ShippingMode {
  const levels = [factor.level_1, factor.level_2, factor.level_3, factor.level_4]
  for (const l of levels) {
    if (!l) continue
    const ll = l.toLowerCase()
    if (ll.includes('air')) return 'air'
    if (ll.includes('ship')) return 'sea'
    if (ll.includes('sea')) return 'sea'
    if (ll.includes('rail')) return 'rail'
    if (ll.includes('truck')) return 'ground'
  }
  return 'ground'
}
